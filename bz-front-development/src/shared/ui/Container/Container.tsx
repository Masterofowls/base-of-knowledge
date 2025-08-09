import {classNames} from "shared/lib/classNames/classNames";
import cls from './Container.module.scss'
import type {CSSProperties, FC, JSX, PropsWithChildren} from "react";

export const ContainerTheme = {
    PRIMARY: 'primary',
    CLEAR: 'clear'
} as const;

type ContainerThemeValue = typeof ContainerTheme[keyof typeof ContainerTheme];

interface ContainerProps extends PropsWithChildren {
    className?: string;
    theme?: ContainerThemeValue;
    width?: string;
    height?: string,
    paddings?: string;
    footer?: JSX.Element;
    lastMargin?: string,
    firstMargin?: string,
    gap?: string
    direction?: 'row' | 'column'
    footerContentHeight?: string;
}

export const Container : FC<ContainerProps> = ({className, children, footerContentHeight = '30px', width, height, paddings, firstMargin, lastMargin, footer, gap, direction = "column", theme = ContainerTheme.PRIMARY, ...otherProps}) => {
    const effectiveFooterSpace = footer ? `calc(${footerContentHeight} + 12px)` : '20px';
    return (
        <div {...otherProps} style={{padding: paddings, width: width, height: height, paddingBottom: effectiveFooterSpace}} className={classNames(cls.Container, {}, [className, cls[theme]])}>
            <div className={cls.wrap} style={{ '--first-child-margin-bottom': firstMargin, '--last-child-margin-bottom': lastMargin, gap: gap, flexDirection: direction } as CSSProperties}>
                {children}
            </div>
            {footer && (
                <div className={cls.footer}>
                    {footer}
                </div>
            )}
        </div>
    );
}