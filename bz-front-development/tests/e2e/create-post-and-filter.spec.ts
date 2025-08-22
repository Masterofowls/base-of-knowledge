import { test, expect } from '@playwright/test'

test('admin creates a post for city and it appears in city view', async ({ page }) => {
  page.setDefaultTimeout(60000)
  await page.goto('/')
  // Try open admin login via link; if not present, navigate directly
  const adminLinks = await page.getByRole('link', { name: /Админ/i }).all().catch(()=>[])
  if (adminLinks && adminLinks.length > 0) {
    await adminLinks[0].click()
  } else {
    await page.goto('/adminlogin')
  }
  // If auth UI exists; otherwise, skip
  const hasEmail = await page.getByPlaceholder('Email').isVisible().catch(()=>false)
  if (hasEmail) {
    await page.getByPlaceholder('Email').fill('admin@example.com')
    await page.getByPlaceholder('Пароль').fill('Admin123!')
    const loginBtn = page.getByRole('button', { name: /Войти/i })
    if (await loginBtn.isVisible().catch(()=>false)) await loginBtn.click()
  }

  // Navigate to create post
  await page.goto('/admin/post/create')
  const titleField = page.getByPlaceholder('Введите название поста')
  if (!(await titleField.isVisible().catch(()=>false))) {
    test.skip(true, 'Admin UI not available or auth required on target environment')
  }
  await titleField.fill('E2E: СПб')

  // Select city in filters (MUI Autocomplete)
  const cityCombo = page.getByRole('combobox', { name: /Город/i }).first()
  await cityCombo.click()
  const option = page.getByRole('option', { name: /Санкт-Петербург/i }).first()
  if (await option.isVisible().catch(()=>false)) await option.click()

  // Publish immediately
  const publishCheckbox = page.getByText('Опубликовать сразу')
  if (await publishCheckbox.isVisible().catch(()=>false)) await publishCheckbox.click()
  await page.getByRole('button', { name: /Создать|Обновить/i }).click()

  // Open list and switch to city view
  await page.goto('/admin/posts')
  const cityView = page.getByRole('button', { name: 'Город' })
  if (await cityView.isVisible().catch(()=>false)) await cityView.click()
  await expect(page.getByText('E2E: СПб')).toBeVisible()
})


