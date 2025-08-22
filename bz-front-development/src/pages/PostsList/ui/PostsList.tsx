import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Skeleton, IconButton, Tooltip, Fab, Chip, Autocomplete, TextField, Stack, Divider } from '@mui/material'
import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt'
import NorthIcon from '@mui/icons-material/North'

interface ArticleListItem {
  id: number
  title: string
  content: string
  created_at: string
  is_published: boolean
}

interface PostsListProps {
  expandAllDefault?: boolean
  fullscreen?: boolean
  notionMode?: boolean
  showSearch?: boolean
}

export default function PostsList({ expandAllDefault = false, fullscreen = false, notionMode = false, showSearch = true }: PostsListProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  // removed tabs; using chip-based filters only
  const [quickFilters, setQuickFilters] = useState<{ city?: string; group?: string; view?: 'common' | 'city' }>({})
  const [multiFilters, setMultiFilters] = useState<{
    institutionTypeIds?: number[]
    educationFormIds?: number[]
    specialityIds?: number[]
    cityIds?: number[]
    admissionYearIds?: number[]
  }>({})
  const [dicts, setDicts] = useState<{ institutionTypes: any[]; educationForms: any[]; specialities: any[]; cities: any[]; years: any[] }>({ institutionTypes: [], educationForms: [], specialities: [], cities: [], years: [] })
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<number, Record<string, number>>>({})
  const [showToTop, setShowToTop] = useState(false)
  const [readerId, setReaderId] = useState<number | null>(null)
  const [readerArticle, setReaderArticle] = useState<any | null>(null)
  const [readerLoading, setReaderLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [outline, setOutline] = useState<Array<{ id: string, text: string, level: number }>>([])
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  const [related, setRelated] = useState<Array<{ id: number, title: string }>>([])
  const headerPrevDisplay = useRef<string | null>(null)
  const [extraFilters, setExtraFilters] = useState<any>({})
  const [hoverPreview, setHoverPreview] = useState<{ title: string, html: string, img?: string } | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  function slugify(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s_-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  // Student context (for header)
  const isStudentRole = (typeof window !== 'undefined' ? (localStorage.getItem('user_role') || '').toLowerCase() === 'student' : false)
  const selectedCityId = (typeof window !== 'undefined' ? localStorage.getItem('student_city_id') : null)
  const selectedGroupName = (typeof window !== 'undefined' ? localStorage.getItem('student_group') : null)
  const selectedGroupId = (typeof window !== 'undefined' ? localStorage.getItem('student_group_id') : null)
  const selectedBase = (typeof window !== 'undefined' ? localStorage.getItem('student_base_class') : null)
  const selectedCourse = (typeof window !== 'undefined' ? localStorage.getItem('student_course') : null)

  const pageFromURL = useMemo(() => Number(searchParams.get('page') ?? 1), [searchParams])
  useEffect(() => { setPage(pageFromURL) }, [pageFromURL])

  function loadPage(targetPage: number, opts: { append: boolean } = { append: false }) {
    const controller = new AbortController()
    if (!opts.append) setIsLoading(true)
    if (opts.append) setIsLoadingMore(true)
    setError(null)
    const groupId = localStorage.getItem('student_group_id')
    const course = localStorage.getItem('student_course')
    const baseClass = localStorage.getItem('student_base_class')
    const strict = localStorage.getItem('strict_audience') === '1'
    const isStudent = (localStorage.getItem('user_role') || '').toLowerCase() === 'student'
    const hasAdvanced = Boolean(
      quickFilters.view || quickFilters.city || multiFilters.institutionTypeIds?.length || multiFilters.educationFormIds?.length || multiFilters.specialityIds?.length || multiFilters.cityIds?.length || multiFilters.admissionYearIds?.length
    )
    const endpoint = (isStudent && groupId && !hasAdvanced) ? '/api/articles/student-feed' : '/api/articles'
    const params: any = { page: targetPage, per_page: 10, search: query || undefined, sort_by: 'created_at', sort_dir: 'desc', ...extraFilters }
    if (quickFilters.city) params.audience_city_id = Number(quickFilters.city)
    if (quickFilters.group) params.group_id = Number(quickFilters.group)
    if (quickFilters.view) params.view = quickFilters.view
    if (multiFilters.institutionTypeIds?.length) multiFilters.institutionTypeIds.forEach((v, i)=> params[`institution_type_ids[${i}]`] = v)
    if (multiFilters.educationFormIds?.length) multiFilters.educationFormIds.forEach((v, i)=> params[`education_form_ids[${i}]`] = v)
    if (multiFilters.specialityIds?.length) multiFilters.specialityIds.forEach((v, i)=> params[`speciality_ids[${i}]`] = v)
    if (multiFilters.cityIds?.length) multiFilters.cityIds.forEach((v, i)=> params[`city_ids[${i}]`] = v)
    if (multiFilters.admissionYearIds?.length) multiFilters.admissionYearIds.forEach((v, i)=> params[`admission_year_ids[${i}]`] = v)
    if (!isStudent || !groupId) {
      params.is_published = true
      params.strict_audience = strict
      if (course) params.audience_course = Number(course)
      if (baseClass) params.base_class = Number(baseClass)
    } else {
      if (groupId) params.group_id = Number(groupId)
      if (course) params.course = Number(course)
      if (baseClass) params.base_class = Number(baseClass)
      const studCity = localStorage.getItem('student_city_id')
      if (studCity) params.audience_city_id = Number(studCity)
    }

    http
      .get(endpoint, { params, signal: controller.signal as any })
      .then(res => {
        const list = res.data?.articles ?? res.data ?? []
        const next = opts.append ? [...items, ...list] : list
        setItems(next)
        setHasNext(Boolean(res.data?.pagination?.has_next))
        const newIds = list.map((it: ArticleListItem) => it.id)
        loadReactionsFor(newIds)
      })
      .catch(err => {
        if (controller.signal.aborted) return
        console.error(err)
        setError('Не удалось загрузить посты')
      })
      .finally(() => { setIsLoading(false); setIsLoadingMore(false) })
    return () => controller.abort()
  }

  const filterKey = useMemo(() => JSON.stringify({ q: query, quick: quickFilters, multi: multiFilters, extra: extraFilters }), [query, quickFilters, multiFilters, extraFilters])
  useEffect(() => {
    setPage(1)
    loadPage(1, { append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasNext && !isLoadingMore && !isLoading) {
          const nextPage = page + 1
          setPage(nextPage)
          loadPage(nextPage, { append: true })
        }
      })
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [sentinelRef, hasNext, isLoadingMore, isLoading, page, items])

  // Load dictionaries for advanced filters
  useEffect(() => {
    let ignore = false
    Promise.all([
      http.get('/api/categories/institution-types'),
      http.get('/api/categories/education-forms'),
      http.get('/api/categories/specialities'),
      http.get('/api/categories/admission-years'),
      http.get('/api/categories/cities'),
    ]).then(([inst, forms, specs, years, cities]) => {
      if (ignore) return
      setDicts({
        institutionTypes: (inst.data || []).map((i:any)=>({ value:i.id, label:i.name })),
        educationForms: (forms.data || []).map((f:any)=>({ value:f.id, label:f.name })),
        specialities: (specs.data || []).map((s:any)=>({ value:s.id, label:`${s.code} ${s.name}` })),
        years: (years.data || []).map((y:any)=>({ value:y.id, label:String(y.year) })),
        cities: (cities.data || []).map((c:any)=>({ value:c.id, label:c.name })),
      })
    }).catch(()=>{})
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!notionMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeReader()
      if (e.key === 'ArrowLeft') readerNavigate(-1)
      if (e.key === 'ArrowRight') readerNavigate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [notionMode, readerId, items])

  function toggleExpand(id: number) {
    if (notionMode) {
      openReader(id)
      return
    }
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) loadReactionsFor([id])
      return next
    })
  }

  function openReader(id: number) {
    setReaderId(id)
    setReaderLoading(true)
    http.get(`/api/articles/${id}`).then(res => {
      setReaderArticle(res.data)
      loadReactionsFor([id])
      setTimeout(buildOutline, 0)
      // removed related sidebar and in-pane outline observer for full-screen mode
    }).catch(()=> setReaderArticle(null)).finally(()=> setReaderLoading(false))
    // hide global header while reading
    try {
      const header = document.querySelector('header') as HTMLElement | null
      if (header) { headerPrevDisplay.current = header.style.display || ''; header.style.display = 'none' }
    } catch {}
  }

  function closeReader() {
    setReaderId(null)
    setReaderArticle(null)
    setOutline([])
    setActiveOutlineId(null)
    setRelated([])
    try {
      const header = document.querySelector('header') as HTMLElement | null
      if (header) header.style.display = headerPrevDisplay.current ?? ''
    } catch {}
  }

  function readerNavigate(delta: number) {
    if (!readerId) return
    const ids = items.map(it => it.id)
    const idx = ids.indexOf(readerId)
    if (idx < 0) return
    const nextIdx = idx + delta
    if (nextIdx < 0 || nextIdx >= ids.length) return
    openReader(ids[nextIdx])
  }

  function buildOutline() {
    if (!contentRef.current) return
    const root = contentRef.current
    const hs = Array.from(root.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    const list: Array<{ id: string, text: string, level: number }> = []
    hs.forEach((h, i) => {
      const id = h.id || `h-${i}`
      h.id = id
      const level = h.tagName === 'H1' ? 1 : h.tagName === 'H2' ? 2 : 3
      const text = (h.textContent || '').trim()
      list.push({ id, text, level })
    })
    setOutline(list)
  }

  function wireOutlineObserver() {
    if (!contentRef.current) return
    const root = contentRef.current
    const targets = Array.from(root.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveOutlineId((entry.target as HTMLElement).id)
      })
    }, { root: root, rootMargin: '0px 0px -70% 0px', threshold: [0, 1] })
    targets.forEach(t => io.observe(t))
  }

  // removed related loader (sidebar no longer shown)

  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    const a = target.closest('a') as HTMLAnchorElement | null
    if (!a) return
    const idAttr = a.getAttribute('data-article-id')
    if (idAttr) {
      e.preventDefault()
      const id = Number(idAttr)
      if (!Number.isNaN(id)) openReader(id)
      return
    }
    const href = a.getAttribute('href') || ''
    const match = href.match(/\/post\/(\d+)/)
    if (match) {
      e.preventDefault()
      const id = Number(match[1])
      if (!Number.isNaN(id)) openReader(id)
    }
  }

  async function loadReactionsFor(ids: number[]) {
    await Promise.all(ids.map(async id => {
      try {
        const res = await http.get(`/api/articles/${id}/reactions`)
        const counts = res.data?.counts || {}
        setReactionCounts(prev => ({ ...prev, [id]: counts }))
      } catch(e) {}
    }))
  }

  async function sendReaction(id: number, code: string) {
    try {
      await http.post(`/api/articles/${id}/reactions`, { emoji_code: code })
      await loadReactionsFor([id])
    } catch(e) { console.error(e) }
  }

  function stripHtml(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').trim()
  }

  function handleShare(item: ArticleListItem) {
    const text = stripHtml(item.content)
    const shareData: any = { title: item.title, text }
    if (navigator.share) navigator.share(shareData).catch(()=>{})
    else navigator.clipboard?.writeText(`${item.title}\n\n${text}`).catch(()=>{})
  }

  function handleCopy(item: ArticleListItem) {
    const text = stripHtml(item.content)
    navigator.clipboard?.writeText(`${item.title}\n\n${text}`).catch(()=>{})
  }

  function handleSearch() {
    const next = new URLSearchParams(searchParams)
    if (query) next.set('q', query)
    else next.delete('q')
    next.set('page', '1')
    setSearchParams(next)
  }

  function getFirstImageSrc(html: string): string | null {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const img = tmp.querySelector('img') as HTMLImageElement | null
    return img?.src || null
  }

  function getSnippet(html: string, maxLen = 180): string {
    const text = stripHtml(html)
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen).trim() + '…'
  }

  const containerWidth = fullscreen ? 'min(100%, 900px)' : 'min(100%, 1000px)'
  const filtered = items
  return (
    <div className='page-center-wrapper' style={{ paddingTop: 0 }}>
      <Container gap='0' width={containerWidth} direction='column' paddings='0' className={cls.list}>
        {/* Student header with current context */}
        {isStudentRole && readerId === null && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card, #f8f9fa)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-muted, rgba(0,0,0,0.06))' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Лента студента</h1>
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.8, display: 'flex', flexWrap: 'wrap' }}>
              <span style={{ marginRight: 12 }}><strong>Город:</strong> {(() => {
                const cid = Number(selectedCityId || 0)
                const city = (dicts.cities || []).find((c:any) => c.value === cid)
                return city?.label || (selectedCityId ? `#${selectedCityId}` : '—')
              })()}</span>
              <span><strong>Группа:</strong> {selectedGroupName || (selectedGroupId ? `#${selectedGroupId}` : '—')}</span>
              <span style={{ marginLeft: 12 }}><strong>База:</strong> {selectedBase || '—'}</span>
              <span style={{ marginLeft: 12 }}><strong>Курс:</strong> {selectedCourse || '—'}</span>
            </div>
          </div>
        )}
        {/* header tabs/search removed; search lives in global header */}
        {/* Быстрые фильтры (скрыть в режиме чтения) */}
        <div style={{ display: (notionMode && readerId !== null) ? 'none' : 'flex', gap:8, alignItems:'center', padding:'8px 12px', flexWrap:'wrap' }}>
          <Chip size='small' label='Сбросить фильтры' onClick={()=>{ setQuickFilters({}); setMultiFilters({}); setExtraFilters({}) }} />
          <Chip size='small' color={quickFilters.view==='common' ? 'primary':'default'} label='Общая информация' onClick={()=> setQuickFilters(q=>({...q, view:'common'}))} />
          <Chip size='small' color={quickFilters.view==='city' ? 'primary':'default'} label='Город' onClick={()=> setQuickFilters(q=>({...q, view:'city'}))} />
          <Chip size='small' color={quickFilters.city ? 'primary':'default'} label={quickFilters.city ? `Город #${quickFilters.city}`:'Город из контекста'} onClick={()=>{
            const cityId = localStorage.getItem('student_city_id'); if (cityId) setQuickFilters(q=>({...q, city: cityId}));
          }} />
          <Chip size='small' color={quickFilters.group ? 'primary':'default'} label={quickFilters.group ? `Группа #${quickFilters.group}`:'Группа из контекста'} onClick={()=>{
            const groupId = localStorage.getItem('student_group_id'); if (groupId) setQuickFilters(q=>({...q, group: groupId}));
          }} />
        </div>

        {/* Расширенные фильтры с зависимостями */}
        {!notionMode && readerId === null && (
          <div style={{ padding: '8px 12px' }}>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems='stretch'>
              <Autocomplete
                multiple
                options={dicts.institutionTypes}
                value={(dicts.institutionTypes || []).filter(o=> multiFilters.institutionTypeIds?.includes(o.value))}
                onChange={(_, v:any[])=> setMultiFilters(f=>({ ...f, institutionTypeIds: v.map(o=>o.value) }))}
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={(o)=>o?.label ?? ''}
                renderInput={(p)=>(<TextField {...p} size='small' label='Типы учреждений' placeholder='Колледж / Вуз / Школа' />)}
              />
              <Autocomplete
                multiple
                options={dicts.educationForms}
                value={(dicts.educationForms || []).filter(o=> multiFilters.educationFormIds?.includes(o.value))}
                onChange={(_, v:any[])=> setMultiFilters(f=>({ ...f, educationFormIds: v.map(o=>o.value) }))}
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={(o)=>o?.label ?? ''}
                renderInput={(p)=>(<TextField {...p} size='small' label='Формы обучения' placeholder='Очная / Заочная / Дистант' />)}
              />
              <Autocomplete
                multiple
                options={dicts.specialities}
                value={(dicts.specialities || []).filter(o=> multiFilters.specialityIds?.includes(o.value))}
                onChange={(_, v:any[])=> setMultiFilters(f=>({ ...f, specialityIds: v.map(o=>o.value) }))}
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={(o)=>o?.label ?? ''}
                renderInput={(p)=>(<TextField {...p} size='small' label='Специальности' placeholder='— Любые —' />)}
              />
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems='stretch' sx={{ mt: 1 }}>
              <Autocomplete
                multiple
                options={dicts.years}
                value={(dicts.years || []).filter(o=> multiFilters.admissionYearIds?.includes(o.value))}
                onChange={(_, v:any[])=> setMultiFilters(f=>({ ...f, admissionYearIds: v.map(o=>o.value) }))}
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={(o)=>o?.label ?? ''}
                renderInput={(p)=>(<TextField {...p} size='small' label='Годы поступления' placeholder='Текущий / Прошлый / …' />)}
              />
              <Autocomplete
                multiple
                options={dicts.cities}
                value={(dicts.cities || []).filter(o=> multiFilters.cityIds?.includes(o.value))}
                onChange={(_, v:any[])=> setMultiFilters(f=>({ ...f, cityIds: v.map(o=>o.value) }))}
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={(o)=>o?.label ?? ''}
                renderInput={(p)=>(<TextField {...p} size='small' label='Города' placeholder='— Любые —' />)}
              />
            </Stack>
            <Divider sx={{ my: 1 }} />
          </div>
        )}

        {(!notionMode || readerId === null) && isLoading && <div style={{ padding: 16 }}>Загрузка…</div>}
        {(!notionMode || readerId === null) && error && <div style={{ padding: 16, color: '#E44A77' }}>{error}</div>}

        {/* Notion-like grouped sections when notionMode and not reading */}
        {notionMode && readerId === null && !isLoading && !error && (
          <div style={{ padding: '0 12px 8px' }}>
            {(() => {
              type Section = { title: string, subgroups: Array<{ subtitle: string, list: any[] }> }
              const sectionMap = new Map<string, Section>()
              const cityLabelById = new Map<number, string>((dicts.cities || []).map((c:any)=>[c.value, c.label]))

              filtered.forEach((it: any) => {
                let sectionKey = 'Общее'
                const cats = (it.categories || []) as any[]
                if (cats.length && cats[0]?.top_category?.name) sectionKey = cats[0].top_category.name
                if (it.audience === 'city' || it.audience_city_id) sectionKey = 'Разделы по городам'

                const section = sectionMap.get(sectionKey) || { title: sectionKey, subgroups: [] }
                if (sectionKey === 'Разделы по городам') {
                  const cid = Number(it.audience_city_id || 0)
                  const subKey = cityLabelById.get(cid) || (cid ? `Город #${cid}` : 'Города')
                  let sub = section.subgroups.find(s => s.subtitle === subKey)
                  if (!sub) { sub = { subtitle: subKey, list: [] }; section.subgroups.push(sub) }
                  sub.list.push(it)
                } else {
                  let sub = section.subgroups.find(s => s.subtitle === '—')
                  if (!sub) { sub = { subtitle: '—', list: [] }; section.subgroups.push(sub) }
                  sub.list.push(it)
                }
                sectionMap.set(sectionKey, section)
              })

              const sections = Array.from(sectionMap.values())
              if (sections.length === 0) return <div style={{ color: '#888', padding: 16 }}>Посты не найдены</div>
              const PAGE = 12
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                  {sections.map((section) => (
                    <section key={section.title} id={`sec-${slugify(section.title)}`}>
                      <h2 style={{ margin:'0 0 8px 0', fontSize:18, fontWeight:800 }}>{section.title}</h2>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
                        {section.subgroups.map((sg) => {
                          const left: any[] = []
                          const right: any[] = []
                          const key = `${section.title}__${sg.subtitle}`
                          const isExpanded = !!expandedGroups[key]
                          const listLimited = isExpanded ? sg.list : sg.list.slice(0, PAGE)
                          listLimited.forEach((a: any, idx: number) => (idx % 2 === 0 ? left : right).push(a))
                          const renderCol = (arr: any[]) => (
                            <div>
                              {arr.map(a => (
                                <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'4px 4px', borderRadius:6 }}>
                                  <span style={{ fontSize:12, lineHeight: '20px' }}>📄</span>
                                  <a
                                    href={`/post/${a.id}`}
                                    data-article-id={a.id}
                                    onClick={e=>{ e.preventDefault(); openReader(a.id) }}
                                    onMouseEnter={(e)=>{ setHoverPos({ x: e.clientX, y: e.clientY }); setHoverPreview({ title: a.title, html: a.content, img: getFirstImageSrc(a.content) || undefined }) }}
                                    onMouseLeave={()=> setHoverPreview(null)}
                                    style={{ color:'#111', textDecoration:'none' }}
                                  >
                                    {a.title}
                                  </a>
                                  <small style={{ marginLeft:8, opacity:.5 }}>{new Date(a.created_at).toLocaleDateString('ru-RU')}</small>
                                </div>
                              ))}
                            </div>
                          )
                          return (
                            <div key={sg.subtitle} id={`sub-${slugify(section.title)}-${slugify(sg.subtitle)}`}>
                              {sg.subtitle !== '—' && <h3 style={{ margin:'6px 0', fontSize:14, fontWeight:700, opacity:.85 }}>{sg.subtitle}</h3>}
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                                {renderCol(left)}
                                {renderCol(right)}
                              </div>
                              {sg.list.length > PAGE && (
                                <div style={{ marginTop:8 }}>
                                  <button
                                    onClick={()=> setExpandedGroups(prev=>({ ...prev, [key]: !prev[key] }))}
                                    style={{ border:'1px solid rgba(0,0,0,0.12)', background:'#fff', padding:'6px 10px', borderRadius:6, cursor:'pointer' }}
                                  >{isExpanded ? 'Свернуть' : 'Показать ещё'}</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Default list when not using grouped mode or in reader */}
        {(!notionMode || readerId !== null) && !isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            {!isLoading && filtered.length === 0 && <div style={{ color: '#888', padding: 16 }}>Посты не найдены</div>}
            {filtered.length > 0 && (
              <List height={Math.min(600, filtered.length * 160)} width={'100%'} itemCount={filtered.length} itemSize={160} overscanCount={5}>
                {({ index, style }: ListChildComponentProps) => {
                  const item = filtered[index] as any
                  const img = getFirstImageSrc(item.content)
                  const textPreview = getSnippet(item.content, 220)
                  return (
                    <div key={item.id} style={{...style, borderBottom:'1px solid var(--border-muted, rgba(0,0,0,0.08))', padding:'12px 16px', background:'transparent' }}>
                      <div style={{display:'grid', gridTemplateColumns:'80px 1fr', gap:12, alignItems:'start'}}>
                        <div style={{ width:80, height:80, background:'#f6f6f6', borderRadius:8, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={()=> toggleExpand(item.id)}>
                          {img ? (
                            <img src={img} alt='' style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          ) : (
                            <span style={{fontSize:11, opacity:.8, padding:6, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.25}}>{textPreview}</span>
                          )}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3, cursor:'pointer' }} onClick={()=> toggleExpand(item.id)}>{item.title}</h3>
                          <div style={{ marginTop:6, color:'#555', fontSize:13, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{textPreview}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <small style={{ opacity: .6 }}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                        <div style={{display:'flex', gap:16, alignItems:'center'}}>
                          <Tooltip title="Нравится"><span><IconButton size='small' onClick={()=>sendReaction(item.id,'❤️')}><FavoriteBorderIcon fontSize='small' /></IconButton><small style={{opacity:.7}}>{(reactionCounts[item.id]?.['❤️'] ?? 0) || ''}</small></span></Tooltip>
                          <Tooltip title="Огонь"><span><IconButton size='small' onClick={()=>sendReaction(item.id,'🔥')}><WhatshotIcon fontSize='small' /></IconButton><small style={{opacity:.7}}>{(reactionCounts[item.id]?.['🔥'] ?? 0) || ''}</small></span></Tooltip>
                          <Tooltip title="Класс"><span><IconButton size='small' onClick={()=>sendReaction(item.id,'👍')}><ThumbUpOffAltIcon fontSize='small' /></IconButton><small style={{opacity:.7}}>{(reactionCounts[item.id]?.['👍'] ?? 0) || ''}</small></span></Tooltip>
                        </div>
                      </div>
                    </div>
                  )
                }}
              </List>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {isLoadingMore && (
              <div style={{padding:'8px 16px'}}>
                <Skeleton variant='rectangular' height={60} />
              </div>
            )}
          </div>
        )}
        {(!notionMode || readerId === null) && showToTop && (
          <Fab size='small' color='primary' aria-label='Наверх' onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{ position:'fixed', right: 16, bottom: 16 }}>
            <NorthIcon fontSize='small' />
          </Fab>
        )}
        {notionMode && readerId !== null && (
          <div style={{ background:'#fff' }}>
            {/* Close (X) fixed */}
            <button aria-label='Закрыть' onClick={closeReader} style={{ position:'fixed', top:10, right:12, width:36, height:36, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.12)', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', cursor:'pointer', zIndex:10000 }}>×</button>
            {/* Scroll shadows */}
            <div style={{ position:'fixed', top:0, left:0, right:0, height:16, background:'linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0))', pointerEvents:'none', zIndex:9998 }} />
            <div style={{ position:'fixed', bottom:0, left:0, right:0, height:16, background:'linear-gradient(to top, rgba(0,0,0,0.06), rgba(0,0,0,0))', pointerEvents:'none', zIndex:9998 }} />
            <div style={{ width:'min(100%, 900px)', margin:'56px auto 24px', padding:'0 12px' }} onClick={handleContentClick}>
              <h1 style={{margin:'0 0 8px 0', fontSize:24, lineHeight:1.25}}>{(readerArticle as any)?.title}</h1>
              <div style={{opacity:.6, fontSize:12, marginBottom:12}}>{readerArticle ? new Date((readerArticle as any).created_at).toLocaleString('ru-RU') : ''}</div>
              {readerLoading && <div>Загрузка…</div>}
              {!readerLoading && readerArticle && (
                <article ref={contentRef} className='article-content' style={{ lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: (readerArticle as any).content }} />
              )}
            </div>
          </div>
        )}
        {/* Hover preview card */}
        {hoverPreview && (
          <div style={{ position:'fixed', top: Math.min(hoverPos.y + 12, window.innerHeight - 240), left: Math.min(hoverPos.x + 12, window.innerWidth - 360), width: 320, background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:12, zIndex:9999, pointerEvents:'none' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>{hoverPreview.title}</div>
            {hoverPreview.img && (
              <div style={{ width:'100%', height:140, overflow:'hidden', borderRadius:6, marginBottom:8 }}>
                <img src={hoverPreview.img} alt='' style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            <div style={{ fontSize:13, opacity:.8 }}>{getSnippet(hoverPreview.html, 180)}</div>
          </div>
        )}
        {/* Right TOC for grouped view */}
        {notionMode && readerId === null && !isLoading && !error && (
          <aside style={{ position:'fixed', right: 16, top: 96, width: 220, maxHeight: '70vh', overflow:'auto', background:'rgba(255,255,255,0.9)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:8, padding:8 }}>
            {(() => {
              type Section = { title: string, subgroups: Array<{ subtitle: string, list: any[] }> }
              const sectionMap = new Map<string, Section>()
              const cityLabelById = new Map<number, string>((dicts.cities || []).map((c:any)=>[c.value, c.label]))
              filtered.forEach((it: any) => {
                let sectionKey = 'Общее'
                const cats = (it.categories || []) as any[]
                if (cats.length && cats[0]?.top_category?.name) sectionKey = cats[0].top_category.name
                if (it.audience === 'city' || it.audience_city_id) sectionKey = 'Разделы по городам'
                const section = sectionMap.get(sectionKey) || { title: sectionKey, subgroups: [] }
                if (sectionKey === 'Разделы по городам') {
                  const cid = Number(it.audience_city_id || 0)
                  const subKey = cityLabelById.get(cid) || (cid ? `Город #${cid}` : 'Города')
                  let sub = section.subgroups.find(s => s.subtitle === subKey)
                  if (!sub) { sub = { subtitle: subKey, list: [] }; section.subgroups.push(sub) }
                } else {
                  let sub = section.subgroups.find(s => s.subtitle === '—')
                  if (!sub) { sub = { subtitle: '—', list: [] }; section.subgroups.push(sub) }
                }
                sectionMap.set(sectionKey, section)
              })
              const sections = Array.from(sectionMap.values())
              return (
                <nav>
                  {sections.map(sec => (
                    <div key={sec.title} style={{ marginBottom:8 }}>
                      <a href={`#sec-${slugify(sec.title)}`} onClick={(e)=>{ e.preventDefault(); document.getElementById(`sec-${slugify(sec.title)}`)?.scrollIntoView({ behavior:'smooth', block:'start' }) }} style={{ fontWeight:700, textDecoration:'none', color:'#111' }}>{sec.title}</a>
                      {sec.subgroups.filter(s=>s.subtitle!=='—').slice(0,12).map(sub => (
                        <div key={sub.subtitle}>
                          <a href={`#sub-${slugify(sec.title)}-${slugify(sub.subtitle)}`} onClick={(e)=>{ e.preventDefault(); document.getElementById(`sub-${slugify(sec.title)}-${slugify(sub.subtitle)}`)?.scrollIntoView({ behavior:'smooth', block:'start' }) }} style={{ display:'block', marginLeft:10, fontSize:12, textDecoration:'none', color:'#333', opacity:.85 }}>{sub.subtitle}</a>
                        </div>
                      ))}
                    </div>
                  ))}
                </nav>
              )
            })()}
          </aside>
        )}
      </Container>
    </div>
  )
}


