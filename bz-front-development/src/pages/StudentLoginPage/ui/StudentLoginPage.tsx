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
import SchoolIcon2 from '@mui/icons-material/School'
import ApartmentIcon from '@mui/icons-material/Apartment'
import DomainIcon from '@mui/icons-material/Domain'
import SchoolIcon from '@mui/icons-material/School'

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const [cities, setCities] = useState<Array<{label:string, value:number}>>([]);
    const [groups, setGroups] = useState<Array<{label:string, value:number}>>([]);
    const [courses, setCourses] = useState<Array<{label:string, value:number}>>([])
    const [selectedCity, setSelectedCity] = useState<{label:string, value:number} | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<{label:string, value:number} | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<{label:string, value:number} | null>(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // No city selection: groups will be chosen directly

                // Fetch groups with enriched metadata
                const groupsResponse = await http.get('/api/categories/groups');
                const groupsOptions = groupsResponse.data.map((group: any) => ({
                    value: group.id,
                    label: group.display_name,
                    meta: group
                }));
                setGroups(groupsOptions);

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
        if (!selectedGroup) {
            alert('Пожалуйста, выберите группу');
            return;
        }
        
        // Store selection in localStorage for student session
        // selectedCity and selectedGroup are objects from react-select {value, label}
        const groupName = typeof selectedGroup === 'object' && selectedGroup?.label ? selectedGroup.label : selectedGroup;
        const meta = (selectedGroup as any)?.meta
        
        localStorage.setItem('student_group', groupName);
        localStorage.setItem('student_group_id', String(selectedGroup.value));
        // Auto-fill from group metadata when available
        const admissionYearId = meta?.admission_year?.id
        const institutionTypeId = meta?.institution_type_id
        const educationFormId = meta?.education_form?.id

        if (selectedCourse) localStorage.setItem('student_course', String(selectedCourse.value))
        if (admissionYearId) localStorage.setItem('student_admission_year_id', String(admissionYearId))
        if (institutionTypeId) localStorage.setItem('student_institution_type_id', String(institutionTypeId))
        if (educationFormId) localStorage.setItem('student_education_form_id', String(educationFormId))
        localStorage.setItem('user_role', 'student');
        // flag for audience filtering
        localStorage.setItem('strict_audience', '1')
        
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
          {/* City selection removed */}
          <Autocomplete
            options={groups}
            value={selectedGroup}
            onChange={(_, v)=>setSelectedGroup(v)}
            disablePortal
            autoHighlight
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Группа" placeholder="Выберите группу"/>}
          />
          {selectedGroup?.meta?.institution_type_id && (
            <Alert severity="info" sx={{ mt:1 }}>
              {selectedGroup.meta.institution_type_id === 1 && (<Box sx={{display:'flex',alignItems:'center',gap:1}}><SchoolIcon2 fontSize='small'/> <span>Тип: Школа. Доступен выбор класса. Прочие категории скрыты.</span></Box>)}
              {selectedGroup.meta.institution_type_id === 2 && (<Box sx={{display:'flex',alignItems:'center',gap:1}}><ApartmentIcon fontSize='small'/> <span>Тип: Колледж. Класс не применяется. Используются профиль/форма/год.</span></Box>)}
              {selectedGroup.meta.institution_type_id === 3 && (<Box sx={{display:'flex',alignItems:'center',gap:1}}><DomainIcon fontSize='small'/> <span>Тип: Вуз. Класс не применяется. Используются профиль/форма/год.</span></Box>)}
            </Alert>
          )}
          {/* base selection removed */}
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