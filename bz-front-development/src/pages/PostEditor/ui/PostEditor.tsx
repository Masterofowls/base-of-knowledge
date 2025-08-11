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
    
    const [loading, setLoading] = useState(false);
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
