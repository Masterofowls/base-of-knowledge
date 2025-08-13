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
import HomeIcon from '@mui/icons-material/Home'
import ArticleIcon from '@mui/icons-material/Article'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SearchIcon from '@mui/icons-material/Search'
import Brightness4Icon from '@mui/icons-material/Brightness4'

export default function SaasNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [query, setQuery] = useState('')

  function go(path: string) {
    if (location.pathname !== path) navigate(path)
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

  return (
    <AppBar position='sticky' elevation={0} sx={{
      backdropFilter: 'blur(10px)',
      backgroundColor: 'transparent',
      borderBottom: theme => `1px solid ${theme.palette.mode==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    }}>
      <Toolbar sx={{ minHeight: 56, px: 2 }}>
        {/* Left: brand and primary nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant='subtitle1' fontWeight={800} sx={{ cursor: 'pointer', color: 'text.primary' }} onClick={()=>go('/')}>Студенческий Портал</Typography>
          <IconButton size='small' color={location.pathname==='/'?'primary':'default'} onClick={()=>go('/')}> <HomeIcon fontSize='small'/> </IconButton>
          {/* remove public posts route */}
          <IconButton size='small' color={location.pathname.startsWith('/admin')?'primary':'default'} onClick={()=>go('/admin')}> <DashboardIcon fontSize='small'/> </IconButton>
        </Box>

        {/* Center spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Search */}
        <Paper component='form' onSubmit={submitSearch} sx={{ display:'flex', alignItems:'center', px: 1, py: 0.25, borderRadius: 999, mr: 1.5, minWidth: { xs: 140, sm: 220 } }}>
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
  )
}

