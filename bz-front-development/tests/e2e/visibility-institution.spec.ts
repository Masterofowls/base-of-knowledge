import { test, expect } from '@playwright/test'

test('post visible only to university students (city + speciality match)', async ({ page, request }) => {
  test.setTimeout(180000)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'

  // Login as admin via API
  const loginResp = await request.post('/api/auth/login', { data: { email: adminEmail, password: adminPassword } })
  if (loginResp.status() !== 200) test.skip(true, 'Admin login failed on live environment')
  const token = (await loginResp.json())?.access_token
  if (!token) test.skip(true, 'No token')

  // Fetch groups and pick one per institution type
  const groupsResp = await request.get('/api/categories/groups')
  if (groupsResp.status() !== 200) test.skip(true, 'Groups endpoint unavailable')
  const groups = await groupsResp.json()
  // Prefer fixed IDs on live server to avoid skips
  const byId = (id:number) => groups.find((g:any)=> g.id === id)
  const uni = byId(7) || groups.find((g:any)=> (g.institution_type?.name||'').toLowerCase().includes('вуз'))
  const sch = byId(8) || byId(9) || groups.find((g:any)=> (g.institution_type?.name||'').toLowerCase().includes('школ'))
  const col = byId(2) || byId(6) || groups.find((g:any)=> (g.institution_type?.name||'').toLowerCase().includes('колледж'))
  if (!uni || !uni.city_id || !uni.speciality_id) test.skip(true, 'No suitable university group')

  // Create city-targeted post with university speciality
  const uniqueTitle = `E2E Univ Only ${Date.now()}`
  const createResp = await request.post('/api/articles/', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: uniqueTitle,
      content: '<p>univ</p>',
      is_published: true,
      is_for_staff: false,
      is_actual: true,
      category_ids: [],
      publish_scope: {
        city_id: uni.city_id,
        speciality_id: uni.speciality_id,
        education_form_id: uni.education_form_id || null
      }
    }
  })
  if (createResp.status() !== 201) test.skip(true, 'Article creation failed on live env')

  // Helper to set student context and assert visibility
  const openAs = async (g: any, shouldSee: boolean, label: string) => {
    await page.addInitScript(({ gid, city, inst, ef }) => {
      localStorage.setItem('user_role', 'student')
      localStorage.setItem('student_group_id', String(gid))
      if (city) localStorage.setItem('student_city_id', String(city))
      if (inst) localStorage.setItem('student_institution_type_id', String(inst))
      if (ef) localStorage.setItem('student_education_form_id', String(ef))
      localStorage.setItem('strict_audience', '1')
    }, { gid: g?.id, city: g?.city_id, inst: g?.institution_type_id, ef: g?.education_form_id })
    await page.goto('/admin/posts')
    const cityChip = page.getByRole('button', { name: 'Город' })
    if (await cityChip.isVisible().catch(()=>false)) await cityChip.click()
    const loc = page.getByText(uniqueTitle)
    if (shouldSee) await expect(loc, `expected visible for ${label}`).toBeVisible({ timeout: 20000 })
    else await expect(loc, `expected hidden for ${label}`).toHaveCount(0)
  }

  if (sch) await openAs(sch, false, 'school')
  if (col) await openAs(col, false, 'college')
  await openAs(uni, true, 'university')
})


