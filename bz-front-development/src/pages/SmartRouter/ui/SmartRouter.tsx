import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {ChoiceRolePage} from 'pages/ChoiceRolePage';

export default function SmartRouter() {
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem('user_role');
        const jwtToken = localStorage.getItem('jwt_token');
        const studentCity = localStorage.getItem('student_city');
        const studentGroup = localStorage.getItem('student_group');

        if (userRole === 'admin' && jwtToken) {
            // Admin is logged in, redirect to admin dashboard
            navigate('/admin');
        } else if (userRole === 'student' && studentCity && studentGroup) {
            // Student is logged in, redirect to student dashboard
            navigate('/student');
        }
        // Otherwise stay on choice page (handled by rendering ChoiceRolePage)
    }, [navigate]);

    // Show choice page as default
    return <ChoiceRolePage />;
}
