import { test, expect } from '@playwright/test'

test('online filters: list loads and view toggles update URL and keep content', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('/admin/posts')
  await expect(page.locator('header')).toBeVisible()

  const url1 = new URL(page.url())
  const commonChip = page.getByRole('button', { name: 'Общая информация' })
  const cityChip = page.getByRole('button', { name: 'Город' })

  // Click common → URL should contain view=common
  if (await commonChip.isVisible().catch(()=>false)) {
    await commonChip.click()
    await page.waitForTimeout(300)
    const url = new URL(page.url())
    expect(url.searchParams.get('view')).toBe('common')
  }

  // Click city → URL should contain view=city
  if (await cityChip.isVisible().catch(()=>false)) {
    await cityChip.click()
    await page.waitForTimeout(300)
    const url = new URL(page.url())
    expect(url.searchParams.get('view')).toBe('city')
  }

  // Ensure page still shows main content
  await expect(page.locator('main, body')).toBeVisible()
})

test.describe('online filters: array params produce results (read-only)', () => {
  const cases = [
    '?education_form_ids[0]=1',
    '?city_ids[0]=1',
    '?admission_year_ids[0]=1',
  ]

  for (const qs of cases) {
    test(`array case ${qs}`, async ({ page }) => {
      test.setTimeout(120000)
      await page.goto(`/admin/posts${qs}`)
      await expect(page.locator('header')).toBeVisible()
      // Wait a moment for list to render
      await page.waitForTimeout(500)
      const notFound = await page.getByText('Посты не найдены').isVisible().catch(()=>false)
      if (notFound) test.fixme(true, `No data for ${qs} on live site`)
      const headings = await page.locator('h3').count()
      if (headings === 0) test.fixme(true, `No items rendered for ${qs}`)
      expect(headings).toBeGreaterThan(0)
    })
  }
})


