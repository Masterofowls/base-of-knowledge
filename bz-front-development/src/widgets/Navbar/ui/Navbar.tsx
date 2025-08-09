import {classNames} from "shared/lib/classNames/classNames";
import cls from './Navbar.module.scss'
import {AppLink, AppLinkTheme} from "shared/ui/AppLink/AppLink";
import LogoIcon from "shared/assets/icons/Logo.svg?react";
import ArrowDownIcon from "shared/assets/icons/ArrowDown.svg?react";
import PenIcon from "shared/assets/icons/Pen.svg?react";
import UserIcon from "shared/assets/icons/User.svg?react";
import SpeedmetrIcon from "shared/assets/icons/Speedmetr.svg?react";

interface NavbarProps {
    className?: string
}

function Navbar({className}: NavbarProps) {
    return (
        <div className={classNames(cls.Navbar, {}, [className])}>
            <div className={classNames(cls.logo, {}, [className])}>
                <LogoIcon width='30px' height='30px' />
                <p>Студенческий Портал Хекслет</p>
            </div>
            <div className={cls.links}>
                <AppLink theme={AppLinkTheme.SECONDARY} className={cls.mainLink} to={'/'}><SpeedmetrIcon width='10px' height='10px' /> Главная</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/editor'}><PenIcon width='10px' height='10px' /> Редактор</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/choicerole'}><SpeedmetrIcon width='10px' height='10px' /> Страница входа</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/adminlogin'}><PenIcon width='10px' height='10px' /> АдминЛог</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/adminregistration'}><SpeedmetrIcon width='10px' height='10px' /> АдминРег</AppLink>
                <AppLink theme={AppLinkTheme.SECONDARY} to={'/studentlogin'}><PenIcon width='10px' height='10px' /> СтудЛог</AppLink>
            </div>
            <div className={cls.user}>
                <UserIcon width='10px' height='10px' />
                <p>admin</p>
                <ArrowDownIcon width='10px' height='10px' />
            </div>
        </div>
    );
}

export default Navbar;
