import React from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'

export default function ColorModeSelect({ sx }: { sx?: any }) {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'))
  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }))
    setMode(next)
  }
  return (
    <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
      <IconButton onClick={toggle} sx={sx} color='inherit'>
        {mode === 'dark' ? <LightModeIcon/> : <DarkModeIcon/>}
      </IconButton>
    </Tooltip>
  )
}


