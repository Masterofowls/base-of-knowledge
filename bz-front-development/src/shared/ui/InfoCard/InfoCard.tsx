import {classNames} from "shared/lib/classNames/classNames";
import cls from './InfoCard.module.scss'
import type {FC, PropsWithChildren} from "react";

export const InfoCardTheme = {
    PRIMARY: 'primary',
} as const;

type InfoCardThemeValue = typeof InfoCardTheme[keyof typeof InfoCardTheme];

interface InfoCardProps extends PropsWithChildren {
    className?: string;
    theme?: InfoCardThemeValue;
    color: string
}

export const InfoCard : FC<InfoCardProps> = ({className, color, children, theme = InfoCardTheme.PRIMARY, ...otherProps}) => {
    return (
        <div {...otherProps} style={{backgroundColor: color}} className={classNames(cls.InfoCard, {}, [className, cls[theme]])}>
            {children}
        </div>
    );
}