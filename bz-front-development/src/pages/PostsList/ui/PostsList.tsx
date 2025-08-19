import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Autocomplete, TextField, Tabs, Tab, Card, CardContent, Skeleton, IconButton, Tooltip, Fab, Chip } from '@mui/material'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
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
}

export default function PostsList({ expandAllDefault = false, fullscreen = false, notionMode = false }: PostsListProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState(0)
  const [quickFilters, setQuickFilters] = useState<{ city?: string; group?: string }>({})
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
  const [extraFilters, setExtraFilters] = useState<any>({})

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
    const endpoint = isStudent && groupId ? '/api/articles/student-feed' : '/api/articles'
    const params: any = { page: targetPage, per_page: 10, search: query || undefined, sort_by: 'created_at', sort_dir: 'desc', ...extraFilters }
    if (quickFilters.city) params.audience_city_id = Number(quickFilters.city)
    if (quickFilters.group) params.group_id = Number(quickFilters.group)
    if (!isStudent || !groupId) {
      params.is_published = true
      params.strict_audience = strict
      if (course) params.audience_course = Number(course)
      if (baseClass) params.base_class = Number(baseClass)
    } else {
      if (groupId) params.group_id = Number(groupId)
      if (course) params.course = Number(course)
      if (baseClass) params.base_class = Number(baseClass)
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

  useEffect(() => {
    setPage(1)
    loadPage(1, { append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, extraFilters])

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
      setTimeout(loadRelated, 0)
      setTimeout(wireOutlineObserver, 0)
    }).catch(()=> setReaderArticle(null)).finally(()=> setReaderLoading(false))
  }

  function closeReader() {
    setReaderId(null)
    setReaderArticle(null)
    setOutline([])
    setActiveOutlineId(null)
    setRelated([])
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

  async function loadRelated() {
    try {
      const cats = (readerArticle?.categories || []) as any[]
      const t = cats.find(c => c.top_category?.id)
      const s = cats.find(c => c.subcategory?.id)
      const params: any = { page: 1, per_page: 10, is_published: true }
      if (t) params.top_category_id = t.top_category.id
      else if (s) params.subcategory_id = s.subcategory.id
      const res = await http.get('/api/articles', { params })
      const list = (res.data?.articles || []).filter((a:any)=>a.id !== readerId).map((a:any)=>({ id: a.id, title: a.title }))
      setRelated(list)
    } catch {}
  }

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

  const containerWidth = fullscreen ? 'min(100%, 900px)' : 'min(100%, 1000px)'
  const filtered = items.filter((it) => {
    if (tab === 0) return true
    const cats: any[] = (it as any).categories || []
    const names = cats.map(c => c?.top_category?.name?.toLowerCase?.() || '')
    if (tab === 1) return names.some(n => n.includes('общ'))
    if (tab === 2) return names.some(n => n.includes('учеб'))
    return true
  })
  return (
    <div className='page-center-wrapper' style={{ paddingTop: 0 }}>
      <Container gap='0' width={containerWidth} direction='column' paddings='0' className={cls.list}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px: 2, borderBottom: '1px solid var(--border-muted, rgba(0,0,0,0.08))' }}>
          <Tab label="Все" />
          <Tab label="Общая" />
          <Tab label="Учебная" />
        </Tabs>
        {/* Быстрые фильтры */}
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 12px', flexWrap:'wrap' }}>
          <Chip size='small' label='Сбросить фильтры' onClick={()=>{ setQuickFilters({}); setExtraFilters({}) }} />
          <Chip size='small' color={quickFilters.city ? 'primary':'default'} label={quickFilters.city ? `Город #${quickFilters.city}`:'Город'} onClick={()=>{
            const cityId = localStorage.getItem('student_city_id'); if (cityId) setQuickFilters(q=>({...q, city: cityId}));
          }} />
          <Chip size='small' color={quickFilters.group ? 'primary':'default'} label={quickFilters.group ? `Группа #${quickFilters.group}`:'Группа'} onClick={()=>{
            const groupId = localStorage.getItem('student_group_id'); if (groupId) setQuickFilters(q=>({...q, group: groupId}));
          }} />
        </div>

        {isLoading && <div style={{ padding: 16 }}>Загрузка…</div>}
        {error && <div style={{ padding: 16, color: '#E44A77' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            {!isLoading && filtered.length === 0 && <div style={{ color: '#888', padding: 16 }}>Посты не найдены</div>}
            {filtered.length > 0 && (
              <List height={Math.min(600, filtered.length * 120)} width={'100%'} itemCount={filtered.length} itemSize={120} overscanCount={5}>
                {({ index, style }: ListChildComponentProps) => {
                  const item = filtered[index] as any
                  return (
                    <div key={item.id} style={{...style, borderBottom:'1px solid var(--border-muted, rgba(0,0,0,0.08))', padding:'12px 16px', background:'transparent' }}>
                      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                        <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3, flex: '1 1 auto', cursor:'pointer' }} onClick={()=> toggleExpand(item.id)}>{item.title}</h3>
                      </div>
                      {!notionMode && (
                        <>
                          <div className='article-content' style={{ marginTop:6, maxHeight: expanded[item.id] ? undefined : 80, overflow: expanded[item.id] ? 'visible':'hidden' }} onClick={()=> toggleExpand(item.id)} dangerouslySetInnerHTML={{ __html: item.content }} />
                          {!expanded[item.id] && (
                            <div style={{ marginTop: 6 }}>
                              <Button theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent' onClick={()=>toggleExpand(item.id)}><span>Показать полностью</span></Button>
                            </div>
                          )}
                        </>
                      )}
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
        {showToTop && (
          <Fab size='small' color='primary' aria-label='Наверх' onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{ position:'fixed', right: 16, bottom: 16 }}>
            <NorthIcon fontSize='small' />
          </Fab>
        )}
        {notionMode && readerId !== null && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', justifyContent:'flex-end', zIndex:50 }} onClick={closeReader}>
            <div onClick={e=>e.stopPropagation()} style={{ width:'min(100%, 1000px)', height:'100%', background:'#fff', display:'grid', gridTemplateColumns:'280px 1fr', gap:0 }}>
              <aside style={{ borderRight:'1px solid rgba(0,0,0,0.08)', padding:'16px', overflowY:'auto' }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>Содержание</div>
                {outline.length === 0 && <div style={{opacity:.6, fontSize:13}}>Нет заголовков</div>}
                <div style={{ display:'grid', gap:6 }}>
                  {outline.map(it => (
                    <a key={it.id} href={"#"+it.id} onClick={(e)=>{ e.preventDefault(); const el = document.getElementById(it.id); el?.scrollIntoView({behavior:'smooth', block:'start'}); }} style={{ fontSize:13, paddingLeft: (it.level-1)*12, color: it.id===activeOutlineId ? '#2F49D1' : '#333', fontWeight: it.id===activeOutlineId ? 700 : 400, textDecoration:'none' }}>{it.text || 'Раздел'}</a>
                  ))}
                </div>
                <div style={{ fontWeight:700, margin:'16px 0 8px' }}>Похожие</div>
                <div style={{ display:'grid', gap:8 }}>
                  {related.map(r => (
                    <button key={r.id} onClick={()=>openReader(r.id)} style={{ textAlign:'left', background:'transparent', border:'none', padding:0, color:'#2F49D1', cursor:'pointer' }}>{r.title}</button>
                  ))}
                  {related.length === 0 && <div style={{opacity:.6, fontSize:13}}>Нет данных</div>}
                </div>
              </aside>
              <div style={{ height:'100%', overflowY:'auto', position:'relative' }} onClick={handleContentClick}>
                <div style={{ padding:'16px 24px 80px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                  {/* breadcrumbs */}
                  {readerArticle && (
                    <div style={{fontSize:12, opacity:.7, display:'flex', gap:6, flexWrap:'wrap', marginBottom:8}}>
                      {(readerArticle.categories||[]).map((c:any, idx:number)=> (
                        <span key={idx}>
                          <a href="#" onClick={(e)=>{e.preventDefault(); setExtraFilters({ top_category_id: c?.top_category?.id || undefined, subcategory_id: c?.subcategory?.id || undefined }); setReaderId(null); setReaderArticle(null);}} style={{color:'#2F49D1', textDecoration:'none'}}>{c.top_category?.name || 'Категория'}</a>
                          {c.subcategory?.name ? ` / ${c.subcategory.name}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
                    <h2 style={{margin:0, fontSize: 22}}>{(readerArticle as any)?.title}</h2>
                    <div style={{position:'sticky', right:0, display:'flex', gap:8}}>
                      <Button theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent' onClick={()=>readerNavigate(-1)}><span>←</span></Button>
                      <Button theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent' onClick={()=>readerNavigate(1)}><span>→</span></Button>
                      <Button theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent' onClick={closeReader}><span>Закрыть</span></Button>
                    </div>
                  </div>
                  <div style={{opacity:.6, fontSize:12, marginTop:6}}>{readerArticle ? new Date((readerArticle as any).created_at).toLocaleString('ru-RU') : ''}</div>
                </div>
                <div style={{ padding:'24px 24px 80px' }}>
                  {readerLoading && <div>Загрузка…</div>}
                  {!readerLoading && readerArticle && (
                    <article ref={contentRef} className='article-content' style={{ lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: (readerArticle as any).content }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}


