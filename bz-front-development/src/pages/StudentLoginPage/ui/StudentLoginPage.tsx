import {classNames} from "shared/lib/classNames/classNames.ts";
import {Container} from "shared/ui/Container/Container.tsx";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import {Button} from "shared/ui/Button";
import {InputSelect} from "shared/ui/InputSelect/InputSelect.tsx";
import {Alert} from "shared/ui/Alert/Alert.tsx";
import StudentIcon from "shared/assets/icons/UserFace.svg?react"
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react"
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import http from "shared/api/http";

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch cities
                const citiesResponse = await http.get('/api/categories/cities');
                const citiesOptions = citiesResponse.data.map((city: any) => ({
                    value: city.id,
                    label: city.name
                }));
                setCities(citiesOptions);

                // Fetch groups
                const groupsResponse = await http.get('/api/categories/groups');
                const groupsOptions = groupsResponse.data.map((group: any) => ({
                    value: group.id,
                    label: group.display_name
                }));
                setGroups(groupsOptions);
                
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBack = () => {
        navigate('/');
    };

    const handleStudentLogin = () => {
        if (!selectedCity || !selectedGroup) {
            alert('Пожалуйста, выберите город и группу');
            return;
        }
        
        // Store selection in localStorage for student session
        // selectedCity and selectedGroup are objects from react-select {value, label}
        const cityName = typeof selectedCity === 'object' && selectedCity?.label ? selectedCity.label : selectedCity;
        const groupName = typeof selectedGroup === 'object' && selectedGroup?.label ? selectedGroup.label : selectedGroup;
        
        localStorage.setItem('student_city', cityName);
        localStorage.setItem('student_group', groupName);
        localStorage.setItem('user_role', 'student');
        
        // Navigate to student dashboard
        navigate('/student');
    };
    if (loading) {
        return (
            <div className={classNames('page-center-wrapper', {}, [])}>
            <Container gap="16px" width='min(100%, 420px)' direction="column" paddings='20px'>
                    <p>Загрузка...</p>
                </Container>
            </div>
        );
    }

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container gap="16px" width='min(100%, 420px)' direction="column" paddings='20px' footerContentHeight='80px' footer={<span onClick={handleBack} style={{cursor: 'pointer'}}><ArrowIcon width='10px' height='8px'/><p>Назад к выбору входа</p></span>}>
                <div style={{display: 'flex',flexDirection: 'row', gap: '10px', marginBottom: '5px', fontSize: '20px', fontWeight: '700'}}>
                    <StudentIcon width='22px' height='22px'/>
                    <p>Выберите свою группу</p>
                </div>
                <InputSelect 
                    placeholder='Выберите город' 
                    label={<p>Город</p>} 
                    options={cities}
                    value={selectedCity}
                    onChange={(option: any) => setSelectedCity(option)} 
                />
                <InputSelect 
                    placeholder='Выберите группу' 
                    label={<p>Группа</p>} 
                    options={groups}
                    value={selectedGroup}
                    onChange={(option: any) => setSelectedGroup(option)}
                />
                <Button 
                    width='100%'
                    backgroundColor='rgba(0, 170, 255, 1)' 
                    theme={ThemeButton.ARROW}
                    onClick={handleStudentLogin}
                >
                    <span>Войти как студент</span>
                </Button>
                <Alert>Примечание: Данные студентов не сохраняются в базе данных. Вход осуществляется только через выбор группы для просмотра материалов.</Alert>
            </Container>
        </div>
    );
}