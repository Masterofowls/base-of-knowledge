import {classNames} from "shared/lib/classNames/classNames.ts";
import PostsList from "pages/PostsList/ui/PostsList";
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<{ group: string } | null>(null);
    // Removed modal: inline improved posts view handles expansion

    useEffect(() => {
        // Check if user is logged in as student
        const userRole = localStorage.getItem('user_role');
        if (userRole !== 'student') {
            // Redirect to choice page if not properly logged in as student
            navigate('/');
            return;
        }

        setStudentInfo({
            group: 'Студент'
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
            {/* Feed only, full available width */}
            <div style={{display:'flex', justifyContent:'center', width:'100%'}}>
                <div style={{flex: 1, maxWidth: 900}}>
                    <PostsList fullscreen notionMode />
                </div>
            </div>
        </main>
    );
}
