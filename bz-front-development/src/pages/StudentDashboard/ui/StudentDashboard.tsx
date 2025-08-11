import {classNames} from "shared/lib/classNames/classNames.ts";
import {LatestPosts} from "widgets/LatestPosts";
import {Groups} from "widgets/Groups";
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<{
        city: string;
        group: string;
    } | null>(null);

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
            <div style={{maxWidth: '1230px', display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
                <div style={{padding: '20px', textAlign: 'center'}}>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{maxWidth: '1230px', display: 'flex', flexDirection: 'column'}} className={classNames('container', {}, [])}>
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

            {/* Content - Latest Posts and Groups */}
            <div style={{display: 'flex', flexDirection: 'row', gap: '45px', flexWrap:'wrap'}}>
                <div style={{flex: '1 1 420px', minWidth: 320}}>
                    <LatestPosts/>
                </div>
                <div style={{flex: '1 1 420px', minWidth: 320}}>
                    <Groups/>
                </div>
            </div>
        </div>
    );
}
