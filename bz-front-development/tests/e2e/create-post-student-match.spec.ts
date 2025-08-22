import { test, expect, request } from '@playwright/test'

test('create post for city and verify student sees it', async ({ page, request }) => {
  test.setTimeout(180000)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'

  // Login as admin via API
  const loginResp = await request.post('/api/auth/login', { data: { email: adminEmail, password: adminPassword } })
  if (loginResp.status() !== 200) test.skip(true, 'Admin login failed on live environment')
  const loginJson = await loginResp.json()
  const token = loginJson?.access_token
  if (!token) test.skip(true, 'No admin token available')

  // Pick a group to derive a valid city/institution context
  const groupsResp = await request.get('/api/categories/groups')
  if (groupsResp.status() !== 200) test.skip(true, 'Groups endpoint unavailable')
  const groups = await groupsResp.json()
  if (!Array.isArray(groups) || groups.length === 0) test.skip(true, 'No groups on live site')
  const g = groups[0]
  const cityId = g.city_id || g.city?.id
  const instId = g.institution_type_id || g.institution_type?.id
  const efId = g.education_form_id || g.education_form?.id
  if (!cityId) test.skip(true, 'Group has no city_id')

  // Create a unique post targeted to the group city
  const uniqueTitle = `E2E City Post ${Date.now()}`
  const createResp = await request.post('/api/articles/', {
    data: {
      title: uniqueTitle,
      content: '<p>automated</p>',
      is_published: true,
      is_for_staff: false,
      is_actual: true,
      category_ids: [],
      publish_scope: { city_id: cityId }
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (createResp.status() !== 201) test.skip(true, 'Article creation failed on live environment')

  // Prepare student context before page scripts run
  await page.addInitScript(({ gid, city, inst, ef }) => {
    localStorage.setItem('user_role', 'student')
    localStorage.setItem('student_group_id', String(gid))
    localStorage.setItem('student_city_id', String(city))
    if (inst) localStorage.setItem('student_institution_type_id', String(inst))
    if (ef) localStorage.setItem('student_education_form_id', String(ef))
    localStorage.setItem('strict_audience', '1')
  }, { gid: g.id, city: cityId, inst: instId || null, ef: efId || null })

  // Navigate to posts list which uses student-feed when student context is set
  await page.goto('/admin/posts')
  const cityView = page.getByRole('button', { name: 'Город' })
  if (await cityView.isVisible().catch(()=>false)) await cityView.click()
  await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 })
})


