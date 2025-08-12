import {classNames} from "shared/lib/classNames/classNames";
import cls from './Groups.module.scss'
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import {Itemlist} from "shared/ui/ItemList/Itemlist.tsx";
import {useEffect, useState} from 'react'
import http from 'shared/api/http'

interface GroupsProps {
    className?: string
}

interface GroupItem { id: number; display_name: string; city?: { name: string } }

function Groups({className}: GroupsProps) {
    const [groups, setGroups] = useState<GroupItem[]>([])

    useEffect(() => {
        http.get('/api/categories/groups')
            .then((response) => {
                const data = response.data;
                setGroups(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                console.error('Failed to fetch groups:', error);
                setGroups([]);
            })
    }, [])

    return (
        <div className={classNames(cls.Groups, {}, [className])}>
                <div className={cls.GroupsHeader}>
                    <div className={cls.name}>
                        <p>Группы</p>
                    </div>
                </div>
                <div className={cls.GroupsWrap}>
                   {groups.length === 0 && <div style={{color:'#888', fontSize:12}}>Нет групп</div>}
                   {groups.slice(0, 6).map(g => (
                       <Itemlist key={g.id} name={g.display_name} description={g.city?.name ? `(${g.city.name})` : ''} count='' />
                   ))}
                </div>
        </div>
    );
}

export default Groups;
