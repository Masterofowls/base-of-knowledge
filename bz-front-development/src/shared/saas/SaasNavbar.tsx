// src/shared/saas/SaasNavbar.tsx
// Purpose: Modern MUI AppBar-based header with router navigation, search, theme toggle, and avatar menu

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SearchIcon from '@mui/icons-material/Search'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import LoginIcon from '@mui/icons-material/Login'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SchoolIcon from '@mui/icons-material/School'
import MenuIcon from '@mui/icons-material/Menu'

export default function SaasNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  function go(path: string) {
    if (location.pathname !== path) navigate(path)
    setMobileOpen(false)
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', current)
    localStorage.setItem('theme', current)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: current }))
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(location.search)
    if (query.trim()) params.set('q', query.trim())
    else params.delete('q')
    navigate(`${location.pathname}?${params.toString()}`)
  }

  const navigationItems = [
    { path: '/', label: 'Главная', icon: <HomeIcon />, color: location.pathname === '/' ? 'primary' : 'default' },
    { path: '/admin', label: 'Панель', icon: <DashboardIcon />, color: location.pathname.startsWith('/admin') ? 'primary' : 'default' },
    { path: '/choicerole', label: 'Вход в систему', icon: <LoginIcon />, color: location.pathname === '/choicerole' ? 'primary' : 'default' },
    { path: '/adminlogin', label: 'Вход администратора', icon: <AdminPanelSettingsIcon />, color: location.pathname === '/adminlogin' ? 'primary' : 'default' },
    { path: '/studentlogin', label: 'Вход студента', icon: <SchoolIcon />, color: location.pathname === '/studentlogin' ? 'primary' : 'default' },
  ]

  return (
    <>
      <AppBar position='sticky' elevation={0} sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'transparent',
        borderBottom: theme => `1px solid ${theme.palette.mode==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}>
        <Toolbar sx={{ minHeight: 56, px: 2 }}>
          {/* Mobile menu button */}
          <IconButton
            size='large'
            edge='start'
            color='inherit'
            aria-label='menu'
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Left: brand and primary nav */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant='subtitle1' fontWeight={800} sx={{ cursor: 'pointer', color: 'text.primary' }} onClick={()=>go('/')}>Студенческий Портал</Typography>
            <IconButton size='small' color={location.pathname==='/'?'primary':'default'} onClick={()=>go('/')}> <HomeIcon fontSize='small'/> </IconButton>
            {/* remove public posts route */}
            <IconButton size='small' color={location.pathname.startsWith('/admin')?'primary':'default'} onClick={()=>go('/admin')}> <DashboardIcon fontSize='small'/> </IconButton>
          </Box>

          {/* Center spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Navigation Links - Desktop only */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 2 }}>
            <Tooltip title='Вход в систему'>
              <IconButton size='small' color={location.pathname==='/choicerole'?'primary':'default'} onClick={()=>go('/choicerole')}>
                <LoginIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Вход администратора'>
              <IconButton size='small' color={location.pathname==='/adminlogin'?'primary':'default'} onClick={()=>go('/adminlogin')}>
                <AdminPanelSettingsIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Вход студента'>
              <IconButton size='small' color={location.pathname==='/studentlogin'?'primary':'default'} onClick={()=>go('/studentlogin')}>
                <SchoolIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Search */}
          <Paper component='form' onSubmit={submitSearch} sx={{ display:'flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: 999, mr: 1.5, minWidth: { xs: 140, sm: 220 } }}>
            <SearchIcon fontSize='small' sx={{ opacity: .6 }} />
            <InputBase placeholder='Поиск' value={query} onChange={(e)=>setQuery(e.target.value)} sx={{ ml: .5, fontSize: 14 }} />
          </Paper>

          {/* Theme toggle */}
          <Tooltip title='Тема'>
            <IconButton size='small' onClick={toggleTheme} sx={{ mr: 1 }}>
              <Brightness4Icon fontSize='small' />
            </IconButton>
          </Tooltip>

          {/* Avatar menu */}
          <Tooltip title='Меню'>
            <IconButton size='small' onClick={(e)=>setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 28, height: 28 }}>A</Avatar>
            </IconButton>
          </Tooltip>
          <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={()=>setAnchorEl(null)}>
            <MenuItem onClick={()=>{ setAnchorEl(null); go('/admin') }}>Панель</MenuItem>
            {/* remove public posts route */}
            <MenuItem onClick={()=>{ setAnchorEl(null); localStorage.removeItem('jwt_token'); localStorage.removeItem('user_role'); navigate('/') }}>Выйти</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor='left'
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant='h6' sx={{ px: 2, mb: 2, fontWeight: 600 }}>
            Навигация
          </Typography>
          <List>
            {navigationItems.map((item) => (
              <ListItem 
                key={item.path} 
                button 
                onClick={() => go(item.path)}
                sx={{ 
                  color: item.color === 'primary' ? 'primary.main' : 'text.primary',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <List>
            <ListItem button onClick={toggleTheme}>
              <ListItemIcon>
                <Brightness4Icon />
              </ListItemIcon>
              <ListItemText primary='Сменить тему' />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  )
}

