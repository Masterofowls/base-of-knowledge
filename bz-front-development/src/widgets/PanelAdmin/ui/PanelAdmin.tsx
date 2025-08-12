import {classNames} from "shared/lib/classNames/classNames.ts";
import cls from './PanelAdmin.module.scss'
import SpeedmetrIcon from "shared/assets/icons/Speedmetr.svg?react";
import DocumentIcon from "shared/assets/icons/Document.svg?react";
import StudentsIcon from "shared/assets/icons/users-solid.svg?react";
import CircleIcon from "shared/assets/icons/circle-check-solid.svg?react";
import StudentIcon from "shared/assets/icons/Student.svg?react"
import {InfoCard} from "shared/ui/InfoCard/InfoCard.tsx";
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import {useEffect, useState} from 'react'
import {useNavigate} from "react-router-dom";
import http from 'shared/api/http'

interface PanelAdminProps {
    className?: string
}

function PanelAdmin({className}: PanelAdminProps) {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ posts:number; published:number; groups:number }>({ posts:0, published:0, groups:0 })

    useEffect(()=>{
        Promise.all([
            http.get('/api/articles', { params: { per_page: 1, page: 1 } }),
            http.get('/api/articles', { params: { is_published: true, per_page: 1, page: 1 } }),
            http.get('/api/categories/groups')
        ]).then(([all, pub, groups]) => {
            const total = all.data?.pagination?.total ?? 0
            const totalPub = pub.data?.pagination?.total ?? 0
            const groupsCount = Array.isArray(groups.data) ? groups.data.length : 0
            setStats({ posts: total, published: totalPub, groups: groupsCount })
        }).catch(()=>{})
    },[])

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        navigate('/');
    };

    return (
        <div className={classNames(cls.PanelAdmin, {}, [className])}>
            <div className={cls.Heading}>
                <div className={cls.HeadingWrapper}>
                    <SpeedmetrIcon className={cls.icon} width='40px' height='40px' />
                    <h1>Панель администратора</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        <p>Добро пожаловать, <b>admin</b>!</p>
                        <p>Роль: Администратор</p>
                    </div>
                    <Button 
                        onClick={handleLogout}
                        width='120px' 
                        backgroundColor='rgba(228, 74, 119, 1)' 
                        theme={ThemeButton.CLEAR}
                    >
                        <span>Выйти</span>
                    </Button>
                </div>
            </div>
            <div className={cls.InfoCards}>
                <InfoCard className={cls.InfoCardWrap} color='rgba(127, 97, 221, 1)'>
                    <div>
                        <p>{stats.posts}</p>
                        <p>Всего постов</p>
                    </div>
                    <DocumentIcon width='25px' height='33px' />
                </InfoCard>
                <InfoCard className={cls.InfoCardWrap} color='rgba(146, 218, 99, 1)'>
                    <div>
                        <p>{stats.groups}</p>
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
                        <p>{stats.published}</p>
                        <p>Опубликовано</p>
                    </div>
                    <CircleIcon width='32px' height='32px' />
                </InfoCard>
            </div>
        </div>
    );
}

export default PanelAdmin;
