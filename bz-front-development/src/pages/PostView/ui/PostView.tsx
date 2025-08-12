import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import ArrowIcon from 'shared/assets/icons/ArrrowLeft.svg?react'
import { Reactions } from 'shared/ui/Reactions'

interface ArticleDetail {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  authors: { id: number; full_name: string }[]
  categories: any[]
}

export default function PostView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    http
      .get(`/api/articles/${id}`, { signal: controller.signal as any })
      .then(res => setItem(res.data))
      .catch(err => {
        if (controller.signal.aborted) return
        console.error(err)
        setError('Пост не найден')
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [id])

  function goBack() {
    navigate(-1)
  }

  return (
    <div className='page-center-wrapper' style={{ background: 'var(--card-bg)' }}>
      <Container gap='16px' width='min(100%, 900px)' direction='column' paddings='24px'>
        <span onClick={goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <ArrowIcon width='13px' height='11px' />
          <p>Назад</p>
        </span>

        {isLoading && <div>Загрузка…</div>}
        {error && <div style={{ color: '#E44A77' }}>{error}</div>}

        {item && !isLoading && !error && (
          <article style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backdropFilter: 'blur(2px)' }}>
            <h1 style={{ marginBottom: 8 }}>{item.title}</h1>
            <div style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>
              <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>
              {item.authors?.[0] && <span> · {item.authors[0].full_name}</span>}
            </div>
            <div className='article-content' dangerouslySetInnerHTML={{ __html: item.content }} />
            <div style={{ marginTop: 12 }}>
              <Reactions articleId={item.id} />
            </div>
          </article>
        )}
      </Container>
    </div>
  )
}


