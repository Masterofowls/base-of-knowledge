import { classNames } from "shared/lib/classNames/classNames.ts";
import { Container } from "shared/ui/Container/Container.tsx";
import { DataTable, EmptyState, PropertyList, Property, PropertyLabel, PropertyValue, Banner, BannerContent, BannerTitle, BannerDescription } from '@saas-ui/react'
import { Box } from '@chakra-ui/react'
import { Button } from "shared/ui/Button";
import { ThemeButton } from "shared/ui/Button/ui/Button.tsx";
import { Input } from "shared/ui/Input/Input.tsx";
import { InputSelect } from "shared/ui/InputSelect/InputSelect.tsx";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import http from "shared/api/http";
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react";
import PlusIcon from "shared/assets/icons/Plus.svg?react";
import PenIcon from "shared/assets/icons/Pen.svg?react";
import StudentsIcon from "shared/assets/icons/users-solid.svg?react";

interface Group {
    id: number;
    display_name: string;
    speciality?: {
        id: number;
        code: string;
        name: string;
    };
    education_form?: {
        id: number;
        name: string;
    };
    admission_year?: {
        id: number;
        year: number;
    };
    city?: {
        id: number;
        name: string;
    };
    school_class?: {
        id: number;
        name: string;
    };
}

interface City {
    id: number;
    name: string;
}

interface Speciality {
    id: number;
    code: string;
    name: string;
    institution_type_id: number;
}

interface EducationForm {
    id: number;
    name: string;
    institution_type_id: number;
}

interface AdmissionYear {
    id: number;
    year: number;
    description: string;
    is_active: boolean;
    institution_type_id: number;
}

interface SchoolClass {
    id: number;
    name: string;
    institution_type_id: number;
}

interface InstitutionType {
    id: number;
    name: string;
}

interface CreateGroupFormData {
    display_name: string;
    speciality_id: number | null;
    education_form_id: number | null;
    admission_year_id: number | null;
    institution_type_id: number | null;
    school_class_id: number | null;
    city_id: number | null;
}

