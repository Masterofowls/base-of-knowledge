import * as React from 'react';
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RssFeedRoundedIcon from '@mui/icons-material/RssFeedRounded';
import http from 'shared/api/http'
import { Reactions } from 'shared/ui/Reactions'

interface ApiAuthor { full_name?: string }
interface ApiArticle {
  id: number
  title: string
  content: string
  categories?: Array<{ name: string }>
  authors?: Array<ApiAuthor>
  created_at?: string
}

const SyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  height: '100%',
  backgroundColor: (theme.vars || theme).palette.background.paper,
  '&:hover': {
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  '&:focus-visible': {
    outline: '3px solid',
    outlineColor: 'hsla(210, 98%, 48%, 0.5)',
    outlineOffset: '2px',
  },
}));

const SyledCardContent = styled(CardContent)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 16,
  flexGrow: 1,
  '&:last-child': {
    paddingBottom: 16,
  },
});

const StyledTypography = styled(Typography)({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

function Author({ authors }: { authors: { name: string; avatar: string }[] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
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

export function Search() {
  return (
    <FormControl sx={{ width: { xs: '100%', md: '25ch' } }} variant="outlined">
      <OutlinedInput
        size="small"
        id="search"
        placeholder="Search…"
        sx={{ flexGrow: 1 }}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
  );
}

export default function MainContent() {
  const navigate = useNavigate()
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null)
  const [articles, setArticles] = useState<ApiArticle[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [q, setQ] = useState<string>('')

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      try {
        const res = await http.get('/api/articles/')
        if (!ignore) setArticles(res.data || [])
      } catch(e) {
        // noop
      } finally {
        if (!ignore) setLoading(false)
      }
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

  function stripHtml(html: string): string {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return articles
    return articles.filter(a => (a.title?.toLowerCase().includes(query) || stripHtml(a.content || '').toLowerCase().includes(query)))
  }, [articles, q])

  function getArticle(index: number): ApiArticle | null {
    return filtered[index] ?? null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>
        <Typography variant="h1" gutterBottom>
          Blog
        </Typography>
        <Typography>Stay in the loop with the latest about our products</Typography>
      </div>
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          flexDirection: 'row',
          gap: 1,
          width: { xs: '100%', md: 'fit-content' },
          overflow: 'auto',
        }}
      >
        <FormControl sx={{ width: { xs: '100%', md: '25ch' } }} variant="outlined">
          <OutlinedInput
            size="small"
            id="search"
            placeholder="Search…"
            sx={{ flexGrow: 1 }}
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            startAdornment={
              <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
            inputProps={{ 'aria-label': 'search' }}
          />
        </FormControl>
        <IconButton size="small" aria-label="RSS feed">
          <RssFeedRoundedIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column-reverse', md: 'row' },
          width: '100%',
          justifyContent: 'space-between',
          alignItems: { xs: 'start', md: 'center' },
          gap: 4,
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            flexDirection: 'row',
            gap: 3,
            overflow: 'auto',
          }}
        >
          <Chip size="medium" label="All posts" />
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'row',
            gap: 1,
            width: { xs: '100%', md: 'fit-content' },
            overflow: 'auto',
          }}
        >
          <FormControl sx={{ width: { xs: '100%', md: '25ch' } }} variant="outlined">
            <OutlinedInput
              size="small"
              id="search-desktop"
              placeholder="Search…"
              sx={{ flexGrow: 1 }}
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              startAdornment={
                <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              }
              inputProps={{ 'aria-label': 'search' }}
            />
          </FormControl>
          <IconButton size="small" aria-label="RSS feed">
            <RssFeedRoundedIcon />
          </IconButton>
        </Box>
      </Box>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SyledCard
            variant="outlined"
            onFocus={() => handleFocus(0)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 0 ? 'Mui-focused' : ''}
            onClick={()=>{ const a = getArticle(0); if (a) navigate(`/admin/post/${a.id}`) }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={`https://picsum.photos/800/450?random=${(getArticle(0)?.id ?? 1) % 50}`}
              sx={{
                aspectRatio: '16 / 9',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />
            <SyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {(getArticle(0)?.categories?.[0]?.name) || 'Новость'}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {getArticle(0)?.title ?? '—'}
              </Typography>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {stripHtml(getArticle(0)?.content || '').slice(0, 160)}
              </StyledTypography>
            </SyledCardContent>
            {getArticle(0) && <Author authors={(getArticle(0)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
            {getArticle(0) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(0)!.id} /></Box>}
          </SyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SyledCard
            variant="outlined"
            onFocus={() => handleFocus(1)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 1 ? 'Mui-focused' : ''}
            onClick={()=>{ const a = getArticle(1); if (a) navigate(`/admin/post/${a.id}`) }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={`https://picsum.photos/800/450?random=${(getArticle(1)?.id ?? 2) % 50}`}
              aspect-ratio="16 / 9"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />
            <SyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {(getArticle(1)?.categories?.[0]?.name) || 'Новость'}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {getArticle(1)?.title ?? '—'}
              </Typography>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {stripHtml(getArticle(1)?.content || '').slice(0, 160)}
              </StyledTypography>
            </SyledCardContent>
            {getArticle(1) && <Author authors={(getArticle(1)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
            {getArticle(1) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(1)!.id} /></Box>}
          </SyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SyledCard
            variant="outlined"
            onFocus={() => handleFocus(2)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 2 ? 'Mui-focused' : ''}
            sx={{ height: '100%' }}
            onClick={()=>{ const a = getArticle(2); if (a) navigate(`/admin/post/${a.id}`) }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={`https://picsum.photos/800/450?random=${(getArticle(2)?.id ?? 3) % 50}`}
              sx={{
                height: { sm: 'auto', md: '50%' },
                aspectRatio: { sm: '16 / 9', md: '' },
              }}
            />
            <SyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {(getArticle(2)?.categories?.[0]?.name) || 'Новость'}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {getArticle(2)?.title ?? '—'}
              </Typography>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {stripHtml(getArticle(2)?.content || '').slice(0, 160)}
              </StyledTypography>
            </SyledCardContent>
            {getArticle(2) && <Author authors={(getArticle(2)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
            {getArticle(2) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(2)!.id} /></Box>}
          </SyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}
          >
            <SyledCard
              variant="outlined"
              onFocus={() => handleFocus(3)}
              onBlur={handleBlur}
              tabIndex={0}
              className={focusedCardIndex === 3 ? 'Mui-focused' : ''}
              sx={{ height: '100%' }}
              onClick={()=>{ const a = getArticle(3); if (a) navigate(`/admin/post/${a.id}`) }}
            >
              <SyledCardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  <Typography gutterBottom variant="caption" component="div">
                    {(getArticle(3)?.categories?.[0]?.name) || 'Новость'}
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div">
                    {getArticle(3)?.title ?? '—'}
                  </Typography>
                  <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                    {stripHtml(getArticle(3)?.content || '').slice(0, 160)}
                  </StyledTypography>
                </div>
              </SyledCardContent>
              {getArticle(3) && <Author authors={(getArticle(3)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
              {getArticle(3) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(3)!.id} /></Box>}
            </SyledCard>
            <SyledCard
              variant="outlined"
              onFocus={() => handleFocus(4)}
              onBlur={handleBlur}
              tabIndex={0}
              className={focusedCardIndex === 4 ? 'Mui-focused' : ''}
              sx={{ height: '100%' }}
              onClick={()=>{ const a = getArticle(4); if (a) navigate(`/admin/post/${a.id}`) }}
            >
              <SyledCardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  <Typography gutterBottom variant="caption" component="div">
                    {(getArticle(4)?.categories?.[0]?.name) || 'Новость'}
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div">
                    {getArticle(4)?.title ?? '—'}
                  </Typography>
                  <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                    {stripHtml(getArticle(4)?.content || '').slice(0, 160)}
                  </StyledTypography>
                </div>
              </SyledCardContent>
              {getArticle(4) && <Author authors={(getArticle(4)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
              {getArticle(4) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(4)!.id} /></Box>}
            </SyledCard>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SyledCard
            variant="outlined"
            onFocus={() => handleFocus(5)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 5 ? 'Mui-focused' : ''}
            sx={{ height: '100%' }}
            onClick={()=>{ const a = getArticle(5); if (a) navigate(`/admin/post/${a.id}`) }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={`https://picsum.photos/800/450?random=${(getArticle(5)?.id ?? 5) % 50}`}
              sx={{
                height: { sm: 'auto', md: '50%' },
                aspectRatio: { sm: '16 / 9', md: '' },
              }}
            />
            <SyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {(getArticle(5)?.categories?.[0]?.name) || 'Новость'}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {getArticle(5)?.title ?? '—'}
              </Typography>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {stripHtml(getArticle(5)?.content || '').slice(0, 160)}
              </StyledTypography>
            </SyledCardContent>
            {getArticle(5) && <Author authors={(getArticle(5)?.authors || []).map(a=>({ name: a.full_name || 'Автор', avatar: '' }))} />}
            {getArticle(5) && <Box sx={{ px: 2, pb: 2 }}><Reactions articleId={getArticle(5)!.id} /></Box>}
          </SyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}
