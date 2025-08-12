import {classNames} from "shared/lib/classNames/classNames";
import cls from './Navbar.module.scss'
import {AppLink, AppLinkTheme} from "shared/ui/AppLink/AppLink";
import LogoIcon from "shared/assets/icons/Logo.svg?react";
import ArrowDownIcon from "shared/assets/icons/ArrowDown.svg?react";
import BurgerIcon from "shared/assets/icons/Burger.svg?react";
import {useState} from 'react'
import PenIcon from "shared/assets/icons/Pen.svg?react";
import UserIcon from "shared/assets/icons/User.svg?react";
import SpeedmetrIcon from "shared/assets/icons/Speedmetr.svg?react";

interface NavbarProps {
    className?: string
}

function Navbar({className}: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className={classNames(cls.Navbar, {}, [className])}>
            <div className='container' style={{display:'flex', alignItems:'center', width:'100%'}}>
            <div className={classNames(cls.logo, {}, [className])}>
                <LogoIcon width='30px' height='30px' />
                <p>Студенческий Портал Хекслет</p>
            </div>
            <div className={cls.links}>
                <AppLink theme={AppLinkTheme.SECONDARY} className={cls.mainLink} to={'/'}><SpeedmetrIcon width='10px' height='10px' /> Главная</AppLink>
                {/* editor page link removed from nav per request */}
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/posts'}><SpeedmetrIcon width='10px' height='10px' /> Посты</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/choicerole'}><SpeedmetrIcon width='10px' height='10px' /> Страница входа</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/adminlogin'}><PenIcon width='10px' height='10px' /> АдминЛог</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/adminregistration'}><SpeedmetrIcon width='10px' height='10px' /> АдминРег</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/studentlogin'}><PenIcon width='10px' height='10px' /> СтудЛог</AppLink>
            </div>
            <div className={cls.burger} onClick={() => setIsOpen(v => !v)}>
                <BurgerIcon width='16px' height='12px' />
            </div>
            <div className={classNames(cls.mobileMenu, { [cls.open]: isOpen }, [])}>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} className={cls.mainLink} to={'/'}>Главная</AppLink>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/posts'}>Посты</AppLink>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/choicerole'}>Страница входа</AppLink>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/adminlogin'}>АдминЛог</AppLink>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/adminregistration'}>АдминРег</AppLink>
                <AppLink onClick={()=>setIsOpen(false)} theme={AppLinkTheme.SECONDARY} to={'/studentlogin'}>СтудЛог</AppLink>
            </div>
            <div className={cls.user}>
                <button onClick={() => history.back()} style={{background:'transparent', border:'none', cursor:'pointer', color:'inherit'}}>Назад</button>
                <button
                    onClick={() => {
                        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
                        document.documentElement.setAttribute('data-theme', current)
                        localStorage.setItem('theme', current)
                        window.dispatchEvent(new CustomEvent('theme-change', { detail: current }))
                    }}
                    style={{background:'transparent', border:'1px solid rgba(255,255,255,0.4)', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'inherit'}}
                >Тема</button>
                <UserIcon width='10px' height='10px' />
                <p>admin</p>
                <ArrowDownIcon width='10px' height='10px' />
            </div>
            </div>
        </div>
    );
}

export default Navbar;
