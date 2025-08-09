import {classNames} from "shared/lib/classNames/classNames";
import cls from './Form.module.scss'
import type {PropsWithChildren} from "react";

interface FormProps extends PropsWithChildren{
    className?: string
}

function Form({className, children}: FormProps) {
    return (
        <div className={classNames(cls.Form, {}, [className])}>
            {children}
        </div>
    );
}

export default Form;
