// src/shared/saas/SaasShell.tsx
// Purpose: Saas UI AppShell wrapper with Sidebar and our SaasNavbar

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppShell, Sidebar, SidebarSection, NavItem } from '@saas-ui/react'
import SaasNavbar from './SaasNavbar'

interface SaasShellProps {
  children: React.ReactNode
}

export default function SaasShell({ children }: SaasShellProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function go(path: string) {
    if (location.pathname !== path) navigate(path)
  }

  return (
    <AppShell
      navbar={<SaasNavbar />}
      contentProps={{ px: 0 }}
      sidebar={
        <Sidebar>
          <SidebarSection>
            <NavItem onClick={()=>go('/')}>Главная</NavItem>
            <NavItem onClick={()=>go('/admin/groups')}>Группы</NavItem>
            <NavItem onClick={()=>go('/choicerole')}>Вход</NavItem>
          </SidebarSection>
        </Sidebar>
      }
    >
      <div style={{ width:'100%', maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        {children}
      </div>
    </AppShell>
  )
}


