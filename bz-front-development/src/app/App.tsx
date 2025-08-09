import './styles/index.scss'
import {AppRouter} from "app/providers/router";
import {Navbar} from "widgets/Navbar";
import {classNames} from "shared/lib/classNames/classNames";
import {Footer} from "widgets/Footer";


function App() {

    return (
        <div className={classNames('app', {}, [])}>
            <Navbar/>
            <AppRouter/>
            <Footer/>

        </div>
)
}

export default App
