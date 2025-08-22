import { serializePublishScope } from './serializePublishScope'

describe('serializePublishScope', () => {
  it('adds institution and school class to base scope', () => {
    const scope = serializePublishScope({}, [], { value: 10 }, { value: 3, label: '3' })
    expect(scope.institution_type_id).toBe(10)
    expect(scope.school_class_id).toBe(3)
  })

  it('serializes audience rules', () => {
    const rules = [{
      education_form_ids: [{ value: 1, label: 'Очная' }],
      speciality_ids: [{ value: 2, label: 'ИТ' }],
      city_ids: [{ value: 5, label: 'СПб' }],
      admission_year_ids: [{ value: 7, label: '2025' }],
      course: { value: 1, label: '1' },
    }]
    const scope = serializePublishScope({}, rules as any, null, null)
    expect(scope.rules).toBeTruthy()
    expect(scope.rules[0].education_form_ids).toEqual([1])
    expect(scope.rules[0].city_ids).toEqual([5])
    expect(scope.rules[0].course).toBe(1)
  })
})


