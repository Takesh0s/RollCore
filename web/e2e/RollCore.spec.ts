import { test, expect } from '@playwright/test';
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
  await page.getByRole('checkbox', { name: 'Manter conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'RollCore' })).toBeVisible();
});

test('Login Parcialmente Invalido', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('senhaerrada123');
  await page.getByRole('checkbox', { name: 'Manter conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'RollCore' })).toBeVisible();
});

test('Login Valido', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Senha123');
  await page.getByRole('checkbox', { name: 'Manter conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 10_000 });
});

test('Criacao de conta e autoLogin', async ({ page }) => {
  await deleteAll();
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('textbox', { name: 'ex: guerreiro_dos_reinos' }).fill('Usuario1');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Mínimo 8 chars, 1 maiúscula,' }).fill('SenhaPadrao1!');
  await page.getByRole('textbox', { name: 'Repita a senha' }).fill('SenhaPadrao1!');
  await page.getByRole('button', { name: 'Criar Conta' }).click();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('heading', { name: 'RollCore' })).toBeVisible();
});

// ── HU-02: Personagem + Engine D&D 5e ────────────────────────────────────

test('Criacao de personagem e verificacao da Engine', async ({ page }) => {
  await createUser();
  await page.goto('/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('Player@rollcore.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Senha123');
  await page.getByRole('checkbox', { name: 'Manter conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('heading', { name: 'Personagens' }).click();
  await page.getByRole('button', { name: '+ Novo Personagem' }).click();
  await page.getByRole('textbox', { name: 'Ex: Aragorn' }).fill('Char1');
  await page.getByRole('combobox').first().selectOption('Ladino');
  await page.getByRole('combobox').nth(1).selectOption('Draconato');
  await page.getByPlaceholder('1–').first().fill('6');
  await page.getByRole('combobox').nth(2).selectOption('Ladrão');
  await page.getByPlaceholder('1–').nth(1).fill('12');
  await page.getByPlaceholder('1–').nth(2).fill('20');
  await page.getByPlaceholder('1–').nth(3).fill('10');
  await page.getByPlaceholder('1–').nth(4).fill('14');
  await page.getByPlaceholder('1–').nth(5).fill('12');
  await page.locator('.attr-form-grid > div:nth-child(6) > .form-input').fill('13');
  await page.getByRole('button', { name: '⚡ Calcular automaticamente' }).click();
  await page.getByRole('button', { name: 'Criar Personagem' }).click();

  await page.getByRole('button', { name: 'Editar' }).click();
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
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible({ timeout: 10_000 });

  await page.getByText('DadosRolar dados').click();
  await page.getByRole('textbox', { name: 'Ex: 2d6+3, 1d20-' }).fill('1d20');
  await page.getByRole('button', { name: 'Rolar' }).click();
  await expect(page.getByText('Rolagem realizada!')).toBeVisible({ timeout: 10_000 });
});