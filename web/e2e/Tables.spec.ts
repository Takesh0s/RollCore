import { test, expect, type Page } from '@playwright/test';
import axios from 'axios';

/**
 * E2E dos fluxos de mesa, notificações e evento (backend real).
 * Cada teste cria os próprios usuários (nomes únicos), então não depende de limpeza do banco
 * nem de a ordem dos testes. A preparação (contas, mesa, entrada, evento) vai pela API; só o que
 * está sendo testado passa pela tela.
 */
const API = process.env.API_URL ?? 'http://localhost:8080';
const PASSWORD = 'Senha123';

interface Account { username: string; email: string; token: string }

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

async function createTable(master: Account, name = 'Mesa de teste') {
  const { data } = await axios.post(`${API}/tables`, { name }, auth(master));
  return { id: data.table.id as string, code: data.inviteCode as string, name };
}

async function join(player: Account, code: string) {
  await axios.post(`${API}/tables/join`, { inviteCode: code }, auth(player));
}

async function createEvent(master: Account, tableId: string, title = 'Sessao de teste') {
  const { data } = await axios.post(
    `${API}/tables/${tableId}/events`,
    { title, date: '2030-01-15', start: '20:00', end: '23:00', askRsvp: true },
    auth(master),
  );
  return data.id as string;
}

async function notifications(a: Account) {
  const { data } = await axios.get(`${API}/notifications`, auth(a));
  return data as { items: { type: string; read: boolean }[]; unread: number };
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

async function openFirstTable(page: Page) {
  await goTo(page, 'Mesas');
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Membros' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test.describe('Mesas', () => {
  test('Estado vazio: sem mesas aparece "Nenhuma mesa ainda"', async ({ page }) => {
    const user = await register('vazio');
    await loginUi(page, user);
    await goTo(page, 'Mesas');
    await expect(page.getByRole('heading', { name: 'Nenhuma mesa ainda' })).toBeVisible();
    await expect(page.locator('.state-view').getByRole('button', { name: 'Criar mesa' })).toBeVisible();
  });

  test('Mestre promove um jogador a moderador', async ({ page }) => {
    const master = await register('mestre');
    const player = await register('jogador');
    const table = await createTable(master);
    await join(player, table.code);

    await loginUi(page, master);
    await openFirstTable(page);
    await page.getByRole('button', { name: `Ações de ${player.username}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Promover a moderador' }).click();

    await expect(page.locator('.profile-row', { hasText: player.username }).getByText('Moderador')).toBeVisible();
  });

  test('Perfil na mesa: o nome de exibição vale só nessa mesa', async ({ page }) => {
    const master = await register('mestre');
    await createTable(master);

    await loginUi(page, master);
    await openFirstTable(page);
    await page.getByRole('button', { name: 'Meu perfil na mesa' }).click();
    await page.locator('#my-table-name').fill('Mestre Zeca');
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar perfil' }).click();

    await expect(page.locator('.profile-row', { hasText: 'Mestre Zeca' })).toBeVisible();
  });
});

test.describe('Notificações', () => {
  test('O mestre vê o aviso de entrada de um jogador no sino e na central', async ({ page }) => {
    const master = await register('mestre');
    const player = await register('jogador');
    const table = await createTable(master);
    await join(player, table.code);

    await loginUi(page, master);
    await page.getByRole('button', { name: /Notificações \(1 não lida/ }).click();

    await expect(page.locator('.notif-item', { hasText: `${player.username} entrou na mesa ${table.name}` })).toBeVisible();
    await page.getByRole('button', { name: 'Marcar todas como lidas' }).click();
    await expect(page.locator('.notif-item.unread')).toHaveCount(0);
  });

  test('API: marcar todas como lidas zera o contador', async () => {
    const master = await register('mestre');
    const player = await register('jogador');
    const table = await createTable(master);
    await join(player, table.code);

    expect((await notifications(master)).unread).toBe(1);
    await axios.post(`${API}/notifications/read-all`, undefined, auth(master));
    expect((await notifications(master)).unread).toBe(0);
  });

  test('API: quem silenciou a mesa não recebe aviso de evento', async () => {
    const master = await register('mestre');
    const player = await register('jogador');
    const table = await createTable(master);
    await join(player, table.code);
    await axios.patch(`${API}/tables/${table.id}/members/me`, { muted: true }, auth(player));

    await createEvent(master, table.id);

    const list = await notifications(player);
    expect(list.items.some(n => n.type === 'EVENT_CREATED')).toBe(false);
  });
});

test.describe('Evento', () => {
  test('Novo evento: aviso no Início, página do evento e resposta "Vou"', async ({ page }) => {
    const master = await register('mestre');
    const player = await register('jogador');
    const table = await createTable(master);
    await join(player, table.code);
    await createEvent(master, table.id, 'Sessao 13');

    await loginUi(page, player);
    const popup = page.getByRole('dialog', { name: 'Novo evento na mesa' });
    await expect(popup).toBeVisible();
    await expect(popup).toContainText('Sessao 13');
    await popup.getByRole('button', { name: 'Ir para o evento' }).click();

    await expect(page.getByText('Você vai?')).toBeVisible();
    await expect(page.locator('.evp-stat', { hasText: 'confirmados' }).locator('strong')).toHaveText('1');
    await page.getByRole('button', { name: 'Vou', exact: true }).click();
    await expect(page.locator('.evp-stat', { hasText: 'confirmados' }).locator('strong')).toHaveText('2');
  });
});
