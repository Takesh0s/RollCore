import { test, expect, type Page } from '@playwright/test';
import axios from 'axios';

const API = process.env.API_URL ?? 'http://localhost:8080';

async function createUser() {
  try {
    await axios.post(`${API}/auth/register`, {
      username: 'PlayerOne',
      email: 'Player@rollcore.com',
      password: 'Senha123',
    });
  } catch {
    // usuário já existe (409) — ignorar
  }
}

async function deleteAll() {
  try {
    await axios.delete(`${API}/auth/deleteall`);
  } catch {
    // endpoint pode não existir — ignorar
  }
}

/** Botão "Entrar": só existe na tela de login (o título "RollCore" fica oculto no PC). */
const loginButton = (page: Page) => page.getByRole('button', { name: 'Entrar' });

/** No PC a barra lateral começa fechada: abre pelo hambúrguer e clica no item. */
async function goTo(page: Page, item: string) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu.click();
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: item }).click();
}

/** Lista suspensa do formulário de ficha, achada pelo rótulo (o campo "Sistema" vem antes). */
const pick = (page: Page, label: string) =>
  page.locator('.form-group', { has: page.locator('label', { hasText: new RegExp(`^${label}$`) }) }).locator('select');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
});

// ── HU-01: Autenticação ───────────────────────────────────────────────────

test('Login completamente Invalido', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('emailerrado@email.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('senhaerrada123');
  await page.getByRole('checkbox', { name: 'Mantenha conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(loginButton(page)).toBeVisible();
});

test('Login Parcialmente Invalido', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('senhaerrada123');
  await page.getByRole('checkbox', { name: 'Mantenha conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(loginButton(page)).toBeVisible();
});

test('Login Valido', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Senha123');
  await page.getByRole('checkbox', { name: 'Mantenha conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });
});

test('Criacao de conta e autoLogin', async ({ page }) => {
  await deleteAll();
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('textbox', { name: '3–20 caracteres. Letras, números e _ apenas' }).fill('Usuario1');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Mín. 8 caracteres, 1 maiúscula e 1' }).fill('SenhaPadrao1!');
  await page.locator('input[type="password"]').nth(1).fill('SenhaPadrao1!');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Meu perfil' }).click();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  // The app asks for confirmation before signing out (Figma 25.6).
  await page.getByRole('dialog', { name: 'Sair da conta?' }).getByRole('button', { name: 'Sair da conta' }).click();
  await expect(loginButton(page)).toBeVisible();
});

// ── HU-02: Personagem + Engine D&D 5e ────────────────────────────────────

test('Criacao de personagem e verificacao da Engine', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Senha123');
  await page.getByRole('checkbox', { name: 'Mantenha conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });

  await goTo(page, 'Fichas');
  await page.getByRole('button', { name: 'Nova ficha', exact: true }).click();
  await page.getByRole('textbox', { name: 'Ex: Aragorn' }).fill('Char1');
  await pick(page, 'Classe').selectOption('Ladino');
  await pick(page, 'Raça').selectOption('Draconato');
  await page.getByPlaceholder('1–').first().fill('6');
  await pick(page, 'Subclasse').selectOption('Ladrão');
  await page.getByPlaceholder('1–').nth(1).fill('12');
  await page.getByPlaceholder('1–').nth(2).fill('20');
  await page.getByPlaceholder('1–').nth(3).fill('10');
  await page.getByPlaceholder('1–').nth(4).fill('14');
  await page.getByPlaceholder('1–').nth(5).fill('12');
  await page.locator('.attr-form-grid > div:nth-child(6) > .form-input').fill('13');
  await page.getByRole('button', { name: '⚡ Calcular automaticamente' }).click();
  await page.getByRole('button', { name: 'Criar Personagem' }).click();

  await page.getByRole('button', { name: 'Editar Char1' }).click();
  await page.getByPlaceholder('1–').first().fill('7');
  await page.getByRole('button', { name: '⚡ Calcular automaticamente' }).click();
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();

  await expect(page.getByText('HP Máx.38pontos')).toBeVisible({ timeout: 10_000 });
});

// ── HU-03: Rolagem de dados ───────────────────────────────────────────────

test('Rolagem de dados', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Senha123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });

  await goTo(page, 'Dados');
  await page.getByRole('textbox', { name: 'Fórmula' }).fill('1d20');
  await page.getByRole('button', { name: 'Rolar dados', exact: true }).click();
  await expect(page.locator('.dice-last-detail')).toContainText('1d20 →', { timeout: 10_000 });
});