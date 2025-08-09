import {classNames} from "shared/lib/classNames/classNames.ts";
import cls from './QuickActionsAdmin.module.scss'
import StudentsIcon from "shared/assets/icons/users-solid.svg?react";
import LightIcon from "shared/assets/icons/Ligting.svg?react";
import BurgerIcon from "shared/assets/icons/Burger.svg?react";
import PlusIcon from "shared/assets/icons/Plus.svg?react";
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";

interface QuickActionsAdminProps {
    className?: string
}

function QuickActionsAdmin({className}: QuickActionsAdminProps) {
    return (
        <div className={classNames(cls.QuickActionsAdmin, {}, [className])}>
            <div className={cls.gretting}>
                <LightIcon className={cls.icon} width='15px' height='20px' />
                <p>
                    Быстрые действия
                </p>
            </div>
            <div className={cls.buttons}>
                <Button className={cls.button} width="290px" theme={ThemeButton.ARROW} backgroundColor='#00AAFF'><span><PlusIcon width='13px' height='13px' /><p>Создать пост</p></span></Button>
                <Button className={cls.button} width="290px" theme={ThemeButton.ARROW} backgroundColor='#92DA63'><span><StudentsIcon width='15px' height='20px' /><p>Создать группу</p></span></Button>
                <Button className={cls.button} width="290px" theme={ThemeButton.ARROW} backgroundColor='#7F61DD'><span><BurgerIcon width='15px' height='20px' /><p>Управление группами</p></span></Button>
                <Button className={cls.button} width="290px" theme={ThemeButton.ARROW} backgroundColor='#E44A77'><span><BurgerIcon width='15px' height='20px' /><p>Управление категориями</p></span></Button>
            </div>
        </div>
    );
}

export default QuickActionsAdmin;
