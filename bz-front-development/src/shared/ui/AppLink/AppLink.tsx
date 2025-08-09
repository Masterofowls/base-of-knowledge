import {classNames} from "shared/lib/classNames/classNames";
import cls from './AppLink.module.scss'
import {Link} from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import type {FC} from "react";

export const AppLinkTheme = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

type AppLinkThemeValue = typeof AppLinkTheme[keyof typeof AppLinkTheme];

interface AppLinkProps extends LinkProps {
    className?: string;
    theme?: AppLinkThemeValue;
}

export const AppLink : FC<AppLinkProps> = ({className, children, to, theme = AppLinkTheme.PRIMARY, ...otherProps}) => {
    return (
        <Link {...otherProps} to={to} className={classNames(cls.AppLink, {}, [className, cls[theme]])}>
            {children}
        </Link>
    );
}