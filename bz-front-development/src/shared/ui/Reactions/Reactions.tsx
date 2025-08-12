import React, { useEffect, useState } from 'react'
import http from 'shared/api/http'
import { Box, Chip, IconButton, Tooltip } from '@mui/material'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import FavoriteIcon from '@mui/icons-material/Favorite'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import CelebrationIcon from '@mui/icons-material/Celebration'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import styles from './Reactions.module.scss'

interface ReactionCounts {
  [key: string]: number
}

interface ReactionsProps {
  articleId: number
  onReactionChange?: () => void
}

const REACTION_EMOJIS: Array<{ code: string; name: string; color: string; Icon: any }> = [
  { code: '👍', name: 'Нравится', color: '#2196F3', Icon: ThumbUpIcon },
  { code: '❤️', name: 'Любовь', color: '#E91E63', Icon: FavoriteIcon },
  { code: '😊', name: 'Радость', color: '#FF9800', Icon: EmojiEmotionsIcon },
  { code: '💡', name: 'Полезно', color: '#FFC107', Icon: LightbulbIcon },
  { code: '🎉', name: 'Отлично', color: '#9C27B0', Icon: CelebrationIcon },
  { code: '📈', name: 'Интересно', color: '#4CAF50', Icon: TrendingUpIcon },
]

export default function Reactions({ articleId, onReactionChange }: ReactionsProps) {
  const [counts, setCounts] = useState<ReactionCounts>({})
  const [loading, setLoading] = useState(false)
  const [userChoice, setUserChoice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    http
      .get(`/api/articles/${articleId}/reactions`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.counts || {}
        setCounts(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [articleId])

  function handleReact(code: string) {
    if (loading) return
    setLoading(true)
    http
      .post(`/api/articles/${articleId}/reactions`, { emoji_code: code })
      .then(() => {
        setCounts(prev => ({ ...prev, [code]: (prev[code] || 0) + 1 }))
        setUserChoice(code)
        onReactionChange?.()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  return (
    <Box className={styles.reactionsContainer}>
      <div className={styles.reactionsList}>
        {REACTION_EMOJIS.map(({ code, name, color, Icon }) => (
          <Tooltip key={code} title={name} arrow>
            <IconButton
              className={`${styles.reactionButton} ${userChoice === code ? styles.active : ''}`}
              onClick={() => handleReact(code)}
              disabled={loading}
              size="small"
              sx={{ '&:hover': { backgroundColor: `${color}20` } }}
              aria-label={`Реакция: ${name}`}
            >
              <Icon sx={{ color: userChoice === code ? color : 'inherit' }} />
              {!!counts[code] && (
                <Chip
                  label={counts[code]}
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: 12, backgroundColor: color, color: '#fff' }}
                />
              )}
            </IconButton>
          </Tooltip>
        ))}
      </div>
    </Box>
  )
}


