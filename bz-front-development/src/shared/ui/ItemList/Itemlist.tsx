import {classNames} from "shared/lib/classNames/classNames";
import cls from './Itemlist.module.scss'
import type {FC, PropsWithChildren} from "react";

export const ItemlistTheme = {
    PRIMARY: 'primary',
} as const;

type ItemlistThemeValue = typeof ItemlistTheme[keyof typeof ItemlistTheme];

interface ItemlistProps extends PropsWithChildren {
    className?: string;
    theme?: ItemlistThemeValue;
    name: string;
    description: string;
    count: string
}

export const Itemlist : FC<ItemlistProps> = ({className, name, description, count, theme = ItemlistTheme.PRIMARY, ...otherProps}) => {
    return (
        <div {...otherProps} className={classNames(cls.Itemlist, {}, [className, cls[theme]])}>
            <div>
                <p className={cls.name}>{name}</p>
                <p className={cls.description}>{description}</p>
            </div>
            <p className={cls.count}>{count}</p>
        </div>
    );
}