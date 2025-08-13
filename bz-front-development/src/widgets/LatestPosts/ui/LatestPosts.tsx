import {classNames} from "shared/lib/classNames/classNames";
import cls from './LatestPosts.module.scss'
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import DocumentIcon from "shared/assets/icons/Document.svg?react"
import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import http from 'shared/api/http'

interface LatestPostsProps {
    className?: string
}

interface ArticleItem { id: number; title: string }

function LatestPosts({className}: LatestPostsProps) {
    const navigate = useNavigate()
    const [items, setItems] = useState<ArticleItem[]>([])

    useEffect(() => {
        http.get('/api/articles', { params: { per_page: 5 } })
            .then((response) => {
                const list = (response.data?.articles ?? []).map((a: any) => ({ id: a.id, title: a.title }))
                setItems(list)
            })
            .catch((error) => {
                console.error('Failed to fetch articles:', error);
                setItems([]);
            })
    }, [])

    return (
        // поставить тут контейнер
        <div className={classNames(cls.LatestPosts, {}, [className])}>
            <div className={cls.LatestPostsHeader}>
                <div className={cls.name}>
                    <DocumentIcon height="20px" width="15px" className={cls.icon}/>
                    <p>Последние посты</p>
                </div>
                {/* removed global posts route button */}
            </div>
            <div className={cls.LatestPostsWrap}>
                {items.length === 0 && <div style={{color:'#888', fontSize:12}}>Нет постов</div>}
                {items.map(item => (
                    <div key={item.id} style={{padding:'8px 0', borderBottom:'1px solid #eee', cursor:'pointer'}} onClick={() => navigate(`/admin/post/${item.id}`)}>
                        <div style={{fontSize:14}}>{item.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LatestPosts;
