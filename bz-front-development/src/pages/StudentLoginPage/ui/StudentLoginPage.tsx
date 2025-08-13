import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import http from "shared/api/http";
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SchoolIcon from '@mui/icons-material/School'

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const [cities, setCities] = useState<Array<{label:string, value:number}>>([]);
    const [groups, setGroups] = useState<Array<{label:string, value:number}>>([]);
    const [baseClasses, setBaseClasses] = useState<Array<{label:string, value:number}>>([])
    const [courses, setCourses] = useState<Array<{label:string, value:number}>>([])
    const [selectedCity, setSelectedCity] = useState<{label:string, value:number} | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<{label:string, value:number} | null>(null);
    const [selectedBaseClass, setSelectedBaseClass] = useState<{label:string, value:number} | null>(null)
    const [selectedCourse, setSelectedCourse] = useState<{label:string, value:number} | null>(null)
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

                // Fetch base classes (9/11)
                const baseResp = await http.get('/api/categories/base-classes')
                setBaseClasses((baseResp.data as number[]).map((n:number)=>({ value: n, label: String(n) })))

                // Fetch courses (1..4)
                const courseResp = await http.get('/api/categories/courses', { params: { max: 4 } })
                setCourses((courseResp.data as number[]).map((n:number)=>({ value: n, label: String(n) })))
                
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBack = () => navigate('/');

    const handleStudentLogin = () => {
        if (!selectedCity || !selectedGroup || !selectedBaseClass || !selectedCourse) {
            alert('Пожалуйста, выберите город, группу, базу (9/11) и курс');
            return;
        }
        
        // Store selection in localStorage for student session
        // selectedCity and selectedGroup are objects from react-select {value, label}
        const cityName = typeof selectedCity === 'object' && selectedCity?.label ? selectedCity.label : selectedCity;
        const groupName = typeof selectedGroup === 'object' && selectedGroup?.label ? selectedGroup.label : selectedGroup;
        
        localStorage.setItem('student_city', cityName);
        localStorage.setItem('student_city_id', String(selectedCity.value));
        localStorage.setItem('student_group', groupName);
        localStorage.setItem('student_group_id', String(selectedGroup.value));
        localStorage.setItem('student_base_class', String(selectedBaseClass.value))
        localStorage.setItem('student_course', String(selectedCourse.value))
        localStorage.setItem('user_role', 'student');
        
        // Navigate to student dashboard
        navigate('/student');
    };
    if (loading) return <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}><Typography>Загрузка...</Typography></Container>

    return (
      <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}>
        <Paper elevation={3} sx={{ p:3, width:'100%', borderRadius:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
            <SchoolIcon color="primary"/>
            <Typography variant="h6" fontWeight={700}>Выберите свою группу</Typography>
          </Box>
          <Autocomplete
            options={cities}
            value={selectedCity}
            onChange={(_, v)=>setSelectedCity(v)}
            disablePortal
            autoHighlight
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Город" placeholder="Выберите город"/>}
            sx={{ mb:2 }}
          />
          <Autocomplete
            options={groups}
            value={selectedGroup}
            onChange={(_, v)=>setSelectedGroup(v)}
            disablePortal
            autoHighlight
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Группа" placeholder="Выберите группу"/>}
          />
          <Autocomplete
            options={baseClasses}
            value={selectedBaseClass}
            onChange={(_, v)=>setSelectedBaseClass(v)}
            disablePortal
            autoHighlight
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="База (9 или 11)" placeholder="Выберите базу"/>}
            sx={{ mt:2 }}
          />
          <Autocomplete
            options={courses}
            value={selectedCourse}
            onChange={(_, v)=>setSelectedCourse(v)}
            disablePortal
            autoHighlight
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Курс" placeholder="Выберите курс"/>}
            sx={{ mt:2 }}
          />
          <Box sx={{ display:'flex', gap:1, mt:2 }}>
            <Button onClick={handleBack} startIcon={<ArrowBackIcon/>} variant="outlined" color="inherit">Назад</Button>
            <Button onClick={handleStudentLogin} variant="contained" sx={{ ml:'auto' }}>Войти</Button>
          </Box>
          <Alert sx={{ mt:2 }} severity="info">Данные студентов не сохраняются в базе. Вход осуществляется через выбор группы для просмотра материалов.</Alert>
        </Paper>
      </Container>
    );
}