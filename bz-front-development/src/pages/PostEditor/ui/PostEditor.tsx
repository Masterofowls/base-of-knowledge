import React, { useState, useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'shared/ui/Button';
import { Input } from 'shared/ui/Input/Input';
import { InputSelect } from 'shared/ui/InputSelect/InputSelect';
import Alert from '@mui/material/Alert';
import http from 'shared/api/http';
// style import disabled in server build if missing

// Новые интерфейсы для иерархической системы фильтров
interface FilterTree {
    [key: string]: {
        display_name: string;
        general: { id: number; display_name: string };
        city: { [key: string]: { id: number; display_name: string } };
        study_info: {
            [key: string]: {
                [key: string]: {
                    [key: string]: {
                        [key: string]: { id: number; display_name: string }
                    }
                }
            }
        };
    };
}

interface FilterPath {
    institution_type?: string;
    city?: string;
    program?: string;
    course?: string;
    form?: string;
}

interface PostFormData {
    title: string;
    content: string;
    is_published: boolean;
    is_for_staff: boolean;
    is_actual: boolean;
    category_ids: number[];
    filter_path: FilterPath;
    filter_tree_id?: number;
}

function toYouTubeEmbed(url: string): string | null {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
        return `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe></div>`;
    }
    return null;
}

function isPdfUrl(url: string): boolean {
    return url.toLowerCase().includes('.pdf');
}

function toVkEmbed(url: string): string | null {
    const vkRegex = /vk\.com\/([^\/\s]+)/;
    const match = url.match(vkRegex);
    if (match) {
        return `<div class="vk-embed"><iframe src="https://vk.com/video_ext.php?${match[1]}" width="640" height="360" frameborder="0" allowfullscreen></iframe></div>`;
    }
    return null;
}

