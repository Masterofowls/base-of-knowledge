import { classNames } from "shared/lib/classNames/classNames.ts";
import { Container } from "shared/ui/Container/Container.tsx";
import { Button } from "shared/ui/Button";
import { ThemeButton } from "shared/ui/Button/ui/Button.tsx";
import { Input } from "shared/ui/Input/Input.tsx";
import { InputSelect } from "shared/ui/InputSelect/InputSelect.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import http from "shared/api/http";
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react";
import SaveIcon from "shared/assets/icons/Plus.svg?react";
import { Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox, Select, MenuItem, InputLabel, FormControl, Chip, Button as MUIButton, Autocomplete, TextField } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface Category {
    id: number;
    top_category?: {
        id: number;
        name: string;
        slug: string;
    };
    subcategory?: {
        id: number;
        name: string;
        slug: string;
    };
    group?: {
        id: number;
        display_name: string;
    };
}

interface Group {
    id: number;
    display_name: string;
}

interface TopCategory {
    id: number;
    name: string;
    slug: string;
}

interface PostFormData {
    title: string;
    content: string;
    is_published: boolean;
    is_for_staff: boolean;
    is_actual: boolean;
    category_ids: number[];
    publish_scope?: {
        publish_for_all?: boolean;
        education_form_id?: number;
        speciality_id?: number;
        city_id?: number;
        course?: number;
        admission_year_id?: number;
    }
}

