import {classNames} from "shared/lib/classNames/classNames";
import cls from './Button.module.scss'
import type {ButtonHTMLAttributes, FC} from "react";
import ArrowIcon from "shared/assets/icons/arrowButton.svg?react";

export const ThemeButton = {
    CLEAR: "clear",
    ARROW: 'arrow',
} as const;

type ThemeButtonValue = typeof ThemeButton[keyof typeof ThemeButton];

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>{
    className?: string;
    theme?: ThemeButtonValue
    width?: string;
    backgroundColor?: string;
}

export const Button: FC<ButtonProps> = ({className, width, children, backgroundColor, theme = ThemeButton.CLEAR, ...otherProps}) => {
    return (
        <button {...otherProps} style={{backgroundColor: backgroundColor, width: width}} className={classNames(cls.Button, {}, [className, cls[theme]])}>
            <span className={cls.childrenWrapper}>
                {children}
            </span>
            {theme === ThemeButton.ARROW && <ArrowIcon style={{color: backgroundColor}} className={cls.arrowIcon} width='30px' height='30px' />}
        </button>
    );
}