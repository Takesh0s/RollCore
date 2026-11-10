import { test, expect, type Page } from '@playwright/test';
import axios from 'axios';

/**
 * E2E dos mapas (backend real): criar pelo assistente, pintar no editor e salvar, upload de imagem,
 * Oficina da Comunidade e exclusão. Cada teste cria os próprios usuários (nomes únicos); a preparação
 * (contas, mapas publicados) vai pela API e só o que está sendo testado passa pela tela.
 */
const API = process.env.API_URL ?? 'http://localhost:8080';
const PASSWORD = 'Senha123';

// PNG de 1x1 pixel (assinatura válida: o servidor confere os primeiros bytes)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

interface Account { username: string; email: string; token: string }
interface ApiMap { id: string; name: string; layers: string; imageUrl: string | null; published: boolean; gridType: string }

let counter = 0;
function uniqueName(prefix: string) {
  counter += 1;
  return `${prefix}${Date.now().toString(36).slice(-6)}${counter}`.slice(0, 20);
}

async function register(prefix: string): Promise<Account> {
  const username = uniqueName(prefix);
  const email = `${username}@rollcore.test`.toLowerCase();
  const { data } = await axios.post(`${API}/auth/register`, { username, email, password: PASSWORD });
  return { username, email, token: data.accessToken };
}

const auth = (a: Account) => ({ headers: { Authorization: `Bearer ${a.token}` } });

async function myMaps(a: Account) {
  const { data } = await axios.get<ApiMap[]>(`${API}/maps`, auth(a));
  return data;
}

async function createMap(a: Account, name: string) {
  const { data } = await axios.post<ApiMap>(
    `${API}/maps`,
    { name, kind: 'MEDIEVAL', gridType: 'SQUARE', cols: 20, rows: 15, cellSize: 48, layers: '{"cells":{"grass":[1,2,3]}}' },
    auth(a),
  );
  return data;
}

async function loginUi(page: Page, a: Account) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill(a.email);
  await page.getByRole('textbox', { name: '••••••••' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });
}

/** No PC a barra lateral começa fechada: abre pelo hambúrguer e clica no item. */
async function goTo(page: Page, item: string) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu.click();
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: item }).click();
}

/** Arrasta o pincel pelo meio do mapa. */
async function paint(page: Page, mapName: string) {
  const canvas = page.getByRole('img', { name: `Mapa ${mapName}` });
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test.describe('Mapas', () => {
  test('Cria um mapa pelo assistente, pinta e salva', async ({ page }) => {
    const gm = await register('mapa');
    await loginUi(page, gm);
    await goTo(page, 'GM Tools');
    await expect(page.getByRole('heading', { name: 'Nenhum mapa ainda' })).toBeVisible();

    await page.locator('.state-view').getByRole('button', { name: 'Criar mapa' }).click();
    await page.getByLabel('Nome do mapa').fill('Cripta de teste');
    await page.getByRole('button', { name: 'Pirata' }).click();
    await page.getByRole('button', { name: /Hexágonos/ }).click();
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(page.getByRole('img', { name: 'Mapa Cripta de teste' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar mapa' })).toBeDisabled();

    await paint(page, 'Cripta de teste');
    await expect(page.getByRole('button', { name: 'Salvar mapa' })).toBeEnabled();
    await page.getByRole('button', { name: 'Salvar mapa' }).click();
    await expect(page.getByRole('button', { name: 'Salvar mapa' })).toBeDisabled();

    const [saved] = await myMaps(gm);
    expect(saved.name).toBe('Cripta de teste');
    expect(saved.gridType).toBe('HEX');
    expect(JSON.parse(saved.layers).cells.grass.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Sair do editor' }).click();
    await expect(page.getByRole('article', { name: 'Mapa Cripta de teste' })).toBeVisible();
  });

  test('Upload de imagem vira o fundo do mapa', async ({ page }) => {
    const gm = await register('imagem');
    await loginUi(page, gm);
    await goTo(page, 'GM Tools');

    await page.locator('.state-view').getByRole('button', { name: 'Criar mapa' }).click();
    await page.getByLabel('Nome do mapa').fill('Mapa com fundo');
    await page.getByRole('button', { name: /Fazer upload de mapa/ }).click();
    await page.getByLabel('Imagem do mapa').setInputFiles({ name: 'fundo.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByAltText('Prévia da imagem escolhida')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(page.getByRole('img', { name: 'Mapa Mapa com fundo' })).toBeVisible();
    const [saved] = await myMaps(gm);
    expect(saved.imageUrl).toMatch(/^\/images\/[0-9a-f-]{36}$/);
  });

  test('Publica na Oficina e outro mestre copia para a própria biblioteca', async ({ page }) => {
    const author = await register('autor');
    const other = await register('outro');
    const map = await createMap(author, 'Taverna da Oficina');
    await axios.post(`${API}/maps/${map.id}/publish`, null, auth(author));

    await loginUi(page, other);
    await goTo(page, 'GM Tools');
    await page.getByRole('button', { name: 'Oficina da Comunidade' }).click();
    await page.getByLabel('Buscar mapa na Oficina').fill('Taverna da Oficina');
    const card = page.getByRole('article', { name: 'Mapa Taverna da Oficina' });
    await expect(card).toBeVisible();
    await expect(card.getByText(`por ${author.username}`)).toBeVisible();
    await card.getByRole('button', { name: 'Usar este mapa' }).click();

    await expect(page.getByRole('img', { name: 'Mapa Taverna da Oficina (cópia)' })).toBeVisible();
    const copies = await myMaps(other);
    expect(copies.map(m => m.name)).toEqual(['Taverna da Oficina (cópia)']);
    expect(copies[0].published).toBe(false);
    expect((await myMaps(author)).map(m => m.name)).toEqual(['Taverna da Oficina']);
  });

  test('Exclui um mapa pelo editor', async ({ page }) => {
    const gm = await register('excluir');
    await createMap(gm, 'Mapa descartável');
    await loginUi(page, gm);
    await goTo(page, 'GM Tools');

    await page.getByRole('button', { name: 'Editar mapa' }).click();
    await expect(page.getByRole('img', { name: 'Mapa Mapa descartável' })).toBeVisible();
    await page.getByRole('button', { name: 'Excluir mapa' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByRole('heading', { name: 'Nenhum mapa ainda' })).toBeVisible();
    expect(await myMaps(gm)).toHaveLength(0);
  });
});
