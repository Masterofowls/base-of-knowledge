import { buildArticlesQueryParams } from './buildParams'

describe('buildArticlesQueryParams', () => {
  it('builds basic params', () => {
    const { endpoint, params } = buildArticlesQueryParams({ search: 'abc' })
    expect(endpoint).toBe('/api/articles')
    expect(params.search).toBe('abc')
    expect(params.page).toBe(1)
  })

  it('uses student-feed when no advanced filters and group set', () => {
    const { endpoint } = buildArticlesQueryParams({ isStudent: true, groupId: '10' })
    expect(endpoint).toBe('/api/articles/student-feed')
  })

  it('sends arrays correctly', () => {
    const { params } = buildArticlesQueryParams({ multi: { educationFormIds: [1,2], cityIds: [5] } })
    expect(params['education_form_ids[0]']).toBe(1)
    expect(params['education_form_ids[1]']).toBe(2)
    expect(params['city_ids[0]']).toBe(5)
  })

  it('honors view toggle', () => {
    const { params } = buildArticlesQueryParams({ quick: { view: 'city' } })
    expect(params.view).toBe('city')
  })
})


