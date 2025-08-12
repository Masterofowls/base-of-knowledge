// src/shared/saas/SaasNavbar.tsx
// Purpose: Saas UI based Navbar integrated with React Router, tailored links and admin menu

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Navbar as SaasNavbarBase,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarLink,
  PersonaAvatar,
} from '@saas-ui/react'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  MenuDivider,
  Box,
} from '@chakra-ui/react'
import { FiHome, FiLogIn } from 'react-icons/fi'

export default function SaasNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleNav(e: React.MouseEvent, href: string) {
    e.preventDefault()
    navigate(href)
  }

  return (
    <SaasNavbarBase
      position="sticky"
      zIndex={100}
      width="100%"
      borderBottomWidth="1px"
      background="transparent"
      backdropFilter="blur(10px)"
      px={4}
      py={2}
    >
      <NavbarBrand>
        <Box as="span" fontWeight="bold">Студенческий Портал</Box>
      </NavbarBrand>
      <NavbarContent display={{ base: 'flex', sm: 'flex' }} gap={4} alignItems="center" fontSize="sm">
        <NavbarItem>
          <NavbarLink aria-label="Главная" aria-current={location.pathname==='/'?'page':undefined} px={3} py={1} borderRadius="999px" _hover={{ bg: 'whiteAlpha.100' }} href="/" onClick={(e)=>handleNav(e,'/')}> 
            <Box as={FiHome} style={{ marginRight: 6 }} /> Главная
          </NavbarLink>
        </NavbarItem>
        <NavbarItem>
          <NavbarLink aria-label="Вход" aria-current={location.pathname.startsWith('/choice')?'page':undefined} px={3} py={1} borderRadius="999px" _hover={{ bg: 'whiteAlpha.100' }} href="/choicerole" onClick={(e)=>handleNav(e,'/choicerole')}>
            <Box as={FiLogIn} style={{ marginRight: 6 }} /> Вход
          </NavbarLink>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent as="div" justifyContent="end">
        <Menu>
          <MenuButton title="Тема" onClick={()=>{
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
            document.documentElement.setAttribute('data-theme', current)
            localStorage.setItem('theme', current)
            window.dispatchEvent(new CustomEvent('theme-change', { detail: current }))
          }}>
            <Brightness4Icon fontSize="small" />
          </MenuButton>
        </Menu>
        <Menu>
          <MenuButton>
            <PersonaAvatar name="Admin" size="xs" presence="online" />
          </MenuButton>
          <MenuList>
            <MenuGroup title="Администратор">
              <MenuItem onClick={()=>navigate('/admin')}>Панель</MenuItem>
            </MenuGroup>
            <MenuDivider />
            <MenuItem onClick={()=>{ localStorage.removeItem('jwt_token'); localStorage.removeItem('user_role'); navigate('/') }}>Выйти</MenuItem>
          </MenuList>
        </Menu>
      </NavbarContent>
    </SaasNavbarBase>
  )
}


