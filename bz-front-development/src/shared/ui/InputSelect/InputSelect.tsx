import cls from './InputSelect.module.scss'
import type {FC, JSX} from "react";
import Select from 'react-select'
import {classNames} from "shared/lib/classNames/classNames.ts";

export const InputSelectTheme = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

type InputSelectThemeValue = typeof InputSelectTheme[keyof typeof InputSelectTheme];

interface InputSelectProps {
    className?: string;
    theme?: InputSelectThemeValue;
    options: ({ value: string; label: string })[];
    label?: JSX.Element;
    placeholder: string;
    onChange?: (selectedOption: any) => void;
    value?: any;
}

export const InputSelect : FC<InputSelectProps> = ({className, placeholder, label, options, theme = InputSelectTheme.PRIMARY, onChange, value, ...otherProps}) => {
    return (
        <div className={classNames(cls.InputDiv, {}, [className, cls[theme]])}>
            {label && <label htmlFor="bread">{label}</label>}
            <Select 
                className={cls.Select} 
                placeholder={placeholder}
                classNamePrefix="select" 
                options={options} 
                onChange={onChange}
                value={value}
                {...otherProps}
                    styles={{
                        control: (baseStyles) => ({
                            ...baseStyles,
                            textAlign: 'left',
                            borderRadius: "2px",
                            paddingLeft: '8px'
                        }),
                        indicatorSeparator: (provided) => ({
                            ...provided,
                            display: 'none',
                        }),
                        dropdownIndicator: (provided) => ({
                            ...provided,
                            color: 'rgba(0,170,255,1)'
                        }),
                    }}
            />
        </div>
);
}
