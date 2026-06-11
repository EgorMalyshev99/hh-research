import { expect, test } from '@playwright/test'

test('login deep link renders sign-in form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Вход', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
})
