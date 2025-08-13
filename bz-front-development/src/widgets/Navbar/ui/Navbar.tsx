import {classNames} from "shared/lib/classNames/classNames";
import cls from './Navbar.module.scss'
import {AppLink, AppLinkTheme} from "shared/ui/AppLink/AppLink";
import LogoIcon from "shared/assets/icons/Logo.svg?react";
import {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/DashboardRounded'
import ArticleIcon from '@mui/icons-material/Article'
import LoginIcon from '@mui/icons-material/Login'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'

interface NavbarProps {
    className?: string
}

function Navbar({className}: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [adminAnchorEl, setAdminAnchorEl] = useState<null | HTMLElement>(null)
    const navigate = useNavigate()

    const handleAdminOpen = (e: React.MouseEvent<HTMLElement>) => setAdminAnchorEl(e.currentTarget)
    const handleAdminClose = () => setAdminAnchorEl(null)
    const handleLogout = () => {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_role')
      handleAdminClose()
      navigate('/')
    }
    return (
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Toolbar sx={{ gap: 2, minHeight: 64 }}>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }} onClick={()=> setIsOpen(v=>!v)}>
            <MenuIcon />
          </IconButton>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LogoIcon width='28px' height='28px' />
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>Студенческий Портал</Typography>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display:'none', gap:8, alignItems:'center', flexWrap:'wrap' }} className={cls.linksDesktop}>
            <AppLink theme={AppLinkTheme.SECONDARY} className={cls.mainLink} to={'/'}><DashboardIcon sx={{ fontSize: 16, mr: .5 }} /> Главная</AppLink>
            {/* remove public posts link */}
            <AppLink theme={AppLinkTheme.SECONDARY} to={'/choicerole'}><LoginIcon sx={{ fontSize: 16, mr: .5 }} /> Вход</AppLink>
            <AppLink theme={AppLinkTheme.SECONDARY} to={'/adminlogin'}><AdminPanelSettingsIcon sx={{ fontSize: 16, mr: .5 }} /> Админ</AppLink>
          </div>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Brightness4Icon />}
            onClick={() => {
              const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
              document.documentElement.setAttribute('data-theme', current)
              localStorage.setItem('theme', current)
              window.dispatchEvent(new CustomEvent('theme-change', { detail: current }))
            }}
            sx={{ borderRadius: 999 }}
          >Тема</Button>
          <Tooltip title="Администратор">
            <IconButton color="inherit" onClick={handleAdminOpen} aria-controls={adminAnchorEl ? 'admin-menu' : undefined} aria-haspopup="true" aria-expanded={Boolean(adminAnchorEl) ? 'true' : undefined}>
              <AdminPanelSettingsIcon />
            </IconButton>
          </Tooltip>
          <Menu id="admin-menu" anchorEl={adminAnchorEl} open={Boolean(adminAnchorEl)} onClose={handleAdminClose} keepMounted>
            <MenuItem onClick={() => { handleAdminClose(); navigate('/admin') }}>Панель</MenuItem>
            {/* remove public posts link */}
            <MenuItem onClick={handleLogout}>Выйти</MenuItem>
          </Menu>
        </Toolbar>

        {/* Mobile drawer-like menu */}
        {isOpen && (
          <div className={classNames(cls.mobileMenu, { [cls.open]: isOpen }, [])} style={{ padding: 12, borderTop: '1px solid var(--border-color)' }}>
            <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} className={cls.mainLink} to={'/'}>Главная</AppLink>
            {/* remove public posts link */}
            <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/choicerole'}>Страница входа</AppLink>
            <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/adminlogin'}>АдминЛог</AppLink>
            <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/adminregistration'}>АдминРег</AppLink>
            <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/studentlogin'}>СтудЛог</AppLink>
          </div>
        )}
      </AppBar>
    );
}

export default Navbar;
