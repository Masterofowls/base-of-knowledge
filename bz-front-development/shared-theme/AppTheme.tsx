import React from 'react'
import { ThemeProvider, createTheme, StyledEngineProvider, CssBaseline, type ThemeOptions } from '@mui/material'

interface AppThemeProps {
  children: React.ReactNode
  disableCustomTheme?: boolean
  themeComponents?: ThemeOptions['components']
}

export default function AppTheme({ children, disableCustomTheme, themeComponents }: AppThemeProps) {
  const mode = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'dark' : 'light'

  const baseTheme = createTheme({
    palette: { mode },
    shape: { borderRadius: 12 },
    components: disableCustomTheme ? undefined : {
      ...themeComponents,
      MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 999 } } },
    },
  })

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={baseTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}


