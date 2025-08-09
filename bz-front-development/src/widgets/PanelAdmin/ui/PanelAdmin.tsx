import {classNames} from "shared/lib/classNames/classNames.ts";
import cls from './PanelAdmin.module.scss'
import SpeedmetrIcon from "shared/assets/icons/Speedmetr.svg?react";
import DocumentIcon from "shared/assets/icons/Document.svg?react";
import StudentsIcon from "shared/assets/icons/users-solid.svg?react";
import CircleIcon from "shared/assets/icons/circle-check-solid.svg?react";
import StudentIcon from "shared/assets/icons/Student.svg?react"
import {InfoCard} from "shared/ui/InfoCard/InfoCard.tsx";

interface PanelAdminProps {
    className?: string
}

function PanelAdmin({className}: PanelAdminProps) {
    return (
        <div className={classNames(cls.PanelAdmin, {}, [className])}>
            <div className={cls.Heading}>
                <div className={cls.HeadingWrapper}>
                    <SpeedmetrIcon className={cls.icon} width='40px' height='40px' />
                    <h1>Панель администратора</h1>
                </div>
                <div>
                    <p>Добро пожаловать, <b>admin</b>!</p>
                    <p>Роль: Администратор</p>
                </div>
            </div>
            <div className={cls.InfoCards}>
                <InfoCard className={cls.InfoCardWrap} color='rgba(127, 97, 221, 1)'>
                    <div>
                        <p>0</p>
                        <p>Всего постов</p>
                    </div>
                    <DocumentIcon width='25px' height='33px' />
                </InfoCard>
                <InfoCard className={cls.InfoCardWrap} color='rgba(146, 218, 99, 1)'>
                    <div>
                        <p>154</p>
                        <p>Групп</p>
                    </div>
                    <StudentsIcon width='32px' height='26px' />
                </InfoCard>
                <InfoCard className={cls.InfoCardWrap} color='rgba(228, 74, 119, 1)'>
                    <div>
                        <p>0</p>
                        <p>Студентов</p>
                    </div>
                    <StudentIcon width='25px' height='28px' />
                </InfoCard>
                <InfoCard className={cls.InfoCardWrap} color='rgba(0, 170, 255, 1)'>
                    <div>
                        <p>0</p>
                        <p>Опубликовано</p>
                    </div>
                    <CircleIcon width='32px' height='32px' />
                </InfoCard>
            </div>
        </div>
    );
}

export default PanelAdmin;