export default function PostEditor() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        content: '',
        is_published: false,
        is_for_staff: false,
        is_actual: true,
        category_ids: []
    });
    
    const [groups, setGroups] = useState<Group[]>([]);
    const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
    const [selectedTopCategories, setSelectedTopCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<{value:number,label:string}[]>([])
    const [admissionYears, setAdmissionYears] = useState<{value:number,label:string}[]>([])
    const [specialities, setSpecialities] = useState<{value:number,label:string,institution_type_id?:number}[]>([])
    const [educationForms, setEducationForms] = useState<{value:number,label:string}[]>([])
    const [courseOptions, setCourseOptions] = useState<{value:number,label:string}[]>([])

    // Institution & School class controls
    const [institutionTypes, setInstitutionTypes] = useState<{value:number,label:string,name:string}[]>([])
    const [selectedInstitution, setSelectedInstitution] = useState<{value:number,label:string,name:string} | null>(null)
    const [schoolClasses, setSchoolClasses] = useState<{value:number,label:string}[]>([])
    const [selectedSchoolClass, setSelectedSchoolClass] = useState<{value:number,label:string} | null>(null)
    
    const [loading, setLoading] = useState(false);
    const [bulk, setBulk] = useState<{ all_cities?: boolean; all_specialities?: boolean; all_education_modes?: boolean; all_groups?: boolean; audience_all?: boolean }>({})
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null)
    const quillRef = useRef<Quill | null>(null)
    const TOOLBAR: any = useMemo(() => ([
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', { 'script': 'sub' }, { 'script': 'super' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'header': [1, 2, 3, 4, 5, false] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
    ]), [])

    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchArticle();
        }
    }, [isEditing, id]);

    const fetchCategories = async () => {
        try {
            // Fetch groups
            const groupsResponse = await http.get('/api/categories/groups');
            const groupsOptions = groupsResponse.data.map((group: Group) => ({
                value: group.id,
                label: group.display_name
            }));
            setGroups(groupsOptions);

            // Fetch top categories
            const topCategoriesResponse = await http.get('/api/categories/top-categories');
            const topCategoriesOptions = topCategoriesResponse.data.map((category: TopCategory) => ({
                value: category.id,
                label: category.name
            }));
            setTopCategories(topCategoriesOptions);

            // Fetch institution types
            const instResp = await http.get('/api/categories/institution-types')
            setInstitutionTypes(instResp.data.map((i:any)=>({ value:i.id, label:i.name, name:i.name })))

            // Fetch cities
            const citiesResponse = await http.get('/api/categories/cities');
            setCities(citiesResponse.data.map((c:any)=>({value:c.id,label:c.name})))

            const yearsResponse = await http.get('/api/categories/admission-years')
            setAdmissionYears(yearsResponse.data.map((y:any)=>({value:y.id,label:String(y.year)})))

            const specsResponse = await http.get('/api/categories/specialities')
            setSpecialities(specsResponse.data.map((s:any)=>({value:s.id,label:`${s.code} ${s.name}`, institution_type_id: s.institution_type_id})))

            const formsResponse = await http.get('/api/categories/education-forms')
            setEducationForms(formsResponse.data.map((f:any)=>({value:f.id,label:f.name})))

            const coursesResp = await http.get('/api/categories/courses', { params: { max: 6 } })
            setCourseOptions((coursesResp.data as number[]).map((n:number)=>({ value:n, label:String(n) })))
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setError('Не удалось загрузить категории');
        }
    };

    // Load dependent dictionaries when institution changes
    useEffect(() => {
        const run = async () => {
            if (!selectedInstitution) return
            try {
                const instId = selectedInstitution.value
                const specsResponse = await http.get('/api/categories/specialities', { params: { institution_type_id: instId } })
                setSpecialities(specsResponse.data.map((s:any)=>({value:s.id,label:`${s.code} ${s.name}`, institution_type_id: s.institution_type_id})))
                const formsResponse = await http.get('/api/categories/education-forms', { params: { institution_type_id: instId } })
                setEducationForms(formsResponse.data.map((f:any)=>({value:f.id,label:f.name})))
                const yearsResponse = await http.get('/api/categories/admission-years', { params: { institution_type_id: instId } })
                setAdmissionYears(yearsResponse.data.map((y:any)=>({value:y.id,label:String(y.year)})))
                const classesResponse = await http.get('/api/categories/school-classes', { params: { institution_type_id: instId } })
                setSchoolClasses(classesResponse.data.map((cl:any)=>({ value:cl.id, label:cl.name })))
                setSelectedSchoolClass(null)
                // If switched to school — course is not applicable
                if (selectedInstitution.name.toLowerCase()==='школа') {
                    setFormData(prev=> ({...prev, publish_scope: { ...(prev.publish_scope||{}), course: undefined }}))
                }
            } catch {}
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInstitution])

    const fetchArticle = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            const response = await http.get(`/api/articles/${id}`);
            const article = response.data;
            
            setFormData({
                title: article.title,
                content: article.content,
                is_published: article.is_published,
                is_for_staff: article.is_for_staff,
                is_actual: article.is_actual,
                category_ids: article.categories.map((cat: Category) => cat.id)
            });

            if (quillRef.current) quillRef.current.setText('')
            if (quillRef.current && article.content) {
                quillRef.current.setText('')
                quillRef.current.clipboard.dangerouslyPasteHTML(article.content)
            }

            // Set selected categories for the UI
            const selectedGroupIds = article.categories
                .filter((cat: Category) => cat.group)
                .map((cat: Category) => cat.group!.id);
            const selectedGroupOptions = groups.filter(group => selectedGroupIds.includes(group.value));
            setSelectedGroups(selectedGroupOptions);

            const selectedTopCategoryIds = article.categories
                .filter((cat: Category) => cat.top_category)
                .map((cat: Category) => cat.top_category!.id);
            const selectedTopCategoryOptions = topCategories.filter(cat => selectedTopCategoryIds.includes(cat.value));
            setSelectedTopCategories(selectedTopCategoryOptions);

        } catch (error) {
            console.error('Failed to fetch article:', error);
            setError('Не удалось загрузить пост');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof PostFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError('Название поста обязательно');
            return;
        }

        const html = quillRef.current?.root.innerHTML ?? formData.content
        if (!html || html === '<p><br></p>') {
            setError('Содержание поста обязательно');
            return;
        }

        // Audience validation per rules
        const ps = formData.publish_scope || {}
        if (!ps.publish_for_all) {
            const hasCity = !!ps.city_id
            const hasCourse = typeof ps.course === 'number' && !Number.isNaN(ps.course)
            const isSchool = selectedInstitution?.name?.toLowerCase() === 'школа'
            const hasStudyDetail = isSchool || !!ps.speciality_id || !!ps.education_form_id || !!ps.admission_year_id || !!selectedSchoolClass
            if (!hasCity && !(hasCourse || hasStudyDetail)) {
                setError('Укажите аудиторию: Город или Учебная информация (курс/класс/профиль/форма/год), либо выберите "Для всех"')
                return
            }
        }

        try {
            setSaving(true);
            setError(null);

            // Combine selected category IDs
            const categoryIds = [
                ...selectedGroups.map(group => group.value),
                ...selectedTopCategories.map(cat => cat.value)
            ];

            // augment publish_scope with institution and school_class if selected
            const augmentedScope = { ...(formData.publish_scope||{}) }
            if (selectedInstitution) {
                augmentedScope.institution_type_id = selectedInstitution.value
            }
            if (selectedSchoolClass) {
                augmentedScope.school_class_id = selectedSchoolClass.value
            }

            const postData = {
                ...formData,
                content: html,
                category_ids: categoryIds,
                publish_scope: augmentedScope
            };

            if (isEditing) {
                await http.put(`/api/articles/${id}`, postData);
            } else {
                await http.post('/api/articles', postData);
            }

            navigate('/admin/posts');
        } catch (error: any) {
            console.error('Failed to save post:', error);
            setError(error.response?.data?.error || 'Не удалось сохранить пост');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/posts');
    };

    useEffect(() => {
        if (!editorRef.current || quillRef.current) return
        const q = new Quill(editorRef.current, {
            theme: 'snow',
            placeholder: 'Введите текст поста…',
            modules: {
                toolbar: TOOLBAR,
                clipboard: { matchVisual: false }
            }
        })
        quillRef.current = q
        // keep two-way sync with formData.content for fallback
        q.on('text-change', () => {
            setFormData(prev => ({ ...prev, content: q.root.innerHTML }))
        })
        return () => { quillRef.current = null }
    }, [TOOLBAR])

    if (loading) {
        return (
            <div className={classNames('page-center-wrapper', {}, [])}>
                <Container gap="16px" width='900px' direction="column" paddings='24px'>
                    <p>Загрузка поста...</p>
                </Container>
            </div>
        );
    }

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container gap="20px" width='min(100%, 960px)' direction="column" paddings='24px'>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <span 
                        onClick={handleBack} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: "5px", cursor: 'pointer' }}
                    >
                        <ArrowIcon width='13px' height='11px' />
                        <p>Назад к управлению постами</p>
                    </span>
                    <h2>{isEditing ? 'Редактировать пост' : 'Создать новый пост'}</h2>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ color: '#E44A77', padding: '12px', backgroundColor: '#ffe6ee', borderRadius: '6px' }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Title */}
                    <Input
                        type="text"
                        placeholder="Введите название поста"
                        label={<p>Название поста *</p>}
                        value={formData.title}
                        onChange={(value) => handleInputChange('title', value)}
                    />

                    {/* Content */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            Содержание поста *
                        </label>
                        <div style={{ border: '1px solid #ddd', borderRadius: 6 }}>
                            <div ref={editorRef} style={{ minHeight: 280 }} />
                        </div>
                    </div>

                    {/* Categories */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <InputSelect
                            placeholder="Выберите группы (не обязательно)"
                            label={<p>Группы (не обязательно)</p>}
                            options={groups}
                            value={selectedGroups}
                            onChange={(options) => setSelectedGroups(options || [])}
                            isMulti={true}
                        />
                        
                        <InputSelect
                            placeholder="Выберите категории (не обязательно)"
                            label={<p>Категории (не обязательно)</p>}
                            options={topCategories}
                            value={selectedTopCategories}
                            onChange={(options) => setSelectedTopCategories(options || [])}
                            isMulti={true}
                        />
                    </div>

                    {/* Checkboxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_published}
                                onChange={(e) => handleInputChange('is_published', e.target.checked)}
                            />
                            <span>Опубликовать сразу</span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_for_staff}
                                onChange={(e) => handleInputChange('is_for_staff', e.target.checked)}
                            />
                            <span>Только для сотрудников</span>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_actual}
                                onChange={(e) => handleInputChange('is_actual', e.target.checked)}
                            />
                            <span>Актуальный</span>
                        </label>
                    </div>

                    {/* Аудитория: переключатели "Для всех / Город / Учебная информация" */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>Параметры аудитории</AccordionSummary>
                        <AccordionDetails>
                            <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                                {/* Для всех */}
                                <FormControlLabel control={<Checkbox checked={!!formData.publish_scope?.publish_for_all} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, publish_for_all: e.target.checked, city_id: undefined, course: undefined }}))}/>} label='Для всех' />
                                {/* Если не для всех, доступны Город и Учебная информация */}
                                {!formData.publish_scope?.publish_for_all && (
                                <>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel id='spec-label-2'>Специальность (не обязательно)</InputLabel>
                                        <Select labelId='spec-label-2' label='Специальность' value={formData.publish_scope?.speciality_id || ''} onChange={async (e)=> {
                                            const raw = e.target.value as any
                                            const val = raw === '' ? undefined : Number(raw)
                                            setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, speciality_id: val}}))
                                            const spec = specialities.find(s=>s.value===val)
                                            if (spec?.institution_type_id) {
                                                try { const resp = await http.get('/api/categories/education-forms', { params: { institution_type_id: spec.institution_type_id } }); setEducationForms(resp.data.map((f:any)=>({value:f.id,label:f.name}))) } catch {}
                                            }
                                        }}>
                                            <MenuItem value=''>— Все специальности —</MenuItem>
                                            {specialities.map(s=> <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel id='form-label-2'>Форма обучения (не обязательно)</InputLabel>
                                        <Select labelId='form-label-2' label='Форма обучения' value={formData.publish_scope?.education_form_id || ''} onChange={(e)=> {
                                            const raw = e.target.value as any
                                            const val = raw === '' ? undefined : Number(raw)
                                            setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, education_form_id: val}}))
                                        }}>
                                            <MenuItem value=''>— Все форматы —</MenuItem>
                                            {educationForms.map(f=> <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </>) }
                                {/* Переключатель "Город" (при выборе скрывает курс) */}
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='city-label'>Город (не обязательно)</InputLabel>
                                    <Select labelId='city-label' label='Город (не обязательно)' value={formData.publish_scope?.city_id || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, city_id: e.target.value===''? undefined : Number(e.target.value), course: undefined}}))}>
                                        <MenuItem value=''>— Все города —</MenuItem>
                                        {cities.map(c=> <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                {/* Переключатель "Учебная информация" — курс */}
                                <FormControl fullWidth size='small' disabled={!!formData.publish_scope?.city_id}>
                                    <InputLabel id='course-label'>Курс (не обязательно)</InputLabel>
                                    <Select labelId='course-label' label='Курс (не обязательно)' value={formData.publish_scope?.course || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, course: e.target.value===''? undefined : Number(e.target.value)}}))}>
                                        <MenuItem value=''>— Все курсы —</MenuItem>
                                        {courseOptions.map(o=> <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='year-label'>Год поступления (не обязательно)</InputLabel>
                                    <Select labelId='year-label' label='Год поступления (не обязательно)' value={formData.publish_scope?.admission_year_id || ''} onChange={(e)=> {
                                        const raw = e.target.value as any
                                        const val = raw === '' ? undefined : Number(raw)
                                        setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, admission_year_id: val}}))
                                    }}>
                                        <MenuItem value=''>— Все годы поступления —</MenuItem>
                                        {admissionYears.map(y=> <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                {/* Школа — класс */}
                                {selectedInstitution?.name?.toLowerCase()==='школа' && (
                                  <FormControl fullWidth size='small'>
                                    <InputLabel id='class-label'>Класс (не обязательно)</InputLabel>
                                    <Select labelId='class-label' label='Класс (не обязательно)' value={selectedSchoolClass?.value || ''} onChange={(e)=> {
                                      const raw = e.target.value as any
                                      const val = raw === '' ? undefined : Number(raw)
                                      const found = schoolClasses.find(c=>c.value===val)
                                      setSelectedSchoolClass(found || null)
                                    }}>
                                      <MenuItem value=''>— Все классы —</MenuItem>
                                      {schoolClasses.map(cl=> <MenuItem key={cl.value} value={cl.value}>{cl.label}</MenuItem>)}
                                    </Select>
                                  </FormControl>
                                )}
                            </div>
                        </AccordionDetails>
                    </Accordion>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button
                            onClick={handleBack}
                            width='120px'
                            backgroundColor='#666'
                            theme={ThemeButton.CLEAR}
                        >
                            <span>Отмена</span>
                        </Button>
                        
                        <Button
                            onClick={handleSubmit}
                            width='180px'
                            backgroundColor='#00AAFF'
                            theme={ThemeButton.ARROW}
                            disabled={saving}
                        >
                            <span>
                                <SaveIcon width='13px' height='13px' />
                                <p>{saving ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}</p>
                            </span>
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}
