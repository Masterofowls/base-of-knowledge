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
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const [institutionTypes, setInstitutionTypes] = useState<Array<{label:string, value:number,name:string}>>([])
    const [specialities, setSpecialities] = useState<Array<{label:string, value:number}>>([])
    const [educationForms, setEducationForms] = useState<Array<{label:string, value:number}>>([])
    const [admissionYears, setAdmissionYears] = useState<Array<{label:string, value:number}>>([])
    const [schoolClasses, setSchoolClasses] = useState<Array<{label:string, value:number}>>([])
    const [cities, setCities] = useState<Array<{label:string, value:number}>>([]);
    const [groups, setGroups] = useState<Array<{label:string, value:number, meta?:any}>>([]);
    const [courses, setCourses] = useState<Array<{label:string, value:number}>>([])

    const [selectedInstitution, setSelectedInstitution] = useState<{label:string, value:number,name:string} | null>(null)
    const [selectedSpeciality, setSelectedSpeciality] = useState<{label:string, value:number} | null>(null)
    const [selectedEducationForm, setSelectedEducationForm] = useState<{label:string, value:number} | null>(null)
    const [selectedAdmissionYear, setSelectedAdmissionYear] = useState<{label:string, value:number} | null>(null)
    const [selectedSchoolClass, setSelectedSchoolClass] = useState<{label:string, value:number} | null>(null)
    const [selectedCity, setSelectedCity] = useState<{label:string, value:number} | null>(null)
    const [selectedGroup, setSelectedGroup] = useState<{label:string, value:number} | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<{label:string, value:number} | null>(null)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // base dictionaries
                const instResp = await http.get('/api/categories/institution-types')
                setInstitutionTypes(instResp.data.map((i:any)=>({ value:i.id, label:i.name, name:i.name })))
                const citiesResp = await http.get('/api/categories/cities')
                setCities(citiesResp.data.map((c:any)=>({ value:c.id, label:c.name })))
                // Load specialities (all)
                try {
                    const specs = await http.get('/api/categories/specialities')
                    setSpecialities(specs.data.map((s:any)=>({ value:s.id, label:`${s.code} ${s.name}`, institution_type_id: s.institution_type_id })))
                } catch {}
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

    // Fetch education forms when speciality changes (derive institution from speciality)
    useEffect(() => {
        const run = async () => {
            if (!selectedSpeciality) return
            const instId = (selectedSpeciality as any).institution_type_id
            try {
                setSelectedEducationForm(null)
                const forms = await http.get('/api/categories/education-forms', { params: { institution_type_id: instId } })
                setEducationForms(forms.data.map((f:any)=>({ value:f.id, label:f.name })))
                await refreshGroups(instId)
            } catch (e) {
                // ignore
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSpeciality])

    // refresh groups when any filter (except institution change) changes
    useEffect(() => {
        const run = async () => {
            const instId = (selectedSpeciality as any)?.institution_type_id
            if (!instId) return
            await refreshGroups(instId)
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCity, selectedSpeciality, selectedEducationForm])

    async function refreshGroups(instId?: number) {
        const params:any = {}
        if (instId) params.institution_type_id = instId
        if (selectedCity) params.city_id = selectedCity.value
        if (selectedSpeciality) params.speciality_id = selectedSpeciality.value
        if (selectedEducationForm) params.education_form_id = selectedEducationForm.value
        const groupsResponse = await http.get('/api/categories/groups', { params })
        const groupsOptions = groupsResponse.data.map((group: any) => ({
            value: group.id,
            label: group.display_name,
            meta: group
        }));
        setGroups(groupsOptions)
    }

    const handleBack = () => navigate('/');

    const handleStudentLogin = async () => {
        if (!selectedInstitution) { alert('Выберите тип учреждения'); return }
        const isSchool = selectedInstitution.name.toLowerCase() === 'школа'
        if (isSchool) {
            if (!selectedSchoolClass) { alert('Выберите класс'); return }
        } else {
            if (!selectedEducationForm) { alert('Выберите форму обучения'); return }
            if (!selectedSpeciality && !selectedAdmissionYear) { alert('Укажите специальность или год поступления'); return }
        }
        try {
            const payload:any = {
                institution_type_id: selectedInstitution.value,
                city_id: selectedCity?.value,
                group_id: selectedGroup?.value,
                course: selectedCourse?.value,
            }
            if (isSchool) {
                payload.school_class_id = selectedSchoolClass?.value
            } else {
                payload.education_form_id = selectedEducationForm?.value
                if (selectedSpeciality) payload.speciality_id = selectedSpeciality.value
                if (selectedAdmissionYear) payload.admission_year_id = selectedAdmissionYear.value
            }
            const resp = await http.post('/api/auth/student-login', payload)
            const { token, context } = resp.data || {}
            if (token) localStorage.setItem('student_ctx_token', token)
            // Store selections for feed
            if (selectedGroup) {
                localStorage.setItem('student_group', selectedGroup.label)
                localStorage.setItem('student_group_id', String(selectedGroup.value))
            }
            if (selectedCourse) localStorage.setItem('student_course', String(selectedCourse.value))
            if (selectedAdmissionYear) localStorage.setItem('student_admission_year_id', String(selectedAdmissionYear.value))
            if (selectedInstitution) localStorage.setItem('student_institution_type_id', String(selectedInstitution.value))
            if (selectedEducationForm) localStorage.setItem('student_education_form_id', String(selectedEducationForm.value))
            if (selectedCity) localStorage.setItem('student_city_id', String(selectedCity.value))
            localStorage.setItem('user_role', 'student')
            localStorage.setItem('strict_audience', '1')
            navigate('/student')
        } catch (e:any) {
            alert(e?.response?.data?.error || 'Не удалось выполнить вход')
        }
    };
    if (loading) return <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}><Typography>Загрузка...</Typography></Container>

    return (
      <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}>
        <Paper elevation={3} sx={{ p:3, width:'100%', borderRadius:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
            <SchoolIcon color="primary"/>
            <Typography variant="h6" fontWeight={700}>Вход студента</Typography>
          </Box>
          <Autocomplete
            options={institutionTypes}
            value={selectedInstitution}
            onChange={(_, v)=>{ setSelectedInstitution(v); setSelectedGroup(null) }}
            disablePortal
            autoHighlight
            isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Тип учреждения" placeholder="Колледж / Вуз / Школа"/>}
            sx={{ mb:2 }}
          />
          <Autocomplete
            options={cities}
            value={selectedCity}
            onChange={(_, v)=>{ setSelectedCity(v); setSelectedGroup(null) }}
            disablePortal
            autoHighlight
            isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
            getOptionLabel={o=>o?.label ?? ''}
            renderInput={(params) => <TextField {...params} label="Город (необязательно)" placeholder="Выберите город"/>}
            sx={{ mb:2 }}
          />
          {selectedInstitution && selectedInstitution.name.toLowerCase()==='школа' ? (
            <Autocomplete
              options={schoolClasses}
              value={selectedSchoolClass}
              onChange={(_, v)=>{ setSelectedSchoolClass(v); refreshGroups(selectedInstitution.value) }}
              disablePortal
              autoHighlight
              isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
              getOptionLabel={o=>o?.label ?? ''}
              renderInput={(params) => <TextField {...params} label="Класс" placeholder="Выберите класс"/>}
              sx={{ mb:2 }}
            />
          ) : (
            <>
              <Autocomplete
                options={specialities}
                value={selectedSpeciality}
                onChange={(_, v)=>{ setSelectedSpeciality(v); refreshGroups(selectedInstitution?.value) }}
                disablePortal
                autoHighlight
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={o=>o?.label ?? ''}
                renderInput={(params) => <TextField {...params} label="Специальность (одна из)" placeholder="Выберите специальность"/>}
                sx={{ mb:2 }}
              />
              <Autocomplete
                options={educationForms}
                value={selectedEducationForm}
                onChange={(_, v)=>{ setSelectedEducationForm(v); refreshGroups(selectedInstitution?.value) }}
                disablePortal
                autoHighlight
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={o=>o?.label ?? ''}
                renderInput={(params) => <TextField {...params} label="Форма обучения" placeholder="Очная / Заочная"/>}
                sx={{ mb:2 }}
              />
              <Autocomplete
                options={admissionYears}
                value={selectedAdmissionYear}
                onChange={(_, v)=>{ setSelectedAdmissionYear(v); refreshGroups(selectedInstitution?.value) }}
                disablePortal
                autoHighlight
                isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                getOptionLabel={o=>o?.label ?? ''}
                renderInput={(params) => <TextField {...params} label="Год поступления (необязательно)" placeholder="Выберите год"/>}
                sx={{ mb:2 }}
              />
            </>
          )}
          <Autocomplete
            options={groups}
            value={selectedGroup}
            onChange={(_, v)=>setSelectedGroup(v)}
            disablePortal
            autoHighlight
            isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
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
            isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
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