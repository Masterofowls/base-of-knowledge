import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Autocomplete, TextField, Tabs, Tab, Card, CardContent, Skeleton } from '@mui/material'

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

export default function PostsList({ expandAllDefault = false }: PostsListProps) {
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
  

  const pageFromURL = useMemo(() => Number(searchParams.get('page') ?? 1), [searchParams])
  useEffect(() => { setPage(pageFromURL) }, [pageFromURL])

  function loadPage(targetPage: number, opts: { append: boolean } = { append: false }) {
    const controller = new AbortController()
    if (!opts.append) setIsLoading(true)
    if (opts.append) setIsLoadingMore(true)
    setError(null)
    http
      .get('/api/articles', { params: { page: targetPage, per_page: 10, is_published: true, search: query || undefined }, signal: controller.signal as any })
      .then(res => {
        const list = res.data?.articles ?? []
        const next = opts.append ? [...items, ...list] : list
        setItems(next)
        setHasNext(Boolean(res.data?.pagination?.has_next))
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

  function toggleExpand(id: number) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
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

  return (
    <div className='page-center-wrapper'>
      <Container gap='16px' width='min(100%, 1000px)' direction='column' paddings='24px' className={cls.list}>
        <h2>Посты</h2>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)}>
          <Tab label="Все" />
          <Tab label="Важные" />
          <Tab label="Полезные" />
        </Tabs>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Autocomplete freeSolo options={items.map(i=>i.title)} renderInput={(params)=> (
            <TextField {...params} label="Поиск" variant="outlined" size="small" style={{flex:'1 1 280px'}} />
          )} onInputChange={(_,v)=>setQuery(v)} value={query} />
          <Button onClick={handleSearch} theme={ThemeButton.ARROW} backgroundColor='#00AAFF' width='140px'>
            <span>Найти</span>
          </Button>
        </div>

        {isLoading && <div>Загрузка…</div>}
        {error && <div style={{ color: '#E44A77' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {isLoading && (
              <Card><CardContent>
                <Skeleton variant='text' width='60%' />
                <Skeleton variant='rectangular' height={80} style={{marginTop:8}} />
              </CardContent></Card>
            )}
            {!isLoading && items.length === 0 && <div style={{ color: '#888' }}>Посты не найдены</div>}
            {!isLoading && items.map(item => (
              <Card key={item.id} style={{ background:'rgba(255,255,255,0.02)'}}>
                <CardContent>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <h3 style={{ marginTop: 0, marginBottom: 8, flex: '1 1 auto' }}>{item.title}</h3>
                    {(() => { const tag = getTagFromContent(item.content); if (!tag) return null; return <Chip size='small' label={tag==='important'?'Важное':tag==='useful'?'Полезное':'Общее'} color={tag==='important'?'error':tag==='useful'?'success':'default' as any} /> })()}
                  </div>
                  <div
                    className='article-content'
                    style={{
                      maxHeight: expandAllDefault || expanded[item.id] ? undefined : '6.5em',
                      overflow: expandAllDefault || expanded[item.id] ? undefined : 'hidden',
                      transition: 'max-height .25s ease',
                    }}
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <small style={{ color: '#9CA3AF' }}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <Button onClick={() => handleShare(item)} theme={ThemeButton.CLEAR} width='90px' backgroundColor='#7F61DD'><span>Поделиться</span></Button>
                      <Button onClick={() => handleCopy(item)} theme={ThemeButton.CLEAR} width='90px' backgroundColor='#7F61DD'><span>Копировать</span></Button>
                      {!expandAllDefault && (
                        <Button onClick={() => toggleExpand(item.id)} theme={ThemeButton.CLEAR} width='160px' backgroundColor='#7F61DD'>
                          <span>{expanded[item.id] ? 'Свернуть' : 'Показать полностью'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {isLoadingMore && (
              <div style={{padding:'8px 0'}}>
                <Skeleton variant='rectangular' height={60} />
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}


