import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Autocomplete, TextField, Tabs, Tab, Card, CardContent, Skeleton, IconButton, Chip, Tooltip, Fab } from '@mui/material'
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
}

export default function PostsList({ expandAllDefault = false, fullscreen = false }: PostsListProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState(0)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [hasNext, setHasNext] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<number, Record<string, number>>>({})
  const [showToTop, setShowToTop] = useState(false)
  

  const pageFromURL = useMemo(() => Number(searchParams.get('page') ?? 1), [searchParams])
  useEffect(() => { setPage(pageFromURL) }, [pageFromURL])

  function loadPage(targetPage: number, opts: { append: boolean } = { append: false }) {
    const controller = new AbortController()
    if (!opts.append) setIsLoading(true)
    if (opts.append) setIsLoadingMore(true)
    setError(null)
    // Audience filters from localStorage
    const cityId = localStorage.getItem('student_city_id')
    const course = localStorage.getItem('student_course')
    const baseClass = localStorage.getItem('student_base_class')
    const params: any = { page: targetPage, per_page: 10, is_published: true, search: query || undefined, sort_by: 'created_at', sort_dir: 'desc', strict_audience: true }
    if (cityId) params.audience_city_id = Number(cityId)
    if (course) params.audience_course = Number(course)
    if (baseClass) params.base_class = Number(baseClass)
    http
      .get('/api/articles', { params, signal: controller.signal as any })
      .then(res => {
        const list = res.data?.articles ?? []
        const next = opts.append ? [...items, ...list] : list
        setItems(next)
        setHasNext(Boolean(res.data?.pagination?.has_next))
        // Load reactions for newly fetched items
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
  }, [query])

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

  function toggleExpand(id: number) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function getAvatarColor(seed: number): string {
    const colors = ['#8E76EF', '#4964ED', '#2F49D1', '#00AAFF', '#FF6B6B', '#FFC145']
    return colors[seed % colors.length]
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

  function getTagFromContent(html: string): 'important' | 'useful' | 'common' | undefined {
    const m = html.match(/<!--\s*tag:(important|useful|common)\s*-->/i)
    if (!m) return undefined
    return m[1].toLowerCase() as any
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
  return (
    <div className='page-center-wrapper' style={{ paddingTop: 0 }}>
      <Container gap='0' width={containerWidth} direction='column' paddings='0' className={cls.list}>
        {/* Header tools removed; search lives in header */}
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px: 2, borderBottom: '1px solid var(--border-muted, rgba(0,0,0,0.08))' }}>
          <Tab label="Все" />
          <Tab label="Важные" />
          <Tab label="Полезные" />
        </Tabs>

        {/* Feed */}
        {isLoading && <div style={{ padding: 16 }}>Загрузка…</div>}
        {error && <div style={{ padding: 16, color: '#E44A77' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            {!isLoading && items.length === 0 && <div style={{ color: '#888', padding: 16 }}>Посты не найдены</div>}
            {!isLoading && items.map(item => (
              <div key={item.id} style={{
                borderBottom: '1px solid var(--border-muted, rgba(0,0,0,0.08))',
                padding: '12px 16px',
                background: 'transparent',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 12
              }}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3, flex: '1 1 auto', cursor:'pointer' }} onClick={()=> toggleExpand(item.id)}>{item.title}</h3>
                    {(() => { const tag = getTagFromContent(item.content); if (!tag) return null; return <Chip size='small' label={tag==='important'?'Важное':tag==='useful'?'Полезное':'Общее'} color={tag==='important'?'error':tag==='useful'?'success':'default' as any} /> })()}
                  </div>
                  <div
                    className='article-content'
                    style={{
                      marginTop: 6,
                      maxHeight: undefined,
                      overflow: 'visible',
                      cursor: 'auto'
                    }}
                    onClick={()=> toggleExpand(item.id)}
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <small style={{ opacity: .6 }}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                    <div style={{display:'flex', gap:16, alignItems:'center'}}>
                      <Tooltip title="Нравится">
                        <span>
                          <IconButton size='small' onClick={()=>sendReaction(item.id,'❤️')}>
                            <FavoriteBorderIcon fontSize='small' />
                          </IconButton>
                          <small style={{opacity:.7}}>{(reactionCounts[item.id]?.['❤️'] ?? 0) || ''}</small>
                        </span>
                      </Tooltip>
                      <Tooltip title="Огонь">
                        <span>
                          <IconButton size='small' onClick={()=>sendReaction(item.id,'🔥')}>
                            <WhatshotIcon fontSize='small' />
                          </IconButton>
                          <small style={{opacity:.7}}>{(reactionCounts[item.id]?.['🔥'] ?? 0) || ''}</small>
                        </span>
                      </Tooltip>
                      <Tooltip title="Класс">
                        <span>
                          <IconButton size='small' onClick={()=>sendReaction(item.id,'👍')}>
                            <ThumbUpOffAltIcon fontSize='small' />
                          </IconButton>
                          <small style={{opacity:.7}}>{(reactionCounts[item.id]?.['👍'] ?? 0) || ''}</small>
                        </span>
                      </Tooltip>
                      <div style={{display:'flex', gap:8}}>
                        <Button onClick={() => handleShare(item)} theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent'><span>Поделиться</span></Button>
                        <Button onClick={() => handleCopy(item)} theme={ThemeButton.CLEAR} width='auto' backgroundColor='transparent'><span>Копировать</span></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
      </Container>
    </div>
  )
}


