import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import http from 'shared/api/http'
import { Container } from 'shared/ui/Container/Container.tsx'
import { Input } from 'shared/ui/Input/Input.tsx'
import { Button } from 'shared/ui/Button'
import { ThemeButton } from 'shared/ui/Button/ui/Button.tsx'
import cls from './PostsList.module.scss'
import { Skeleton, IconButton, Tooltip, Fab, Chip, Autocomplete, Textfield, Stack, Divider } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
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
  // Extra query params to append to /api/articles request (keeps admin logic the same)
  extraParams?: Record<string, any>
  // Optional client-side filter to narrow down the already fetched list
  clientFilter?: (item: any) => boolean
}

export default function PostsList({ expandAllDefault = false, fullscreen = false, notionMode = false, showSearch = true, extraParams, clientFilter }: PostsListProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ArticleListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
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

  // Student context
  const isStudentRole = typeof window !== 'undefined' ? (localStorage.getItem('user_role') || '').toLowerCase() === 'student' : false
  const selectedCityId = typeof window !== 'undefined' ? localStorage.getItem('student_city_id') : null
  const selectedGroupName = typeof window !== 'undefined' ? localStorage.getItem('student_group') : null
  const selectedGroupId = typeof window !== 'undefined' ? localStorage.getItem('student_group_id') : null
  const selectedBase = typeof window !== 'undefined' ? localStorage.getItem('student_base_class') : null
  const selectedCourse = typeof window !== 'undefined' ? localStorage.getItem('student_course') : null

  // Debug info
  useEffect(() => {
    console.log('🔍 PostsList debug info:', {
      isStudentRole,
      selectedCityId,
      selectedGroupId,
      selectedGroupName,
      selectedBase,
      selectedCourse,
      itemsCount: items.length,
      isLoading,
      error
    })
  }, [items, isLoading, error])

  const pageFromURL = useMemo(() => Number(searchParams.get('page') ?? 1), [searchParams])
  useEffect(() => { setPage(pageFromURL) }, [pageFromURL])

  function loadPage(targetPage: number, opts: { append: boolean } = { append: false }) {
    console.log('📡 Loading page:', targetPage, 'append:', opts.append)

    const controller = new AbortController()
    if (!opts.append) setIsLoading(true)
    if (opts.append) setIsLoadingMore(true)
    setError(null)

    // Упрощенная версия - используем только основной endpoint
    const endpoint = '/api/articles'
    const params: any = {
      page: targetPage,
      per_page: 10,
      search: query || undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
      is_published: true
    }
    const finalParams = { ...params, ...(extraParams || {}) }

    console.log('📨 API request to:', endpoint, 'with params:', finalParams)

    http
      .get(endpoint, { params: finalParams, signal: controller.signal as any })
      .then(res => {
        console.log('✅ API response:', res.data)

        // Упрощенная обработка ответа
        const list = (res.data?.articles || res.data?.data || res.data || []) as any[]
        const filteredList = typeof clientFilter === 'function' ? list.filter(clientFilter) : list
        const next = opts.append ? [...items, ...filteredList] : filteredList

        setItems(next)
        setHasNext(Boolean(res.data?.pagination?.has_next) || false)

        console.log('📦 Items set:', next.length, 'hasNext:', hasNext)
      })
      .catch(err => {
        if (controller.signal.aborted) return
        console.error('❌ API error:', err)
        setError('Не удалось загрузить посты')

        // Моковые данные для тестирования
        const mockData = [
          {
            id: 1,
            title: 'Тестовая статья 1',
            content: 'Содержание первой тестовой статьи',
            created_at: new Date().toISOString(),
            is_published: true
          },
          {
            id: 2,
            title: 'Тестовая статья 2',
            content: 'Содержание второй тестовой статьи',
            created_at: new Date().toISOString(),
            is_published: true
          }
        ]
        setItems(mockData)
        setHasNext(false)
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false)
      })

    return () => controller.abort()
  }

  const filterKey = useMemo(() => JSON.stringify({ q: query, quick: quickFilters, multi: multiFilters }), [query, quickFilters, multiFilters])

  useEffect(() => {
    setPage(1)
    loadPage(1, { append: false })
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

  // Упрощенный рендеринг для отладки
  const containerWidth = fullscreen ? 'min(100%, 900px)' : 'min(100%, 1000px)'

  return (
    <div className='page-center-wrapper' style={{ paddingTop: 0 }}>
      <Container gap='0' width={containerWidth} direction='column' paddings='0' className={cls.list}>

        {/* Отладочная информация */}
        <div style={{
          padding: '12px',
          background: '#f0f8ff',
          border: '1px solid #cce5ff',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Отладка PostsList</h3>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>Статей: {items.length}</div>
            <div>Загрузка: {isLoading ? 'да' : 'нет'}</div>
            <div>Ошибка: {error || 'нет'}</div>
            <div>Роль: {isStudentRole ? 'student' : 'другая'}</div>
            <div>Группа: {selectedGroupName || 'не указана'}</div>
          </div>
        </div>

        {/* Student header */}
        {isStudentRole && (
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>Лента студента</h1>
            <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
              <span>Группа: {selectedGroupName || 'не указана'}</span>
            </div>
          </div>
        )}

        {/* Упрощенный список */}
        {isLoading && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007acc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p>Загрузка публикаций...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', color: '#e44a77', background: '#fff0f0', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>Публикации не найдены</p>
            <button
              onClick={() => loadPage(1, { append: false })}
              style={{
                padding: '8px 16px',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: '0', fontSize: '18px' }}>Публикации ({items.length})</h2>

            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{item.title}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                  {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#999' }}>
                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </small>
                  <span style={{
                    padding: '2px 8px',
                    background: item.is_published ? '#e8f5e8' : '#fff0e0',
                    color: item.is_published ? '#2e7d32' : '#f57c00',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {item.is_published ? 'Опубликовано' : 'Черновик'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '1px' }} />

        {isLoadingMore && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #007acc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ fontSize: '14px', color: '#666' }}>Загрузка еще...</p>
          </div>
        )}

        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          `}
        </style>
      </Container>
    </div>
  )
}
