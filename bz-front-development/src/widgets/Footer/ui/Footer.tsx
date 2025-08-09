import {classNames} from "shared/lib/classNames/classNames";
import cls from './Footer.module.scss'

interface FooterProps {
    className?: string
}

function Footer({className}: FooterProps) {
    return (
        <div className={classNames(cls.Footer, {}, [className])}>
            <div className={cls.left}>
                Студенческий Портал Хекслет <br />
                Система управления студенческими группами и постами
            </div>
            <div className={cls.right}>© 2024 Студенческий Портал Хекслет. Все права защищены.</div>
        </div>
    );
}

export default Footer;
