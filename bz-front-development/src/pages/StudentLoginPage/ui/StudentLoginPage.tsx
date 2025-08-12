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
    const [selectedCity, setSelectedCity] = useState<{label:string, value:number} | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<{label:string, value:number} | null>(null);
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

    const handleBack = () => navigate('/');

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
          <Box sx={{ display:'flex', gap:1, mt:2 }}>
            <Button onClick={handleBack} startIcon={<ArrowBackIcon/>} variant="outlined" color="inherit">Назад</Button>
            <Button onClick={handleStudentLogin} variant="contained" sx={{ ml:'auto' }}>Войти</Button>
          </Box>
          <Alert sx={{ mt:2 }} severity="info">Данные студентов не сохраняются в базе. Вход осуществляется через выбор группы для просмотра материалов.</Alert>
        </Paper>
      </Container>
    );
}