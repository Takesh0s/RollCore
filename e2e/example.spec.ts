import { test, expect } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//
//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });
//
// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//
//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();
//
//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });


test.beforeEach(async ({ page }) => {
  console.log(`Running ${test.info().title}`);

  const headers: Headers = new Headers()

  const request: RequestInfo = new Request('http://localhost:8080/auth/deleteall', { 
    method: 'DELETE',
    headers: headers
  })

  fetch(request)
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Sair' }).click

});

test('Login Invalido', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: 'seu@email.com' }).click();
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('emailerrado@email.com');
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill('senhaerrada123');
  await page.getByRole('checkbox', { name: 'Manter conectado' }).check();
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'RollCore' })).toBeVisible;

  });

test('Criacao de conta e autoLogin', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByRole('textbox', { name: 'ex: guerreiro_dos_reinos' }).click();
  await page.getByRole('textbox', { name: 'ex: guerreiro_dos_reinos' }).fill('Usuario1');
  await page.getByRole('textbox', { name: 'seu@email.com' }).click();
  await page.getByRole('textbox', { name: 'seu@email.com' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Mínimo 8 chars, 1 maiúscula,' }).click();
  await page.getByRole('textbox', { name: 'Mínimo 8 chars, 1 maiúscula,' }).fill('SenhaPadrao1!');
  await page.getByRole('textbox', { name: 'Repita a senha' }).click();
  await page.getByRole('textbox', { name: 'Repita a senha' }).fill('SenhaPadrao1!');
  await page.getByRole('button', { name: 'Criar Conta' }).click();

  //Verifica se a conta foi criada e logada
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible

  //sai da conta
  await page.getByRole('button', { name: 'Sair' }).click
});




test('test Criacao de personagem, e verificacao da Engine', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  //Se nao estiver logado cria uma conta para logar
  if (await page.getByText('Acesse sua conta').isVisible) {
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.getByRole('textbox', { name: 'ex: guerreiro_dos_reinos' }).click();
    await page.getByRole('textbox', { name: 'ex: guerreiro_dos_reinos' }).fill('Usuario1');
    await page.getByRole('textbox', { name: 'seu@email.com' }).click();
    await page.getByRole('textbox', { name: 'seu@email.com' }).fill('email@email.com');
    await page.getByRole('textbox', { name: 'Mínimo 8 chars, 1 maiúscula,' }).click();
    await page.getByRole('textbox', { name: 'Mínimo 8 chars, 1 maiúscula,' }).fill('SenhaPadrao1!');
    await page.getByRole('textbox', { name: 'Repita a senha' }).click();
    await page.getByRole('textbox', { name: 'Repita a senha' }).fill('SenhaPadrao1!');
    await page.getByRole('button', { name: 'Criar Conta' }).click();
  }

  //Cria o personagem
  await page.getByRole('heading', { name: 'Personagens' }).click();
  await page.getByRole('button', { name: '+ Novo Personagem' }).click();
  await page.getByRole('textbox', { name: 'Ex: Aragorn' }).click();
  await page.getByRole('textbox', { name: 'Ex: Aragorn' }).fill('Char1');
  await page.getByRole('combobox').first().selectOption('Ladino');
  await page.getByRole('combobox').nth(1).selectOption('Draconato');
  await page.getByPlaceholder('1–').first().click();
  await page.getByPlaceholder('1–').first().fill('6');
  await page.getByRole('combobox').nth(2).selectOption('Ladrão');
  await page.getByPlaceholder('1–').nth(1).click();
  await page.getByPlaceholder('1–').nth(1).fill('12');
  await page.getByPlaceholder('1–').nth(2).click();
  await page.getByPlaceholder('1–').nth(2).fill('20');
  await page.getByPlaceholder('1–').nth(3).click();
  await page.getByPlaceholder('1–').nth(3).fill('10');
  await page.getByPlaceholder('1–').nth(4).click();
  await page.getByPlaceholder('1–').nth(4).fill('14');
  await page.getByPlaceholder('1–').nth(5).click();
  await page.getByPlaceholder('1–').nth(5).fill('12');
  await page.locator('.attr-form-grid > div:nth-child(6) > .form-input').click();
  await page.locator('.attr-form-grid > div:nth-child(6) > .form-input').fill('13');
  await page.getByRole('button', { name: '⚡ Calcular automaticamente' }).click();
  await page.getByRole('button', { name: 'Criar Personagem' }).click();

  //Edita o nivel do personagem
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.getByPlaceholder('1–').first().click();
  await page.getByPlaceholder('1–').first().fill('7');
  await page.getByRole('button', { name: '⚡ Calcular automaticamente' }).click();
  await page.getByRole('button', { name: 'Salvar Alterações' }).click();

  // Checa se o atributo HP foi definido corretamente de acordo com o nivel alterado
  await expect(page.getByText('HP Máx.38pontos')).toBeVisible;
});