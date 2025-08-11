import {PanelAdmin} from "widgets/PanelAdmin";
import {classNames} from "shared/lib/classNames/classNames.ts";
import {QuickActionsAdmin} from "widgets/QuickActionsAdmin";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";
import { Card, CardContent, Tabs, Tab, Divider, Alert, Tooltip, Chip, Avatar, Badge } from '@mui/material'

export default function  MainPage() {
    return (
        <div style={{maxWidth: '1230px', display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
            <PanelAdmin/>
            <QuickActionsAdmin/>
            <div style={{display: 'flex', flexDirection: 'row', margin: "45px 0px", gap: '45px', flexWrap:'wrap'}}>
                <div style={{flex: '1 1 420px', minWidth: 320}}>
                    <Card>
                        <CardContent>
                            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                                <Badge color="secondary" badgeContent={4}>
                                    <Avatar>SP</Avatar>
                                </Badge>
                                <Chip label="Новости" color="primary"/>
                            </div>
                            <LatestPosts/>
                            <Divider style={{margin:'12px 0'}}/>
                            <Alert severity="info">Здесь публикуются последние посты</Alert>
                        </CardContent>
                    </Card>
                </div>
                <div style={{flex: '1 1 420px', minWidth: 320}}>
                    <Card>
                        <CardContent>
                            <Tooltip title="Группы студентов" placement="top-start">
                                <div><Groups/></div>
                            </Tooltip>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}