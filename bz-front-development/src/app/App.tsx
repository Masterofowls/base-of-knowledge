import './styles/index.scss'
import {AppRouter} from "app/providers/router";
import {Navbar} from "widgets/Navbar";
import {classNames} from "shared/lib/classNames/classNames";
import {Footer} from "widgets/Footer";
import {useEffect} from 'react'


function App() {
    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        const theme = stored ?? (prefersDark ? 'dark' : 'light')
        document.documentElement.setAttribute('data-theme', theme)
    }, [])

    return (
        <div className={classNames('app', {}, [])}>
            <Navbar/>
            <AppRouter/>
            <Footer/>

        </div>
)
}

export default App
