import {classNames} from "shared/lib/classNames/classNames.ts";
import PostsList from "pages/PostsList/ui/PostsList";
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<{
        city: string;
        group: string;
        baseClass?: string;
        course?: string;
    } | null>(null);
    // Removed modal: inline improved posts view handles expansion

    useEffect(() => {
        // Check if user is logged in as student
        const userRole = localStorage.getItem('user_role');
        const studentCity = localStorage.getItem('student_city');
        const studentGroup = localStorage.getItem('student_group');
        const baseClass = localStorage.getItem('student_base_class');
        const course = localStorage.getItem('student_course');

        if (userRole !== 'student' || !studentCity || !studentGroup || !baseClass || !course) {
            // Redirect to choice page if not properly logged in as student
            navigate('/');
            return;
        }

        setStudentInfo({
            city: studentCity,
            group: studentGroup,
            baseClass: baseClass,
            course: course
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
            {/* Header */}
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                padding: '16px',
                background: 'var(--bg-card, #f8f9fa)',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid var(--border-muted, rgba(0,0,0,0.06))'
            }}>
                <h1 style={{margin: 0, fontSize: '22px', fontWeight: 800}}>
                    Лента студента
                </h1>
                <div style={{marginTop: 6, fontSize: '14px', opacity: .8}}>
                    <span style={{marginRight: 12}}><strong>Город:</strong> {studentInfo.city}</span>
                    <span><strong>Группа:</strong> {studentInfo.group}</span>
                    <span style={{marginLeft: 12}}><strong>База:</strong> {studentInfo.baseClass}</span>
                    <span style={{marginLeft: 12}}><strong>Курс:</strong> {studentInfo.course}</span>
                </div>
            </div>

            {/* Feed only, full available width */}
            <div style={{display:'flex', justifyContent:'center', width:'100%'}}>
                <div style={{flex: 1, maxWidth: 900}}>
                    <PostsList fullscreen />
                </div>
            </div>
        </main>
    );
}