export default function PostEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Новые состояния для фильтров
    const [filterTree, setFilterTree] = useState<FilterTree | null>(null);
    const [selectedFilters, setSelectedFilters] = useState<FilterPath>({});

    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        content: '',
        is_published: false,
        is_for_staff: false,
        is_actual: false,
        category_ids: [],
        filter_path: {}
    });

    const quillContainerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    // Initialize Quill editor once
    useEffect(() => {
        if (!quillContainerRef.current || quillRef.current) return;
        const q = new Quill(quillContainerRef.current, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
        quillRef.current = q;
        if (formData.content) {
            q.root.innerHTML = formData.content;
        }
        q.on('text-change', () => {
            const html = q.root.innerHTML;
            handleInputChange('content', html);
        });
    }, [formData.content]);

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        try {
            const pastedText = event.clipboardData.getData('text');
            if (!pastedText) return;
            const yt = toYouTubeEmbed(pastedText);
            const vk = toVkEmbed(pastedText);
            const isPdf = isPdfUrl(pastedText);
            if (yt || vk || isPdf) {
                event.preventDefault();
                const html = yt || vk || (isPdf ? `<a href="${pastedText}" target="_blank" rel="noopener noreferrer">${pastedText}</a>` : pastedText);
                const q = quillRef.current;
                if (q) {
                    const range = q.getSelection(true);
                    const index = range ? range.index : q.getLength();
                    q.clipboard.dangerouslyPasteHTML(index, html);
                }
            }
        } catch (e) {
            // no-op: fallback to default paste
        }
    };

    // Загрузка дерева фильтров
    useEffect(() => {
        const fetchFilterTree = async () => {
            try {
                const response = await http.get('/api/filters/tree');
                if (response.data.success) {
                    setFilterTree(response.data.data);
                }
        } catch (error) {
                console.error('Error fetching filter tree:', error);
        }
    };

        fetchFilterTree();
    }, []);

    const handleInputChange = (field: keyof PostFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFilterChange = (filterType: keyof FilterPath, value: string) => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev, [filterType]: value };

            // Сбрасываем зависимые фильтры
            if (filterType === 'institution_type') {
                delete newFilters.city;
                delete newFilters.program;
                delete newFilters.course;
                delete newFilters.form;
            } else if (filterType === 'city') {
                delete newFilters.program;
                delete newFilters.course;
                delete newFilters.form;
            } else if (filterType === 'program') {
                delete newFilters.course;
                delete newFilters.form;
            } else if (filterType === 'course') {
                delete newFilters.form;
            }

            return newFilters;
        });
    };

    const getFilterOptions = (filterType: keyof FilterPath) => {
        if (!filterTree) return [];

        switch (filterType) {
            case 'institution_type':
                return Object.entries(filterTree).map(([key, value]) => ({
                    value: key,
                    label: value.display_name
                }));

            case 'city':
                if (!selectedFilters.institution_type) return [];
                const instType = filterTree[selectedFilters.institution_type];
                return Object.entries(instType.city).map(([key, value]) => ({
                    value: key,
                    label: value.display_name
                }));

            case 'program':
                if (!selectedFilters.institution_type) return [];
                const instType2 = filterTree[selectedFilters.institution_type];
                return Object.entries(instType2.study_info).map(([key, value]) => ({
                    value: key,
                    label: key === 'programming' ? 'Программирование' :
                           key === 'sys_adm' ? 'Системное администрирование' :
                           key === 'design' ? 'Дизайн' :
                           key === 'commercial' ? 'Реклама' :
                           key === 'web_design' ? 'Веб-дизайн' :
                           key === 'gamedev' ? 'Разработка игр' :
                           key === 'ai' ? 'Искусственный интеллект' :
                           key === '3d' ? '3D моделирование' :
                           key === 'cybersport' ? 'Киберспорт' :
                           key === 'info_sec' ? 'Информационная безопасность' :
                           key === 'tech' ? 'Технологии' : key
                }));

            case 'course':
                if (!selectedFilters.institution_type || !selectedFilters.program) return [];
                const instType3 = filterTree[selectedFilters.institution_type];
                const program = instType3.study_info[selectedFilters.program];
                return Object.entries(program).map(([key, value]) => ({
                    value: key,
                    label: key === '1 course' ? '1 курс' :
                           key === '2 course' ? '2 курс' :
                           key === '3 course' ? '3 курс' :
                           key === '4 course' ? '4 курс' : key
                }));

            case 'form':
                if (!selectedFilters.institution_type || !selectedFilters.program || !selectedFilters.course) return [];
                const instType4 = filterTree[selectedFilters.institution_type];
                const program2 = instType4.study_info[selectedFilters.program];
                const course = program2[selectedFilters.course];
                return Object.entries(course).map(([key, value]) => ({
                    value: key,
                    label: key === 'full_time' ? 'Очная' :
                           key === 'remote' ? 'Заочная' :
                           key === 'dist' ? 'Дистанционная' :
                           key === 'blended' ? 'Смешанная' : key
                }));

            default:
                return [];
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Пожалуйста, заполните заголовок и содержимое');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Build publish_scope: prefer city_key to let backend resolve real city_id, else publish_for_all
            let publish_scope: any = {};
            if (selectedFilters.city) {
                publish_scope.city_key = selectedFilters.city;
            } else {
                publish_scope.publish_for_all = true;
            }

            const postData = {
                ...formData,
                publish_scope
            };

            if (id) {
                // Обновление существующего поста
                await http.put(`/api/articles/${id}`, postData);
                setSuccess('Пост успешно обновлен');
            } else {
                // Создание нового поста
                await http.post('/api/articles/', postData);
                setSuccess('Пост успешно создан');
            }

            // Перенаправляем на список постов
            setTimeout(() => {
                navigate('/admin/posts');
            }, 1500);

        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Произошла ошибка при сохранении поста';
            const details = error?.response?.data?.details;
            setError(details ? `${msg}: ${details}` : msg);
            try { console.error('Create article failed:', error?.response?.data || error?.message || error); } catch (_) {}
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => { navigate('/admin/posts'); };

        return (
        <div className="post-editor">
            <div className="post-editor__header">
                <Button onClick={handleBack} variant="outlined">
                    ← Назад
                </Button>
                <h1>{id ? 'Редактировать пост' : 'Создать новый пост'}</h1>
            </div>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

            <div className="post-editor__form">
                <div className="form-group">
                    <label>Заголовок</label>
                    <Input
                        value={formData.title}
                        onChange={(value) => handleInputChange('title', value)}
                        placeholder="Введите заголовок поста"
                    />
                </div>

                {/* Новая система фильтров */}
                <div className="form-group">
                    <label>Фильтры публикации</label>
                    <div className="filter-controls">
                        <InputSelect
                            label="Тип учреждения"
                            value={selectedFilters.institution_type || ''}
                            onChange={(value) => handleFilterChange('institution_type', value)}
                            options={getFilterOptions('institution_type')}
                            placeholder="Выберите тип учреждения"
                        />

                        {selectedFilters.institution_type && (
                            <InputSelect
                                label="Город"
                                value={selectedFilters.city || ''}
                                onChange={(value) => handleFilterChange('city', value)}
                                options={getFilterOptions('city')}
                                placeholder="Выберите город"
                            />
                        )}

                        {selectedFilters.institution_type && (
                            <InputSelect
                                label="Программа"
                                value={selectedFilters.program || ''}
                                onChange={(value) => handleFilterChange('program', value)}
                                options={getFilterOptions('program')}
                                placeholder="Выберите программу"
                            />
                        )}

                        {selectedFilters.program && (
                            <InputSelect
                                label="Курс"
                                value={selectedFilters.course || ''}
                                onChange={(value) => handleFilterChange('course', value)}
                                options={getFilterOptions('course')}
                                placeholder="Выберите курс"
                            />
                        )}

                        {selectedFilters.course && (
                            <InputSelect
                                label="Форма обучения"
                                value={selectedFilters.form || ''}
                                onChange={(value) => handleFilterChange('form', value)}
                                options={getFilterOptions('form')}
                                placeholder="Выберите форму обучения"
                            />
                        )}
                    </div>
                    </div>

                <div className="form-group">
                    <label>Содержимое</label>
                    <div ref={quillContainerRef} className="content-editor" onPaste={handlePaste as any} />
                </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => handleInputChange('is_published', e.target.checked)}
                        />
                        Опубликовать сразу
                        </label>
                    </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.is_for_staff}
                            onChange={(e) => handleInputChange('is_for_staff', e.target.checked)}
                        />
                        Только для персонала
                    </label>
                            </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.is_actual}
                            onChange={(e) => handleInputChange('is_actual', e.target.checked)}
                        />
                        Актуально
                    </label>
                    </div>

                <div className="form-actions">
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        variant="contained"
                        color="primary"
                    >
                        {isLoading ? 'Сохранение...' : (id ? 'Обновить' : 'Создать')}
                    </Button>
                    </div>
                </div>
        </div>
    );
}

