import {PanelAdmin} from "widgets/PanelAdmin";
import {classNames} from "shared/lib/classNames/classNames.ts";
import {QuickActionsAdmin} from "widgets/QuickActionsAdmin";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";
import http from 'shared/api/http'
import { useEffect, useState } from 'react'
import { Card, CardContent, Divider, Alert, Tooltip, Chip, Avatar, Badge, Container, Box, Grid, Typography, Stack } from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import GroupIcon from '@mui/icons-material/Groups'

export default function  MainPage() {
  const [postCount, setPostCount] = useState<number | null>(null)
  const [groupCount, setGroupCount] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [articlesRes, groupsRes] = await Promise.all([
          http.get('/api/articles/'),
          http.get('/api/categories/groups')
        ])
        if (!ignore) {
          const list = Array.isArray(articlesRes.data) ? articlesRes.data : (articlesRes.data?.articles || [])
          setPostCount(list.length ?? 0)
          setGroupCount((groupsRes.data || []).length ?? 0)
        }
      } catch(e) {}
    }
    load()
    return () => { ignore = true }
  }, [])

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Hero summary */}
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" fontWeight={700}>Панель администратора</Typography>
                <Typography variant="body2" color="text.secondary">Краткая сводка по контенту и группам</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip icon={<ArticleIcon />} label={`Постов: ${postCount ?? '—'}`} color="primary" variant="filled" sx={{ borderRadius: 2 }} />
                  <Chip icon={<GroupIcon />} label={`Групп: ${groupCount ?? '—'}`} color="success" variant="filled" sx={{ borderRadius: 2 }} />
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <PanelAdmin />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Box sx={{ mt: 2 }}>
          <QuickActionsAdmin />
        </Box>

        {/* Content grid */}
        <Grid container spacing={3} sx={{ my: 3 }}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, mb: 1.5 }}>
                  <Badge color="secondary" badgeContent={postCount ?? 0}>
                    <Avatar><ArticleIcon fontSize="small" /></Avatar>
                  </Badge>
                  <Chip label="Последние посты" color="primary" size="small" />
                </Box>
                <LatestPosts />
                <Divider sx={{ my: 1.5 }} />
                <Alert severity="info" sx={{ borderRadius: 2 }}>Нажимайте на пост, чтобы развернуть его содержимое.</Alert>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Tooltip title="Группы студентов" placement="top-start">
                  <div><Groups/></div>
                </Tooltip>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </main>
  );
}