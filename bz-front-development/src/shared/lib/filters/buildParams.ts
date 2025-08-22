export interface QuickFilters {
  city?: string
  group?: string
  view?: 'common' | 'city'
}

export interface MultiFilters {
  institutionTypeIds?: number[]
  educationFormIds?: number[]
  specialityIds?: number[]
  cityIds?: number[]
  admissionYearIds?: number[]
}

export interface BuildParamsInput {
  search?: string
  quick?: QuickFilters
  multi?: MultiFilters
  extra?: Record<string, any>
  isStudent?: boolean
  groupId?: string | null
}

export function buildArticlesQueryParams({ search, quick, multi, extra, isStudent, groupId }: BuildParamsInput) {
  const params: Record<string, any> = {
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_dir: 'desc',
    ...(extra || {})
  }

  if (search) params.search = search
  if (quick?.city) params.audience_city_id = Number(quick.city)
  if (quick?.group) params.group_id = Number(quick.group)
  if (quick?.view) params.view = quick.view

  const pushArray = (name: string, vals?: number[]) => {
    if (!vals || vals.length === 0) return
    vals.forEach((v, i) => { params[`${name}[${i}]`] = v })
  }
  pushArray('institution_type_ids', multi?.institutionTypeIds)
  pushArray('education_form_ids', multi?.educationFormIds)
  pushArray('speciality_ids', multi?.specialityIds)
  pushArray('city_ids', multi?.cityIds)
  pushArray('admission_year_ids', multi?.admissionYearIds)

  const hasAdvanced = Boolean(
    quick?.view || quick?.city || (multi && (
      multi.institutionTypeIds?.length || multi.educationFormIds?.length || multi.specialityIds?.length || multi.cityIds?.length || multi.admissionYearIds?.length
    ))
  )

  const endpoint = (isStudent && groupId && !hasAdvanced) ? '/api/articles/student-feed' : '/api/articles'
  return { endpoint, params }
}


