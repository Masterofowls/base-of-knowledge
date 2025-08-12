import {PanelAdmin} from "widgets/PanelAdmin";
import {classNames} from "shared/lib/classNames/classNames.ts";
import {QuickActionsAdmin} from "widgets/QuickActionsAdmin";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";
import { Card, CardContent, Tabs, Tab, Divider, Alert, Tooltip, Chip, Avatar, Badge, Container, Box, Grid } from '@mui/material'

export default function  MainPage() {
  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mt: 2 }}>
          <PanelAdmin />
        </Box>
        <Box sx={{ mt: 2 }}>
          <QuickActionsAdmin />
        </Box>
        <Grid container spacing={3} sx={{ my: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display:'flex', alignItems:'center', gap: 1.5, mb: 1.5 }}>
                  <Badge color="secondary" badgeContent={4}>
                    <Avatar>SP</Avatar>
                  </Badge>
                  <Chip label="Новости" color="primary" size="small" />
                </Box>
                <LatestPosts />
                <Divider sx={{ my: 1.5 }} />
                <Alert severity="info" sx={{ borderRadius: 2 }}>Здесь публикуются последние посты</Alert>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
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