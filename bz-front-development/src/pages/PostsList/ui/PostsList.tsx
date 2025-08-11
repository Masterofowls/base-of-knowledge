import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'

interface ArticleListItem {
  id: number
  title: string
  content: string
  created_at: string
  is_published: boolean
}

export default function PostsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  const page = useMemo(() => Number(searchParams.get('page') ?? 1), [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    http
      .get('/api/articles', { params: { page, per_page: 10, is_published: true, search: query || undefined }, signal: controller.signal as any })
      .then(res => setItems(res.data?.articles ?? []))
      .catch(err => {
        if (controller.signal.aborted) return
        console.error(err)
        setError('Не удалось загрузить посты')
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [page, query])

  function handleOpen(id: number) {
    navigate(`/posts/${id}`)
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input placeholder='Поиск…' value={query} onChange={setQuery} style={{ flex: '1 1 240px' }} />
          <Button onClick={handleSearch} theme={ThemeButton.ARROW} backgroundColor='#00AAFF' width='140px'>
            <span>Найти</span>
          </Button>
        </div>

        {isLoading && <div>Загрузка…</div>}
        {error && <div style={{ color: '#E44A77' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {items.length === 0 && <div style={{ color: '#888' }}>Посты не найдены</div>}
            {items.map(item => (
              <div key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#666' }}>{item.content.length > 180 ? item.content.slice(0, 180) + '…' : item.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <small style={{ color: '#888' }}>{new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                  <Button onClick={() => handleOpen(item.id)} theme={ThemeButton.CLEAR} width='120px' backgroundColor='#7F61DD'>
                    <span>Читать</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}


