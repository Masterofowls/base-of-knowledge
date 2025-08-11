import {classNames} from "shared/lib/classNames/classNames.ts";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";
import PostsList from "pages/PostsList/ui/PostsList";
import { Button } from "shared/ui/Button";
import { ThemeButton } from "shared/ui/Button/ui/Button";
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<{
        city: string;
        group: string;
    } | null>(null);
    const [showAllPosts, setShowAllPosts] = useState(false)

    useEffect(() => {
        // Check if user is logged in as student
        const userRole = localStorage.getItem('user_role');
        const studentCity = localStorage.getItem('student_city');
        const studentGroup = localStorage.getItem('student_group');

        if (userRole !== 'student' || !studentCity || !studentGroup) {
            // Redirect to choice page if not properly logged in as student
            navigate('/');
            return;
        }

        setStudentInfo({
            city: studentCity,
            group: studentGroup
        });
    }, [navigate]);

    if (!studentInfo) {
        return (
            <main style={{display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
                <div style={{padding: '20px', textAlign: 'center'}}>
                    <p>Загрузка...</p>
                </div>
            </main>
        );
    }

    return (
        <main style={{display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
            {/* Student Header */}
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h1 style={{margin: 0, fontSize: '24px', fontWeight: '700', color: '#333'}}>
                    Дашборд студента
                </h1>
                <div style={{marginTop: '10px', fontSize: '16px', color: '#666'}}>
                    <p style={{margin: '5px 0'}}>
                        <strong>Город:</strong> {studentInfo.city}
                    </p>
                    <p style={{margin: '5px 0'}}>
                        <strong>Группа:</strong> {studentInfo.group}
                    </p>
                </div>
                
                {/* Logout button */}
                <button 
                    onClick={() => {
                        localStorage.removeItem('user_role');
                        localStorage.removeItem('student_city');
                        localStorage.removeItem('student_group');
                        navigate('/');
                    }}
                    style={{
                        alignSelf: 'flex-end',
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Выйти
                </button>
            </div>

            {/* Content - Feed on dashboard */}
            <div style={{display: 'flex', flexDirection: 'row', gap: '45px', flexWrap:'wrap'}}>
                <div style={{flex: '1 1 600px', minWidth: 320}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <h2 style={{margin:0}}>Лента</h2>
                        <Button onClick={()=> setShowAllPosts(true)} theme={ThemeButton.ARROW} width='160px' backgroundColor='#00AAFF'><span>Все посты</span></Button>
                    </div>
                    <PostsList expandAllDefault />
                </div>
                <div style={{flex: '1 1 320px', minWidth: 280}}>
                    <div style={{marginTop:16}}><Groups/></div>
                </div>
            </div>
            {showAllPosts && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'stretch', justifyContent:'center'}}>
                    <div className={classNames('container', {}, [])} style={{background:'var(--surface-1)', flex:'1 1 auto', maxWidth:1200, overflow:'auto', padding:'16px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                            <h2 style={{margin:0}}>Все посты</h2>
                            <Button onClick={()=> setShowAllPosts(false)} theme={ThemeButton.CLEAR} width='120px' backgroundColor='#7F61DD'><span>Закрыть</span></Button>
                        </div>
                        <PostsList />
                    </div>
                </div>
            )}
        </main>
    );
}
