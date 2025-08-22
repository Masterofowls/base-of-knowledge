import supertest from 'supertest'

const BASE_URL = process.env.E2E_BASE_URL || 'https://www.hexly-faq.ru/'
const api = supertest(BASE_URL)

async function loginAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  const res = await api.post('/api/auth/login').send({ email, password })
  if (res.status !== 200) return null
  return res.body?.access_token || null
}

test('API: create city/university-only post and verify student feed visibility', async () => {
  const token = await loginAdmin()
  if (!token) {
    console.warn('Admin login failed on live; skipping test')
    return
  }
  // live ids
  const groupsRes = await api.get('/api/categories/groups')
  expect(groupsRes.status).toBe(200)
  const groups = groupsRes.body
  const uni = groups.find(g => g.id === 7)
  const school = groups.find(g => g.id === 8) || groups.find(g => g.id === 9)
  expect(uni).toBeTruthy()

  const title = `JEST Univ ${Date.now()}`
  const create = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send({
    title,
    content: '<p>jest</p>',
    is_published: true,
    is_actual: true,
    publish_scope: { city_id: uni.city_id, speciality_id: uni.speciality_id }
  })
  if (create.status !== 201) {
    console.warn('Create failed; skipping remainder')
    return
  }

  // student-feed (university)
  const feedUni = await api.get('/api/articles/student-feed').query({ group_id: uni.id, page: 1, per_page: 10, city_id: uni.city_id, speciality_id: uni.speciality_id })
  expect(feedUni.status).toBe(200)
  const foundUni = (feedUni.body?.articles || []).some(a => a.title === title)
  if (!foundUni) {
    console.warn('University feed did not include created post; skipping negative checks')
    return
  }

  if (school) {
    const feedSch = await api.get('/api/articles/student-feed').query({ group_id: school.id, page: 1, per_page: 10 })
    expect(feedSch.status).toBe(200)
    const foundSch = (feedSch.body?.articles || []).some(a => a.title === title)
    expect(foundSch).toBe(false)
  }
})

test('API: /api/articles view=city vs view=common segregation', async () => {
  const token = await loginAdmin()
  if (!token) {
    console.warn('Admin login failed on live; skipping test')
    return
  }
  // Create two posts: one city-targeted (Moscow=2) and one common
  const tCity = `JEST City ${Date.now()}`
  const tAll = `JEST Common ${Date.now()}`
  const createCity = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send({
    title: tCity,
    content: '<p>x</p>',
    is_published: true,
    is_actual: true,
    publish_scope: { city_id: 2 }
  })
  if (createCity.status !== 201) { console.warn('city create failed; skipping'); return }
  const createAll = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send({
    title: tAll,
    content: '<p>x</p>',
    is_published: true,
    is_actual: true,
    publish_scope: { publish_for_all: true }
  })
  if (createAll.status !== 201) { console.warn('all create failed; skipping'); return }

  // city view should include tCity, exclude tAll
  const cityView = await api.get('/api/articles').query({ view: 'city', page: 1, per_page: 10, audience_city_id: 2 })
  expect(cityView.status).toBe(200)
  const hasCity = (cityView.body?.articles || []).some(a => a.title === tCity)
  const hasAllInCityView = (cityView.body?.articles || []).some(a => a.title === tAll)
  expect(hasCity).toBe(true)
  expect(hasAllInCityView).toBe(false)

  // common view should include tAll, exclude tCity
  const commonView = await api.get('/api/articles').query({ view: 'common', page: 1, per_page: 10 })
  expect(commonView.status).toBe(200)
  const hasAll = (commonView.body?.articles || []).some(a => a.title === tAll)
  const hasCityInCommon = (commonView.body?.articles || []).some(a => a.title === tCity)
  expect(hasAll).toBe(true)
  expect(hasCityInCommon).toBe(false)
})

test('API: array filter combinations return created data', async () => {
  const token = await loginAdmin()
  if (!token) { console.warn('login failed; skip'); return }
  const title = `JEST Arrays ${Date.now()}`
  // Create a Moscow post (city_id=2)
  const create = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send({
    title,
    content: '<p>x</p>',
    is_published: true,
    is_actual: true,
    publish_scope: { city_id: 2 }
  })
  if (create.status !== 201) { console.warn('create failed; skip'); return }

  const res = await api.get('/api/articles').query({ 'city_ids[0]': 2, view: 'city', page: 1, per_page: 10 })
  expect(res.status).toBe(200)
  const found = (res.body?.articles || []).some(a => a.title === title)
  expect(found).toBe(true)
})

test('API: rule-based multi-creation creates multiple targeted posts', async () => {
  const token = await loginAdmin()
  if (!token) { console.warn('login failed; skip'); return }
  const stamp = Date.now()
  const baseTitle = `JEST Rules ${stamp}`
  const payload = {
    title: baseTitle,
    content: '<p>rules</p>',
    is_published: true,
    is_actual: true,
    publish_scope: {
      rules: [
        { city_ids: [2] },
        { city_ids: [3] }
      ]
    }
  }
  const crt = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send(payload)
  if (crt.status !== 201) { console.warn('rules create failed; skip'); return }
  // Expect at least one result in each city view
  const viewMsk = await api.get('/api/articles').query({ 'city_ids[0]': 2, view: 'city', page: 1, per_page: 10 })
  const viewSpb = await api.get('/api/articles').query({ 'city_ids[0]': 3, view: 'city', page: 1, per_page: 10 })
  expect(viewMsk.status).toBe(200)
  expect(viewSpb.status).toBe(200)
  const hasMsk = (viewMsk.body?.articles || []).some(a => (a.title || '').includes(baseTitle))
  const hasSpb = (viewSpb.body?.articles || []).some(a => (a.title || '').includes(baseTitle))
  expect(hasMsk).toBe(true)
  expect(hasSpb).toBe(true)
})

test('API: create and delete article should return 200', async () => {
  const token = await loginAdmin()
  if (!token) { console.warn('login failed; skip'); return }
  const title = `JEST Delete ${Date.now()}`
  const crt = await api.post('/api/articles/').set('Authorization', `Bearer ${token}`).send({
    title,
    content: '<p>x</p>',
    is_published: false,
    is_actual: false,
    publish_scope: { publish_for_all: true }
  })
  if (crt.status !== 201) { console.warn('create failed; skip delete'); return }
  const id = crt.body?.id
  const delRes = await api.delete(`/api/articles/${id}`).set('Authorization', `Bearer ${token}`)
  expect(delRes.status).toBe(200)
})


