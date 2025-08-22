export interface RuleOption { value: number; label: string }

export interface AudienceRuleUI {
  institution_type_ids?: RuleOption[]
  education_form_ids?: RuleOption[]
  speciality_ids?: RuleOption[]
  city_ids?: RuleOption[]
  admission_year_ids?: RuleOption[]
  course?: RuleOption | number | null
  school_class_id?: RuleOption | null
}

export function serializePublishScope(
  baseScope: any,
  audienceRules: AudienceRuleUI[],
  selectedInstitution?: { value:number } | null,
  selectedSchoolClass?: RuleOption | null
) {
  const scope = { ...(baseScope || {}) }
  if (selectedInstitution) scope.institution_type_id = selectedInstitution.value
  if (selectedSchoolClass) scope.school_class_id = selectedSchoolClass.value

  if (Array.isArray(audienceRules) && audienceRules.length > 0) {
    scope.rules = audienceRules.map(r => ({
      institution_type_ids: (r.institution_type_ids||[]).map(o=>o.value),
      education_form_ids: (r.education_form_ids||[]).map(o=>o.value),
      speciality_ids: (r.speciality_ids||[]).map(o=>o.value),
      city_ids: (r.city_ids||[]).map(o=>o.value),
      admission_year_ids: (r.admission_year_ids||[]).map(o=>o.value),
      course: typeof r.course === 'number' ? r.course : (r.course as any)?.value,
      school_class_id: r.school_class_id?.value,
    }))
  }
  return scope
}


