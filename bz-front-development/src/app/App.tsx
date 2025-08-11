import './styles/index.scss'
import {AppRouter} from "app/providers/router";
import {Navbar} from "widgets/Navbar";
import {classNames} from "shared/lib/classNames/classNames";
import {Footer} from "widgets/Footer";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import {useEffect} from 'react'


function App() {
    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        const theme = stored ?? (prefersDark ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', theme)
    }, [])
    const mode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const theme = createTheme({ palette: { mode } })

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classNames('app', {}, [])}>
                <Navbar/>
                <AppRouter/>
                <Footer/>
            </div>
        </ThemeProvider>
)
}

export default App
