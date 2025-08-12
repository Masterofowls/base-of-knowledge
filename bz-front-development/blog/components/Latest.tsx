import * as React from 'react';
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import http from 'shared/api/http'
import { Reactions } from 'shared/ui/Reactions'

interface ApiAuthor { full_name?: string }
interface ApiArticle {
  id: number
  title: string
  content: string
  categories?: Array<{ name: string }>
  authors?: Array<ApiAuthor>
}

const StyledTypography = styled(Typography)({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const TitleTypography = styled(Typography)(({ theme }) => ({
  position: 'relative',
  textDecoration: 'none',
  '&:hover': { cursor: 'pointer' },
  '& .arrow': {
    visibility: 'hidden',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '&:hover .arrow': {
    visibility: 'visible',
    opacity: 0.7,
  },
  '&:focus-visible': {
    outline: '3px solid',
    outlineColor: 'hsla(210, 98%, 48%, 0.5)',
    outlineOffset: '3px',
    borderRadius: '8px',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 0,
    height: '1px',
    bottom: 0,
    left: 0,
    backgroundColor: (theme.vars || theme).palette.text.primary,
    opacity: 0.3,
    transition: 'width 0.3s ease, opacity 0.3s ease',
  },
  '&:hover::before': {
    width: '100%',
  },
}));

function Author({ authors }: { authors: { name: string; avatar: string }[] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}
      >
        <AvatarGroup max={3}>
          {authors.map((author, index) => (
            <Avatar
              key={index}
              alt={author.name}
              src={author.avatar}
              sx={{ width: 24, height: 24 }}
            />
          ))}
        </AvatarGroup>
        <Typography variant="caption">
          {authors.map((author) => author.name).join(', ')}
        </Typography>
      </Box>
      <Typography variant="caption">July 14, 2021</Typography>
    </Box>
  );
}

export default function Latest() {
  const navigate = useNavigate()
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null)
  const [articles, setArticles] = useState<ApiArticle[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize))
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await http.get('/api/articles/')
        if (!ignore) setArticles(res.data || [])
      } catch(e) {}
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleFocus = (index: number) => {
    setFocusedCardIndex(index);
  };

  const handleBlur = () => {
    setFocusedCardIndex(null);
  };

  const items = useMemo(() => {
    const start = (page - 1) * pageSize
    return articles.slice(start, start + pageSize)
  }, [page, articles])

  return (
    <div>
      <Typography variant="h2" gutterBottom>
        Latest
      </Typography>
      <Grid container spacing={8} columns={12} sx={{ my: 4 }}>
        {items.map((article, index) => {
          const isExpanded = expandedId === article.id
          const gridSize = isExpanded ? { xs: 12 } : { xs: 12, sm: 6 }
          const tag = article.categories?.[0]?.name
          return (
            <Grid key={article.id} size={gridSize}>
              <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: isExpanded ? 6 : 1, transition: 'box-shadow .2s ease' }}>
                <CardContent>
                  <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 1 }}>
                    {tag && <Chip size="small" label={tag} />}
                    <Box sx={{ flex: 1 }} />
                  </Box>
                  <TitleTypography
                    gutterBottom
                    variant="h6"
                    onFocus={() => handleFocus(index)}
                    onBlur={handleBlur}
                    tabIndex={0}
                    className={focusedCardIndex === index ? 'Mui-focused' : ''}
                    onClick={() => setExpandedId(isExpanded ? null : article.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {article.title}
                    <NavigateNextRoundedIcon className="arrow" sx={{ fontSize: '1rem' }} />
                  </TitleTypography>
                  {isExpanded ? (
                    <Box
                      className='article-content'
                      onClick={() => setExpandedId(null)}
                      sx={{ cursor: 'default' }}
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  ) : (
                    <StyledTypography variant="body2" color="text.secondary" gutterBottom onClick={() => setExpandedId(article.id)} sx={{ cursor: 'pointer' }}>
                      {article.content?.replace(/<[^>]+>/g,'').slice(0, 220)}
                    </StyledTypography>
                  )}

                  <Box sx={{ mt: 1 }}>
                    <Author authors={(article.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Reactions articleId={article.id} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
        <Pagination page={page} onChange={(_, p)=>setPage(p)} hidePrevButton hideNextButton count={totalPages} boundaryCount={Math.min(10, totalPages)} />
      </Box>
    </div>
  );
}