export default function GroupManagement() {
    const navigate = useNavigate();
    
    const [groups, setGroups] = useState<Group[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [educationForms, setEducationForms] = useState<EducationForm[]>([]);
    const [admissionYears, setAdmissionYears] = useState<AdmissionYear[]>([]);
    const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
    const [institutionTypes, setInstitutionTypes] = useState<InstitutionType[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState<any>(null);
    
    const [createForm, setCreateForm] = useState<CreateGroupFormData>({
        display_name: '',
        speciality_id: null,
        education_form_id: null,
        admission_year_id: null,
        institution_type_id: null,
        school_class_id: null,
        city_id: null
    });
    
    const [selectedCreateCity, setSelectedCreateCity] = useState<any>(null);
    const [selectedSpeciality, setSelectedSpeciality] = useState<any>(null);
    const [selectedEducationForm, setSelectedEducationForm] = useState<any>(null);
    const [selectedAdmissionYear, setSelectedAdmissionYear] = useState<any>(null);
    const [selectedSchoolClass, setSelectedSchoolClass] = useState<any>(null);
    const [selectedInstitutionType, setSelectedInstitutionType] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchFilteredGroups();
    }, [searchTerm, selectedCity]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all necessary data in parallel
            const [
                groupsResponse,
                citiesResponse,
                specialitiesResponse,
                educationFormsResponse,
                admissionYearsResponse,
                schoolClassesResponse,
                institutionTypesResponse
            ] = await Promise.all([
                http.get('/api/categories/groups'),
                http.get('/api/categories/cities'),
                http.get('/api/categories/specialities'),
                http.get('/api/categories/education-forms'),
                http.get('/api/categories/admission-years'),
                http.get('/api/categories/school-classes'),
                http.get('/api/categories/institution-types')
            ]);

            setGroups(groupsResponse.data || []);
            setCities(citiesResponse.data || []);
            setSpecialities(specialitiesResponse.data || []);
            setEducationForms(educationFormsResponse.data || []);
            setAdmissionYears(admissionYearsResponse.data || []);
            setSchoolClasses(schoolClassesResponse.data || []);
            setInstitutionTypes(institutionTypesResponse.data || []);

        } catch (error) {
            console.error('Failed to fetch data:', error);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredGroups = async () => {
        try {
            const params: any = {};
            
            if (searchTerm.trim()) {
                // For search, we'll filter client-side since backend doesn't support group name search
                const filteredGroups = groups.filter(group => 
                    group.display_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setGroups(filteredGroups);
                return;
            }
            
            if (selectedCity?.value) {
                params.city_id = selectedCity.value;
            }

            const response = await http.get('/api/categories/groups', { params });
            setGroups(response.data || []);
        } catch (error) {
            console.error('Failed to fetch filtered groups:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!createForm.display_name.trim()) {
            setError('Название группы обязательно');
            return;
        }

        if (!createForm.speciality_id || !createForm.education_form_id || !createForm.admission_year_id || !createForm.institution_type_id) {
            setError('Специальность, форма обучения, год поступления и тип учреждения обязательны');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            await http.post('/api/categories/groups', createForm);
            
            // Reset form and refresh groups
            setCreateForm({
                display_name: '',
                speciality_id: null,
                education_form_id: null,
                admission_year_id: null,
                institution_type_id: null,
                school_class_id: null,
                city_id: null
            });
            setSelectedCreateCity(null);
            setSelectedSpeciality(null);
            setSelectedEducationForm(null);
            setSelectedAdmissionYear(null);
            setSelectedSchoolClass(null);
            setSelectedInstitutionType(null);
            setShowCreateForm(false);
            
            fetchData(); // Refresh the groups list
        } catch (error: any) {
            console.error('Failed to create group:', error);
            setError(error.response?.data?.error || 'Не удалось создать группу');
        } finally {
            setCreating(false);
        }
    };

    const handleFormFieldChange = (field: keyof CreateGroupFormData, value: any) => {
        setCreateForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBack = () => {
        navigate('/admin');
    };

    // Prepare options for selects
    const cityOptions = cities.map(city => ({ value: city.id, label: city.name }));
    const specialityOptions = specialities.map(spec => ({ value: spec.id, label: `${spec.code} - ${spec.name}` }));
    const educationFormOptions = educationForms.map(form => ({ value: form.id, label: form.name }));
    const admissionYearOptions = admissionYears.map(year => ({ value: year.id, label: `${year.year} (${year.description})` }));
    const schoolClassOptions = schoolClasses.map(cls => ({ value: cls.id, label: cls.name }));
    const institutionTypeOptions = institutionTypes.map(type => ({ value: type.id, label: type.name }));

    if (loading) {
        return (
            <div className={classNames('page-center-wrapper', {}, [])}>
                <Container gap="16px" width='1000px' direction="column" paddings='24px'>
                    <p>Загрузка групп...</p>
                </Container>
            </div>
        );
    }

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container gap="16px" width='1200px' direction="column" paddings='24px'>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span 
                            onClick={handleBack} 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: "5px", cursor: 'pointer' }}
                        >
                            <ArrowIcon width='13px' height='11px' />
                            <p>Назад к панели администратора</p>
                        </span>
                        <h2>Управление группами</h2>
                    </div>
                    <Button 
                        onClick={() => setShowCreateForm(!showCreateForm)} 
                        width='180px' 
                        backgroundColor='#92DA63' 
                        theme={ThemeButton.ARROW}
                    >
                        <span><PlusIcon width='13px' height='13px' /><p>Создать группу</p></span>
                    </Button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <Input
                        type="text"
                        placeholder="Поиск по названию группы..."
                        value={searchTerm}
                        onChange={(value) => setSearchTerm(value)}
                        style={{ width: '300px' }}
                    />
                    <InputSelect
                        placeholder="Фильтр по городу"
                        options={cityOptions}
                        value={selectedCity}
                        onChange={setSelectedCity}
                        style={{ width: '200px' }}
                    />
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ color: '#E44A77', padding: '12px', backgroundColor: '#ffe6ee', borderRadius: '6px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                {/* Create Group Form */}
                {showCreateForm && (
                    <div style={{
                        border: '2px solid #92DA63',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#f9fff9',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#92DA63' }}>Создать новую группу</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <Input
                                type="text"
                                placeholder="Название группы (например: ИТ-101)"
                                label={<p>Название группы *</p>}
                                value={createForm.display_name}
                                onChange={(value) => handleFormFieldChange('display_name', value)}
                            />
                            
                            <InputSelect
                                placeholder="Выберите тип учреждения"
                                label={<p>Тип учреждения *</p>}
                                options={institutionTypeOptions}
                                value={selectedInstitutionType}
                                onChange={(option) => {
                                    setSelectedInstitutionType(option);
                                    handleFormFieldChange('institution_type_id', option?.value || null);
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <InputSelect
                                placeholder="Выберите специальность"
                                label={<p>Специальность *</p>}
                                options={specialityOptions}
                                value={selectedSpeciality}
                                onChange={(option) => {
                                    setSelectedSpeciality(option);
                                    handleFormFieldChange('speciality_id', option?.value || null);
                                }}
                            />
                            
                            <InputSelect
                                placeholder="Выберите форму обучения"
                                label={<p>Форма обучения *</p>}
                                options={educationFormOptions}
                                value={selectedEducationForm}
                                onChange={(option) => {
                                    setSelectedEducationForm(option);
                                    handleFormFieldChange('education_form_id', option?.value || null);
                                }}
                            />
                            
                            <InputSelect
                                placeholder="Выберите год поступления"
                                label={<p>Год поступления *</p>}
                                options={admissionYearOptions}
                                value={selectedAdmissionYear}
                                onChange={(option) => {
                                    setSelectedAdmissionYear(option);
                                    handleFormFieldChange('admission_year_id', option?.value || null);
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <InputSelect
                                placeholder="Выберите курс (опционально)"
                                label={<p>Курс</p>}
                                options={schoolClassOptions}
                                value={selectedSchoolClass}
                                onChange={(option) => {
                                    setSelectedSchoolClass(option);
                                    handleFormFieldChange('school_class_id', option?.value || null);
                                }}
                            />
                            
                            <InputSelect
                                placeholder="Выберите город (опционально)"
                                label={<p>Город</p>}
                                options={cityOptions}
                                value={selectedCreateCity}
                                onChange={(option) => {
                                    setSelectedCreateCity(option);
                                    handleFormFieldChange('city_id', option?.value || null);
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => setShowCreateForm(false)}
                                width='120px'
                                backgroundColor='#666'
                                theme={ThemeButton.CLEAR}
                            >
                                <span>Отмена</span>
                            </Button>
                            
                            <Button
                                onClick={handleCreateGroup}
                                width='180px'
                                backgroundColor='#92DA63'
                                theme={ThemeButton.ARROW}
                                disabled={creating}
                            >
                                <span>
                                    <PlusIcon width='13px' height='13px' />
                                    <p>{creating ? 'Создание...' : 'Создать группу'}</p>
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Groups List */}
                {groups.length === 0 ? (
                    <EmptyState
                      title="Группы не найдены"
                      description={searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую группу'}
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                        {groups.map((group) => (
                            <div 
                                key={group.id}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    backgroundColor: '#fff',
                                    transition: 'box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                      {group.display_name}
                                  </h3>
                                  <StudentsIcon width='20px' height='20px' style={{ color: '#92DA63' }} />
                                </div>

                                <PropertyList spacing={1} style={{ fontSize: 14, color: '#555' }}>
                                  {group.speciality && (
                                    <Property>
                                      <PropertyLabel>Специальность</PropertyLabel>
                                      <PropertyValue>{group.speciality.code} - {group.speciality.name}</PropertyValue>
                                    </Property>
                                  )}
                                  {group.education_form && (
                                    <Property>
                                      <PropertyLabel>Форма обучения</PropertyLabel>
                                      <PropertyValue>{group.education_form.name}</PropertyValue>
                                    </Property>
                                  )}
                                  {group.admission_year && (
                                    <Property>
                                      <PropertyLabel>Год поступления</PropertyLabel>
                                      <PropertyValue>{group.admission_year.year}</PropertyValue>
                                    </Property>
                                  )}
                                  {group.city && (
                                    <Property>
                                      <PropertyLabel>Город</PropertyLabel>
                                      <PropertyValue>{group.city.name}</PropertyValue>
                                    </Property>
                                  )}
                                  {group.school_class && (
                                    <Property>
                                      <PropertyLabel>Курс</PropertyLabel>
                                      <PropertyValue>{group.school_class.name}</PropertyValue>
                                    </Property>
                                  )}
                                </PropertyList>
                                <div style={{display:'flex', gap:8, marginTop:12}}>
                                    <Button
                                        onClick={async ()=>{
                                            const payload:any = {}
                                            const name = prompt('Новое название группы', group.display_name)
                                            if (name && name.trim()) payload.display_name = name.trim()
                                            if (!Object.keys(payload).length) return
                                            try {
                                                await http.put(`/api/categories/groups/${group.id}`, payload)
                                                fetchData()
                                            } catch(e){ console.error(e) }
                                        }}
                                        width='120px'
                                        backgroundColor='#7F61DD'
                                        theme={ThemeButton.CLEAR}
                                    >
                                        <span><PenIcon width='12px' height='12px' /></span>
                                    </Button>
                                    <Button
                                        onClick={async ()=>{
                                            if (!confirm('Удалить группу?')) return
                                            try {
                                                await http.delete(`/api/categories/groups/${group.id}`)
                                                fetchData()
                                            } catch(e){ console.error(e) }
                                        }}
                                        width='120px'
                                        backgroundColor='#E44A77'
                                        theme={ThemeButton.CLEAR}
                                    >
                                        <span>Удалить</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
