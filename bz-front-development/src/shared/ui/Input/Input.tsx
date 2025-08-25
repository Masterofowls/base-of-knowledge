import { classNames } from "shared/lib/classNames/classNames";
import cls from './Input.module.scss'
import type { FC, JSX, InputHTMLAttributes } from "react";

export const InputTheme = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
} as const;

type InputThemeValue = typeof InputTheme[keyof typeof InputTheme];

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  className?: string;
  theme?: InputThemeValue;
  label?: JSX.Element;
  onChange?: (value: string) => void;
}

export const Input: FC<InputProps> = ({
  className,
  label,
  placeholder,
  theme = InputTheme.PRIMARY,
  value,
  onChange,
  type = 'text',
  ...rest
}) => {
  return (
    <div className={classNames(cls.InputDiv, {}, [className, cls[theme]])}>
      {label && <label>{label}</label>}
      <input
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      />
    </div>
  );
}
