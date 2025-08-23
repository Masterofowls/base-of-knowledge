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
// Better table integration for consistent rows/cols and drag-resize
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QuillBetterTable from 'quill-table-better'
// Note: CSS from quill-table-better is not resolved in our build; omit import to avoid Rollup error
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react";
import SaveIcon from "shared/assets/icons/Plus.svg?react";
import { Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox, Autocomplete, TextField, IconButton, RadioGroup, Radio } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteIcon from '@mui/icons-material/Delete'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import imageCompression from 'browser-image-compression'
import { VirtualListbox } from 'shared/ui/VirtualListbox'

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
        // legacy single-value fields (kept for backward compat)
        education_form_id?: number;
        speciality_id?: number;
        city_id?: number;
        course?: number;
        admission_year_id?: number;
        institution_type_id?: number;
        school_class_id?: number;
        // new multi-rule audience definition
        rules?: Array<{
            institution_type_ids?: number[];
            education_form_ids?: number[];
            speciality_ids?: number[];
            city_ids?: number[];
            admission_year_ids?: number[];
            course?: number;
            school_class_id?: number;
        }>
    }
}

function toYouTubeEmbed(url: string): string | null {
    try {
        const u = new URL(url)
        if (/youtu\.be$/.test(u.hostname)) {
            const id = u.pathname.replace('/', '')
            if (id) return `https://www.youtube.com/embed/${id}`
        }
        if (/(^|\.)youtube\.com$/.test(u.hostname)) {
            if (u.pathname.startsWith('/watch')) {
                const id = u.searchParams.get('v')
                if (id) return `https://www.youtube.com/embed/${id}`
            }
            if (u.pathname.startsWith('/shorts/')) {
                const id = u.pathname.split('/')[2]
                if (id) return `https://www.youtube.com/embed/${id}`
            }
        }
    } catch {}
    return null
}

