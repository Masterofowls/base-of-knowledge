import {classNames} from "shared/lib/classNames/classNames";
import cls from './Alert.module.scss'
import type {FC, PropsWithChildren} from "react";

export const AlertTheme = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

type AlertThemeValue = typeof AlertTheme[keyof typeof AlertTheme];

interface AlertProps extends PropsWithChildren {
    className?: string;
    theme?: AlertThemeValue;
}

export const Alert : FC<AlertProps> = ({className, children, theme = AlertTheme.PRIMARY, ...otherProps}) => {
    return (
        <div {...otherProps} className={classNames(cls.Alert, {}, [className, cls[theme]])}>
            {children}
        </div>
    );
}