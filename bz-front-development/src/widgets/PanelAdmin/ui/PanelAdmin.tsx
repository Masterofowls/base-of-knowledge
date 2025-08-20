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
import { saveAs } from 'file-saver'
import ButtonMui from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

interface PanelAdminProps {
    className?: string
}

function PanelAdmin({className}: PanelAdminProps) {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ posts:number; published:number; groups:number }>({ posts:0, published:0, groups:0 })
    const [exportPosts, setExportPosts] = useState(true)
    const [exportGroups, setExportGroups] = useState(false)

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

    async function exportData() {
        try {
            if (!exportPosts && !exportGroups) return
            if (exportPosts) {
                // Pull all posts paginated and export as JSON
                let page = 1
                const all:any[] = []
                while (true) {
                    const res = await http.get('/api/articles', { params: { page, per_page: 100, is_published: undefined } })
                    const list = res.data?.articles || []
                    all.push(...list)
                    if (!res.data?.pagination?.has_next) break
                    page += 1
                }
                const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json;charset=utf-8' })
                saveAs(blob, `posts-export-${new Date().toISOString().slice(0,10)}.json`)
            }
            if (exportGroups) {
                // Use backend CSV endpoint if available; fallback to JSON
                try {
                    const res = await http.get('/api/categories/groups/export', { responseType: 'blob' })
                    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
                    saveAs(blob, `groups-export-${new Date().toISOString().slice(0,10)}.csv`)
                } catch {
                    const res = await http.get('/api/categories/groups')
                    const groups = res.data || []
                    const blob = new Blob([JSON.stringify(groups, null, 2)], { type: 'application/json;charset=utf-8' })
                    saveAs(blob, `groups-export-${new Date().toISOString().slice(0,10)}.json`)
                }
            }
        } catch (e) {
            console.error('Export failed', e)
        }
    }

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
            <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border-muted, rgba(0,0,0,0.08))', borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Экспорт данных</h3>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
                <FormControlLabel control={<Checkbox checked={exportPosts} onChange={(_,v)=>setExportPosts(v)} />} label="Посты" />
                <FormControlLabel control={<Checkbox checked={exportGroups} onChange={(_,v)=>setExportGroups(v)} />} label="Группы" />
                <ButtonMui variant='contained' onClick={exportData}>Экспорт</ButtonMui>
              </Stack>
            </div>
        </div>
    );
}

export default PanelAdmin;
