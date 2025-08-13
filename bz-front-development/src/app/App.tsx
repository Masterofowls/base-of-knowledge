import './styles/index.scss'
import {AppRouter} from "app/providers/router";
// import {Navbar} from "widgets/Navbar";
import SaasShell from 'shared/saas/SaasShell'
import {classNames} from "shared/lib/classNames/classNames";
import {Footer} from "widgets/Footer";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { SaasProvider } from '@saas-ui/react'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/nunito/300.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import {useEffect, useState} from 'react'


function App() {
    const [muiMode, setMuiMode] = useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'))

    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        const theme = stored ?? (prefersDark ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', theme)
        setMuiMode(theme)
        const handler = (e: any) => {
            const next = e?.detail as 'light' | 'dark'
            if (next) setMuiMode(next)
        }
        window.addEventListener('theme-change', handler as any)
        return () => window.removeEventListener('theme-change', handler as any)
    }, [])
    const theme = createTheme({
        palette: { mode: muiMode },
        typography: { fontFamily: ['Nunito', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(',') },
        shape: { borderRadius: 12 },
    })

    return (
        <SaasProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className={classNames('app', {}, [])}>
                    <SaasShell>
                        <AppRouter/>
                    </SaasShell>
                    <Footer/>
                </div>
            </ThemeProvider>
        </SaasProvider>
)
}

export default App
