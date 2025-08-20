import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Tabs, Tab, Skeleton, IconButton, Tooltip, Fab, Chip, Paper, InputBase } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
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
  const headerPrevDisplay = useRef<string | null>(null)
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
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 12px', borderBottom: '1px solid var(--border-muted, rgba(0,0,0,0.08))' }}>
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ minHeight: 40 }}>
            <Tab label="Все" />
            <Tab label="Общая" />
            <Tab label="Учебная" />
          </Tabs>
          {showSearch && (
            <form onSubmit={(e)=>{ e.preventDefault(); handleSearch() }}>
              <Paper elevation={1} sx={{ display:'flex', alignItems:'center', px:1.5, py:0.5 }}>
                <SearchIcon fontSize='small' sx={{ mr: 1 }} />
                <InputBase placeholder='Поиск' value={query} onChange={(e)=>setQuery(e.target.value)} sx={{ minWidth: 220 }} />
              </Paper>
            </form>
          )}
        </div>
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
        {showToTop && (
          <Fab size='small' color='primary' aria-label='Наверх' onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{ position:'fixed', right: 16, bottom: 16 }}>
            <NorthIcon fontSize='small' />
          </Fab>
        )}
        {notionMode && readerId !== null && (
          <div style={{ position:'fixed', inset:0, background:'#fff', zIndex:9999 }}>
            {/* Close (X) */}
            <button aria-label='Закрыть' onClick={closeReader} style={{ position:'fixed', top:10, right:12, width:36, height:36, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.12)', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', cursor:'pointer' }}>×</button>
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
      </Container>
    </div>
  )
}


