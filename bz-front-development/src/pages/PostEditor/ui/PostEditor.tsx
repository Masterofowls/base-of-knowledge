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

        try {
            setSaving(true);
            setError(null);

            // Combine selected category IDs
            const categoryIds = [
                ...selectedGroups.map(group => group.value),
                ...selectedTopCategories.map(cat => cat.value)
            ];

            const postData = {
                ...formData,
                content: html,
                category_ids: categoryIds
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
                            placeholder="Выберите группы"
                            label={<p>Группы</p>}
                            options={groups}
                            value={selectedGroups}
                            onChange={(options) => setSelectedGroups(options || [])}
                            isMulti={true}
                        />
                        
                        <InputSelect
                            placeholder="Выберите категории"
                            label={<p>Категории</p>}
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
                                        <InputLabel id='spec-label-2'>Специальность</InputLabel>
                                        <Select labelId='spec-label-2' label='Специальность' value={formData.publish_scope?.speciality_id || ''} onChange={async (e)=> {
                                            const val = Number(e.target.value)
                                            setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, speciality_id: val}}))
                                            const spec = specialities.find(s=>s.value===val)
                                            if (spec?.institution_type_id) {
                                                try { const resp = await http.get('/api/categories/education-forms', { params: { institution_type_id: spec.institution_type_id } }); setEducationForms(resp.data.map((f:any)=>({value:f.id,label:f.name}))) } catch {}
                                            }
                                        }}>
                                            {specialities.map(s=> <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel id='form-label-2'>Форма обучения</InputLabel>
                                        <Select labelId='form-label-2' label='Форма обучения' value={formData.publish_scope?.education_form_id || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, education_form_id: Number(e.target.value)}}))}>
                                            {educationForms.map(f=> <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </>) }
                                {/* Переключатель "Город" (при выборе скрывает курс) */}
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='city-label'>Город (необязательно)</InputLabel>
                                    <Select labelId='city-label' label='Город (необязательно)' value={formData.publish_scope?.city_id || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, city_id: e.target.value===''? undefined : Number(e.target.value), course: undefined}}))}>
                                        <MenuItem value=''>—</MenuItem>
                                        {cities.map(c=> <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                {/* Переключатель "Учебная информация" — курс */}
                                <FormControl fullWidth size='small' disabled={!!formData.publish_scope?.city_id}>
                                    <InputLabel id='course-label'>Курс (необязательно)</InputLabel>
                                    <Select labelId='course-label' label='Курс (необязательно)' value={formData.publish_scope?.course || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, course: e.target.value===''? undefined : Number(e.target.value)}}))}>
                                        <MenuItem value=''>—</MenuItem>
                                        {courseOptions.map(o=> <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='year-label'>Год поступления (необязательно)</InputLabel>
                                    <Select labelId='year-label' label='Год поступления (необязательно)' value={formData.publish_scope?.admission_year_id || ''} onChange={(e)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, admission_year_id: Number(e.target.value)}}))}>
                                        <MenuItem value=''>—</MenuItem>
                                        {admissionYears.map(y=> <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
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