function isPdfUrl(url: string): boolean {
    return /\.pdf(\?|#|$)/i.test(url)
}

function toVkEmbed(url: string): string | null {
    try {
        const u = new URL(url)
        if (/(^|\.)vk\.com$/.test(u.hostname)) {
            const joined = u.pathname + ' ' + (u.searchParams.get('z') || '')
            const m = joined.match(/video(-?\d+_\d+)/)
            if (m && m[1]) {
                const [oid, id] = m[1].split('_')
                return `https://vk.com/video_ext.php?oid=${oid}&id=${id}`
            }
        }
    } catch {}
    return null
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
    // Мульти-правила публикации (экспериментальный конструктор)
    const [audienceRules, setAudienceRules] = useState<Array<any>>([])
    const [multiSelect, setMultiSelect] = useState<boolean>(false)
    // Метка типа информации: 'study' | 'group' (только для отображения)
    const [infoTag, setInfoTag] = useState<'study'|'group'>('group')
    // Режим аудитории: 'all' | 'city' | 'study'
    const [audienceMode, setAudienceMode] = useState<'all'|'city'|'all_except_city'|'study'>('all')
    const [selectedCities, setSelectedCities] = useState<Array<{value:number,label:string}>>([])
    const [exceptCities, setExceptCities] = useState<Array<{value:number,label:string}>>([])
    const [selectedCourses, setSelectedCourses] = useState<Array<{value:number,label:string}>>([])

    // Institution & School class controls
    const [institutionTypes, setInstitutionTypes] = useState<{value:number,label:string,name:string}[]>([])
    const [selectedInstitution, setSelectedInstitution] = useState<{value:number,label:string,name:string} | null>(null)
    const [schoolClasses, setSchoolClasses] = useState<{value:number,label:string}[]>([])
    const [selectedSchoolClass, setSelectedSchoolClass] = useState<{value:number,label:string} | null>(null)
    const [selectedSchoolClasses, setSelectedSchoolClasses] = useState<Array<{value:number,label:string}>>([])
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null)
    const quillRef = useRef<Quill | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [attachments, setAttachments] = useState<Array<{ id:number, url:string, name:string, type:string }>>([])
    try { (Quill as any).register({ 'modules/better-table': QuillBetterTable }, true) } catch {}

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
        ['link', 'image', 'video'],
        ['table'],
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
            const groupsResponse = await http.get('/api/categories/groups');
            const groupsOptions = groupsResponse.data.map((group: Group) => ({ value: group.id, label: group.display_name }));
            setGroups(groupsOptions);

            const topCategoriesResponse = await http.get('/api/categories/top-categories');
            const topCategoriesOptions = topCategoriesResponse.data.map((category: TopCategory) => ({ value: category.id, label: category.name }));
            setTopCategories(topCategoriesOptions);

            const instResp = await http.get('/api/categories/institution-types')
            setInstitutionTypes(instResp.data.map((i:any)=>({ value:i.id, label:i.name, name:i.name })))

            const citiesResponse = await http.get('/api/categories/cities');
            setCities(citiesResponse.data.map((c:any)=>({value:c.id,label:c.name})))

            const yearsResponse = await http.get('/api/categories/admission-years')
            const years = yearsResponse.data.map((y:any)=>({value:y.id,label:String(y.year)}))
            setAdmissionYears(years.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))

            const specsResponse = await http.get('/api/categories/specialities')
            const specs = specsResponse.data.map((s:any)=>({value:s.id,label:`${s.code} ${s.name}`, institution_type_id: s.institution_type_id}))
            setSpecialities(specs.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))

            const formsResponse = await http.get('/api/categories/education-forms')
            const forms = formsResponse.data.map((f:any)=>({value:f.id,label:f.name}))
            setEducationForms(forms.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))

            setCourseOptions([])
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setError('Не удалось загрузить категории');
        }
    };

    useEffect(() => {
        const run = async () => {
            if (!selectedInstitution) return
            try {
                const instId = selectedInstitution.value
                const specsResponse = await http.get('/api/categories/specialities', { params: { institution_type_id: instId } })
                const specs = specsResponse.data.map((s:any)=>({value:s.id,label:`${s.code} ${s.name}`, institution_type_id: s.institution_type_id}))
                setSpecialities(specs.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))
                const formsResponse = await http.get('/api/categories/education-forms', { params: { institution_type_id: instId } })
                const forms = formsResponse.data.map((f:any)=>({value:f.id,label:f.name}))
                setEducationForms(forms.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))
                const yearsResponse = await http.get('/api/categories/admission-years', { params: { institution_type_id: instId } })
                const years = yearsResponse.data.map((y:any)=>({value:y.id,label:String(y.year)}))
                setAdmissionYears(years.filter((v:any, i:number, a:any[]) => a.findIndex(x=>x.value===v.value)===i))
                const classesResponse = await http.get('/api/categories/school-classes', { params: { institution_type_id: instId } })
                setSchoolClasses(classesResponse.data.map((cl:any)=>({ value:cl.id, label:cl.name })))
                setSelectedSchoolClass(null)
                setSelectedSchoolClasses([])
                if (selectedInstitution.name.toLowerCase()==='школа') {
                    setFormData(prev=> ({...prev, publish_scope: { ...(prev.publish_scope||{}), course: undefined }}))
                }
                // Courses by institution type (college 3, university 4)
                try {
                    const cr = await http.get('/api/categories/courses', { params: { institution_type_id: instId } })
                    setCourseOptions((cr.data as number[]).map((n:number)=>({ value:n, label:String(n) })))
                } catch {}
            } catch {}
        }
        run()
    }, [selectedInstitution])

    const fetchArticle = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await http.get(`/api/articles/${id}`);
            const article = response.data;
            setFormData({ title: article.title, content: article.content, is_published: article.is_published, is_for_staff: article.is_for_staff, is_actual: article.is_actual, category_ids: article.categories.map((cat: Category) => cat.id) });
            if (article.tag === 'study' || article.tag === 'group') setInfoTag(article.tag)
            if (quillRef.current) quillRef.current.setText('')
            if (quillRef.current && article.content) {
                quillRef.current.setText('')
                quillRef.current.clipboard.dangerouslyPasteHTML(article.content)
            }
            const selectedGroupIds = article.categories.filter((cat: Category) => cat.group).map((cat: Category) => cat.group!.id);
            const selectedGroupOptions = groups.filter(group => selectedGroupIds.includes(group.value));
            setSelectedGroups(selectedGroupOptions);
            const selectedTopCategoryIds = article.categories.filter((cat: Category) => cat.top_category).map((cat: Category) => cat.top_category!.id);
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
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) { setError('Название поста обязательно'); return; }
        const html = quillRef.current?.root.innerHTML ?? formData.content
        if (!html || html === '<p><br></p>') { setError('Содержание поста обязательно'); return; }
        const ps = formData.publish_scope || {}
        // Валидация обязательных шагов
        if (!selectedInstitution) { setError('Выберите тип учреждения'); return }
        const instName = selectedInstitution.name?.toLowerCase()
        if (instName === 'школа') {
            if (!selectedSchoolClasses.length) { setError('Выберите класс'); return }
            if (!selectedCities.length) { setError('Выберите город'); return }
        } else if (instName === 'колледж') {
            if (!selectedCities.length) { setError('Выберите город'); return }
            if (!selectedCourses.length) { setError('Выберите курс'); return }
        } else if (instName === 'вуз') {
            if (!selectedCourses.length) { setError('Выберите курс'); return }
            if (!selectedCities.length) { setError('Выберите город'); return }
        }
        try {
            setSaving(true);
            setError(null);
            const categoryIds = [ ...selectedGroups.map(group => group.value) ];
            const augmentedScope = { ...(formData.publish_scope||{}) }
            // Пошаговый режим без радиокнопок: derive из выбранных полей
            augmentedScope.publish_for_all = false
            // массивы от шага
            if (selectedCities?.length) augmentedScope.city_ids = selectedCities.map(o=>o.value)
            if (selectedCourses?.length) augmentedScope.courses = selectedCourses.map(o=>o.value)
            if (selectedSchoolClasses?.length) augmentedScope.school_class_ids = selectedSchoolClasses.map(o=>o.value)
            if (audienceRules.length > 0) {
                augmentedScope.rules = audienceRules.map((r:any)=>({
                    institution_type_ids: (r.institution_type_ids||[]).map((o:any)=>o.value),
                    education_form_ids: (r.education_form_ids||[]).map((o:any)=>o.value),
                    speciality_ids: (r.speciality_ids||[]).map((o:any)=>o.value),
                    city_ids: (r.city_ids||[]).map((o:any)=>o.value),
                    admission_year_ids: (r.admission_year_ids||[]).map((o:any)=>o.value),
                    course: r.course?.value ?? r.course ?? undefined,
                    school_class_id: r.school_class_id?.value ?? undefined,
                }))
            }
            if (selectedInstitution) augmentedScope.institution_type_id = selectedInstitution.value
            // единичный school_class больше не используем — работаем через массив
            if (selectedSchoolClass) delete (augmentedScope as any).school_class_id
            const postData = { ...formData, tag: infoTag, content: html, category_ids: categoryIds, publish_scope: augmentedScope };
            if (isEditing) await http.put(`/articles/${id}`, postData); else await http.post('/articles', postData);
            navigate('/admin/posts');
        } catch (error: any) {
            console.error('Failed to save post:', error);
            setError(error.response?.data?.error || 'Не удалось сохранить пост');
        } finally { setSaving(false); }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        for (const file of files) {
            const isImage = /image\/(png|jpeg|jpg|webp)/.test(file.type)
            const toUpload = isImage ? await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1920 }) : file
            const form = new FormData()
            form.append('file', toUpload)
            try {
                const res = await http.post('/api/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('jwt_token')||''}` } })
                const id = res.data.id
                const url = `/api/media/${id}`
                setAttachments(prev => [...prev, { id, url, name: res.data.file_name, type: res.data.media_type }])
                const q = quillRef.current
                if (q && res.data.media_type === 'image') {
                    const range = q.getSelection(true)
                    q.insertEmbed(range ? range.index : q.getLength(), 'image', url, 'user')
                } else if (q && res.data.media_type === 'file') {
                    const range = q.getSelection(true)
                    q.insertText(range ? range.index : q.getLength(), `\n[Файл: ${res.data.file_name}](${url})\n`)
                }
            } catch(e) { console.error(e) }
        }
        e.currentTarget.value = ''
    }

    function handleOpenFileDialog() {
        fileInputRef.current?.click()
    }

    function handleInsertCallout() {
        const q = quillRef.current
        if (!q) return
        const range = q.getSelection(true)
        const html = `<div style="border-left:4px solid #3b82f6;background:#f0f7ff;padding:12px;border-radius:6px;">`+
                     `<strong style="color:#1e40af;display:block;margin-bottom:6px;">Заметка</strong>`+
                     `<p style="margin:0;">Текст заметки...</p>`+
                     `</div><p><br/></p>`
        q.clipboard.dangerouslyPasteHTML(range ? range.index : q.getLength(), html)
    }

    function handleInsertTable() {
        const q = quillRef.current
        if (!q) return
        const range = q.getSelection(true)
        const html = `<table style="width:100%;border-collapse:collapse;margin:8px 0;">`+
                     `<thead><tr>`+
                     `<th style="border:1px solid #ddd;padding:6px;background:#f9fafb;">Колонка 1</th>`+
                     `<th style="border:1px solid #ddd;padding:6px;background:#f9fafb;">Колонка 2</th>`+
                     `</tr></thead>`+
                     `<tbody>`+
                     `<tr><td style="border:1px solid #ddd;padding:6px;">Ячейка</td><td style="border:1px solid #ddd;padding:6px;">Ячейка</td></tr>`+
                     `</tbody></table><p><br/></p>`
        q.clipboard.dangerouslyPasteHTML(range ? range.index : q.getLength(), html)
    }

    const handleBack = () => { navigate('/admin/posts'); };

    useEffect(() => {
        if (!editorRef.current || quillRef.current) return
        const q = new Quill(editorRef.current, {
            theme: 'snow',
            placeholder: 'Перетащите файлы в это поле или используйте кнопку загрузки',
            modules: {
                toolbar: {
                    container: TOOLBAR,
                    handlers: {
                        table: () => {
                            const mod = (q as any).getModule('better-table')
                            if (mod && typeof mod.insertTable === 'function') mod.insertTable(2, 2)
                        }
                    }
                },
                clipboard: { matchVisual: false },
                'better-table': {
                    operationMenu: true,
                    color: {
                        row: '#f9fafb',
                        column: '#f9fafb'
                    }
                },
                keyboard: { bindings: (QuillBetterTable as any)?.keyboardBindings || {} }
            }
        })
        quillRef.current = q
        q.on('text-change', () => { setFormData(prev => ({ ...prev, content: q.root.innerHTML })) })
        const onPaste = (e: ClipboardEvent) => {
            const text = e.clipboardData?.getData('text/plain')?.trim()
            if (!text) return
            const yt = toYouTubeEmbed(text)
            if (yt) {
                e.preventDefault()
                const range = q.getSelection(true)
                q.insertEmbed(range ? range.index : q.getLength(), 'video', yt, 'user')
                return
            }
            const vk = toVkEmbed(text)
            if (vk) {
                e.preventDefault()
                const range = q.getSelection(true)
                const html = `<p></p><iframe src="${vk}" style="width:100%;height:420px;border:0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="VK Video"></iframe><p></p>`
                q.clipboard.dangerouslyPasteHTML(range ? range.index : q.getLength(), html)
                return
            }
            if (isPdfUrl(text)) {
                e.preventDefault()
                const range = q.getSelection(true)
                const html = `<p></p><iframe src="${text}" style="width:100%;height:600px;border:0" title="PDF"></iframe><p></p>`
                q.clipboard.dangerouslyPasteHTML(range ? range.index : q.getLength(), html)
                return
            }
        }
        q.root.addEventListener('paste', onPaste)
        return () => { q.root.removeEventListener('paste', onPaste); quillRef.current = null }
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
                    <span onClick={handleBack} style={{ display: 'inline-flex', alignItems: 'center', gap: "5px", cursor: 'pointer' }}>
                        <ArrowIcon width='13px' height='11px' />
                        <p>Назад к управлению постами</p>
                    </span>
                    <h2>{isEditing ? 'Редактировать пост' : 'Создать новый пост'}</h2>
                    <div style={{ display:'flex', gap:8, marginLeft:'auto', alignItems:'center', flexWrap:'wrap' }}>
                        <input ref={fileInputRef} type='file' multiple onChange={handleFileInput} accept='image/*,application/pdf,video/*,.pdf,.doc,.docx,.txt,.md,.markdown,.rtf,.fb2,.odt,.ods,.ppt,.pptx,.xls,.xlsx' style={{ display:'none' }} />
                        <Button width='auto' backgroundColor='#eee' theme={ThemeButton.CLEAR} onClick={handleOpenFileDialog}><span><UploadIcon fontSize='small' />&nbsp;Загрузить</span></Button>
                        <small style={{opacity:.7}}>Допустимые файлы: изображения (PNG/JPG/WEBP), PDF, видео, документы (DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, MD, RTF, FB2, ODT, ODS)</small>
                        <Button width='auto' backgroundColor='#eef2ff' theme={ThemeButton.CLEAR} onClick={handleInsertCallout}><span><InfoOutlinedIcon fontSize='small'/>&nbsp;Callout</span></Button>
                        {/* Временное отключение создания таблиц до исправления */}
                        {/* <Button width='auto' backgroundColor='#eff6ff' theme={ThemeButton.CLEAR} onClick={handleInsertTable}><span><TableChartOutlinedIcon fontSize='small'/>&nbsp;Таблица</span></Button> */}
                    </div>
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
                    <Input type="text" placeholder="Введите название поста" label={<p>Название поста *</p>} value={formData.title} onChange={(value) => handleInputChange('title', value)} />

                    {/* Content with DnD */}
                    <div onDragOver={(e)=>{ e.preventDefault(); }} onDrop={async (e)=>{
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files || [])
                        for (const file of files) {
                            const isImage = /image\/(png|jpeg|jpg|webp)/.test(file.type)
                            const toUpload = isImage ? await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1920 }) : file
                            const form = new FormData()
                            form.append('file', toUpload)
                            try {
                                const res = await http.post('/api/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('jwt_token')||''}` } })
                                const id = res.data.id
                                const url = `/api/media/${id}`
                                setAttachments(prev => [...prev, { id, url, name: res.data.file_name, type: res.data.media_type }])
                                const q = quillRef.current
                                if (q && res.data.media_type === 'image') {
                                    const range = q.getSelection(true)
                                    q.insertEmbed(range ? range.index : q.getLength(), 'image', url, 'user')
                                } else if (q && res.data.media_type === 'file') {
                                    const range = q.getSelection(true)
                                    q.insertText(range ? range.index : q.getLength(), `\n[Файл: ${res.data.file_name}](${url})\n`)
                                }
                            } catch(e) { console.error(e) }
                        }
                    }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Содержание поста *</label>
                        <div style={{ border: '1px solid #ddd', borderRadius: 6 }}>
                            <div ref={editorRef} style={{ minHeight: 280 }} />
                        </div>
                        {attachments.length > 0 && (
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:12, marginTop:12 }}>
                            {attachments.map(att => (
                              <div key={att.id} style={{ border:'1px solid #eee', borderRadius:8, padding:8 }}>
                                {att.type==='image' ? (
                                  <img src={att.url} alt={att.name} style={{ width:'100%', height:100, objectFit:'cover', borderRadius:6 }} />
                                ) : (
                                  <a href={att.url} target='_blank' rel='noreferrer'>{att.name}</a>
                                )}
                                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                                  <IconButton size='small' onClick={()=> setAttachments(prev => prev.filter(x=>x.id!==att.id))}><DeleteIcon fontSize='small' /></IconButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Тип информации (метка) */}
                    <div>
                        <label style={{ display:'block', marginBottom:6, fontWeight:500 }}>Тип информации (отображение)</label>
                        <RadioGroup row value={infoTag} onChange={(e)=> setInfoTag((e.target as HTMLInputElement).value as any)}>
                            <FormControlLabel value="group" control={<Radio/>} label="Общая для группы" />
                            <FormControlLabel value="study" control={<Radio/>} label="Учебная" />
                        </RadioGroup>
                    </div>

                    {/* Тип учреждения */}
                    <div>
                        <Autocomplete
                          options={institutionTypes}
                          ListboxComponent={VirtualListbox as any}
                          value={selectedInstitution}
                          onChange={(_, v:any)=> setSelectedInstitution(v)}
                          isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value}
                          getOptionLabel={(o)=>o?.label ?? ''}
                          renderInput={(p)=>(<TextField {...p} label='Тип учреждения' placeholder='Школа / Колледж / Вуз' size='small'/>)}
                        />
                    </div>

                    {/* Чекбоксы общие */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_published} onChange={(e) => handleInputChange('is_published', e.target.checked)} />
                            <span>Опубликовать сразу</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_for_staff} onChange={(e) => handleInputChange('is_for_staff', e.target.checked)} />
                            <span>Только для сотрудников</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.is_actual} onChange={(e) => handleInputChange('is_actual', e.target.checked)} />
                            <span>Актуальный</span>
                        </label>
                    </div>

                    {/* Аудитория: пошаговый выбор */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>Аудитория (обязательные шаги)</AccordionSummary>
                        <AccordionDetails>
                            <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                                {selectedInstitution?.name?.toLowerCase()==='школа' && (
                                  <>
                                    <Autocomplete multiple options={schoolClasses} ListboxComponent={VirtualListbox as any} value={selectedSchoolClasses} onChange={(_, v)=> setSelectedSchoolClasses(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Класс *' placeholder='Выберите один или несколько классов' size='small'/>)}/>
                                    <Autocomplete multiple options={cities} ListboxComponent={VirtualListbox as any} value={selectedCities} onChange={(_, v)=> setSelectedCities(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Город *' placeholder='Выберите один или несколько городов' size='small'/>)}/>
                                  </>
                                )}
                                {selectedInstitution?.name?.toLowerCase()==='колледж' && (
                                  <>
                                    <Autocomplete multiple options={cities} ListboxComponent={VirtualListbox as any} value={selectedCities} onChange={(_, v)=> setSelectedCities(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Город *' placeholder='Выберите один или несколько городов' size='small'/>)}/>
                                    <Autocomplete multiple options={courseOptions} ListboxComponent={VirtualListbox as any} value={selectedCourses} onChange={(_, v)=> setSelectedCourses(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Курс *' placeholder='1, 2, 3' size='small'/>)}/>
                                  </>
                                )}
                                {selectedInstitution?.name?.toLowerCase()==='вуз' && (
                                  <>
                                    <Autocomplete multiple options={courseOptions} ListboxComponent={VirtualListbox as any} value={selectedCourses} onChange={(_, v)=> setSelectedCourses(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Курс *' placeholder='1, 2, 3, 4' size='small'/>)}/>
                                    <Autocomplete multiple options={cities} ListboxComponent={VirtualListbox as any} value={selectedCities} onChange={(_, v)=> setSelectedCities(v as any)} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label ?? ''} renderInput={(p)=>(<TextField {...p} label='Город *' placeholder='Выберите один или несколько городов' size='small'/>)}/>
                                  </>
                                )}

                                {/* Дополнительные необязательные фильтры */}
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                  <Autocomplete multiple options={cities} value={(formData.publish_scope as any)?.city_ids?.map((id:number)=> cities.find(c=>c.value===id)).filter(Boolean) || []} onChange={(_,v)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, city_ids: v.map((o:any)=>o.value), city_id: undefined }}))} ListboxComponent={VirtualListbox as any} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label??''} renderInput={(p)=>(<TextField {...p} label='Города (множественный выбор)' placeholder='Начните вводить город' size='small'/>)}/>
                                  <Autocomplete multiple options={educationForms} value={(formData.publish_scope as any)?.education_form_ids?.map((id:number)=> educationForms.find(f=>f.value===id)).filter(Boolean) || []} onChange={(_,v)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, education_form_ids: v.map((o:any)=>o.value), education_form_id: undefined }}))} ListboxComponent={VirtualListbox as any} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label??''} renderInput={(p)=>(<TextField {...p} label='Формы обучения (мульти)' placeholder='Очная, Заочная…' size='small'/>)}/>
                                  <Autocomplete multiple options={specialities} value={(formData.publish_scope as any)?.speciality_ids?.map((id:number)=> specialities.find(s=>s.value===id)).filter(Boolean) || []} onChange={(_,v)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, speciality_ids: v.map((o:any)=>o.value), speciality_id: undefined }}))} ListboxComponent={VirtualListbox as any} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label??''} renderInput={(p)=>(<TextField {...p} label='Специальности (мульти)' placeholder='Начните вводить код/название' size='small'/>)}/>
                                  <Autocomplete multiple options={admissionYears} value={(formData.publish_scope as any)?.admission_year_ids?.map((id:number)=> admissionYears.find(y=>y.value===id)).filter(Boolean) || []} onChange={(_,v)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, admission_year_ids: v.map((o:any)=>o.value), admission_year_id: undefined }}))} ListboxComponent={VirtualListbox as any} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label??''} renderInput={(p)=>(<TextField {...p} label='Годы поступления (мульти)' placeholder='Выберите годы' size='small'/>)}/>
                                  <Autocomplete multiple options={courseOptions} value={(formData.publish_scope as any)?.courses?.map((n:number)=> courseOptions.find(c=>c.value===n)).filter(Boolean) || []} onChange={(_,v)=> setFormData(prev=> ({...prev, publish_scope:{...prev.publish_scope, courses: v.map((o:any)=>o.value), course: undefined }}))} ListboxComponent={VirtualListbox as any} isOptionEqualToValue={(o:any,v:any)=>o?.value===v?.value} getOptionLabel={(o)=>o?.label??''} renderInput={(p)=>(<TextField {...p} label='Курсы (мульти)' placeholder='1, 2, 3…' size='small'/>)}/>
                                </div>
                            </div>
                        </AccordionDetails>
                    </Accordion>

                    {/* Groups moved to bottom */}
                    <div>
                        <InputSelect placeholder="Выберите группы (не обязательно)" label={<p>Группы (не обязательно)</p>} options={groups} value={selectedGroups} onChange={(options) => setSelectedGroups(options || [])} isMulti={true} />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button onClick={handleBack} width='120px' backgroundColor='#666' theme={ThemeButton.CLEAR}><span>Отмена</span></Button>
                        <Button onClick={handleSubmit} width='180px' backgroundColor='#00AAFF' theme={ThemeButton.ARROW} disabled={saving}><span><SaveIcon width='13px' height='13px' /><p>{saving ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}</p></span></Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}

