import {classNames} from "shared/lib/classNames/classNames.ts";
import PostsList from "pages/PostsList/ui/PostsList";
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [studentInfo, setStudentInfo] = useState<{
        city?: string;
        group: string;
        course?: string;
    } | null>(null);
    // Removed modal: inline improved posts view handles expansion

    useEffect(() => {
        // Check if user is logged in as student
        const userRole = localStorage.getItem('user_role');
        const studentCity = localStorage.getItem('student_city');
        const studentGroup = localStorage.getItem('student_group');
        const course = localStorage.getItem('student_course');

        if (userRole !== 'student' || !studentGroup) {
            // Redirect to choice page if not properly logged in as student
            navigate('/');
            return;
        }

        setStudentInfo({
            city: studentCity || undefined,
            group: studentGroup,
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
            {/* Header removed; PostsList now renders the student context header */}

            {/* Feed only, full available width */}
            <div style={{display:'flex', justifyContent:'center', width:'100%'}}>
                <div style={{flex: 1, maxWidth: 900}}>
                    <PostsList fullscreen notionMode />
                </div>
            </div>
        </main>
    );
}
