import {classNames} from "shared/lib/classNames/classNames";
import cls from './Input.module.scss'
import type {FC, JSX} from "react";

export const InputTheme = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

type InputThemeValue = typeof InputTheme[keyof typeof InputTheme];

interface InputProps {
    className?: string;
    theme?: InputThemeValue;
    label?: JSX.Element;
    placeholder?: string
}

export const Input : FC<InputProps> = ({className, label, placeholder, theme = InputTheme.PRIMARY, ...otherProps}) => {
    return (

        <div {...otherProps} className={classNames(cls.InputDiv, {}, [className, cls[theme]])}>
            {label && <label htmlFor="bread">{label}</label>}
            <input placeholder={placeholder} />
        </div>
    );
}