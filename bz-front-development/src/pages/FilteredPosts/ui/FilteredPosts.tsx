import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { InputSelect } from '@/shared/ui/InputSelect';
import { Alert } from '@/shared/ui/Alert';
import { http } from '@/shared/api/http';
import './FilteredPosts.module.scss';

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

interface Article {
    id: number;
    title: string;
    content: string;
    created_at: string;
    filter_path: any;
    views_count: number;
}

interface FilterPath {
    institution_type?: string;
    city?: string;
    program?: string;
    course?: string;
    form?: string;
}

export default function FilteredPosts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filterTree, setFilterTree] = useState<FilterTree | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Текущие выбранные фильтры
    const [selectedFilters, setSelectedFilters] = useState<FilterPath>({
        institution_type: searchParams.get('institution_type') || '',
        city: searchParams.get('city') || '',
        program: searchParams.get('program') || '',
        course: searchParams.get('course') || '',
        form: searchParams.get('form') || ''
    });

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
                setError('Не удалось загрузить структуру фильтров');
            }
        };

        fetchFilterTree();
    }, []);

    // Загрузка статей при изменении фильтров
    useEffect(() => {
        const fetchArticles = async () => {
            if (!Object.values(selectedFilters).some(Boolean)) {
                setArticles([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                Object.entries(selectedFilters).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });

                const response = await http.get(`/api/filters/articles?${params.toString()}`);
                if (response.data.success) {
                    setArticles(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching articles:', error);
                setError('Не удалось загрузить статьи');
            } finally {
                setIsLoading(false);
            }
        };

        fetchArticles();
    }, [selectedFilters]);

    // Обновление URL при изменении фильтров
    useEffect(() => {
        const params = new URLSearchParams();
        Object.entries(selectedFilters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        setSearchParams(params);
    }, [selectedFilters, setSearchParams]);

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
                    label: getProgramDisplayName(key)
                }));

            case 'course':
                if (!selectedFilters.institution_type || !selectedFilters.program) return [];
                const instType3 = filterTree[selectedFilters.institution_type];
                const program = instType3.study_info[selectedFilters.program];
                return Object.entries(program).map(([key, value]) => ({
                    value: key,
                    label: getCourseDisplayName(key)
                }));

            case 'form':
                if (!selectedFilters.institution_type || !selectedFilters.program || !selectedFilters.course) return [];
                const instType4 = filterTree[selectedFilters.institution_type];
                const program2 = instType4.study_info[selectedFilters.program];
                const course = program2[selectedFilters.course];
                return Object.entries(course).map(([key, value]) => ({
                    value: key,
                    label: getFormDisplayName(key)
                }));

            default:
                return [];
        }
    };

    const getProgramDisplayName = (key: string) => {
        const names: { [key: string]: string } = {
            'programming': 'Программирование',
            'sys_adm': 'Системное администрирование',
            'design': 'Дизайн',
            'commercial': 'Реклама',
            'web_design': 'Веб-дизайн',
            'gamedev': 'Разработка игр',
            'ai': 'Искусственный интеллект',
            '3d': '3D моделирование',
            'cybersport': 'Киберспорт',
            'info_sec': 'Информационная безопасность',
            'tech': 'Технологии'
        };
        return names[key] || key;
    };

    const getCourseDisplayName = (key: string) => {
        const names: { [key: string]: string } = {
            '1 course': '1 курс',
            '2 course': '2 курс',
            '3 course': '3 курс',
            '4 course': '4 курс'
        };
        return names[key] || key;
    };

    const getFormDisplayName = (key: string) => {
        const names: { [key: string]: string } = {
            'full_time': 'Очная',
            'remote': 'Заочная',
            'dist': 'Дистанционная',
            'blended': 'Смешанная'
        };
        return names[key] || key;
    };

    const clearFilters = () => {
        setSelectedFilters({});
    };

    const getActiveFiltersCount = () => {
        return Object.values(selectedFilters).filter(Boolean).length;
    };

    return (
        <div className="filtered-posts">
            <div className="filtered-posts__header">
                <h1>Публикации</h1>
                <p>Выберите фильтры для просмотра релевантных публикаций</p>
            </div>

            {/* Панель фильтров */}
            <div className="filtered-posts__filters">
                <div className="filters-header">
                    <h3>Фильтры</h3>
                    {getActiveFiltersCount() > 0 && (
                        <Button onClick={clearFilters} variant="outlined" size="small">
                            Очистить все
                        </Button>
                    )}
                </div>

                <div className="filters-grid">
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

            {/* Результаты */}
            <div className="filtered-posts__results">
                {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

                {isLoading ? (
                    <div className="loading">Загрузка...</div>
                ) : (
                    <>
                        <div className="results-header">
                            <h3>Результаты</h3>
                            <span className="results-count">
                                Найдено: {articles.length} публикаций
                            </span>
                        </div>

                        {articles.length === 0 ? (
                            <div className="no-results">
                                {getActiveFiltersCount() > 0 ? (
                                    <p>По выбранным фильтрам публикации не найдены</p>
                                ) : (
                                    <p>Выберите фильтры для просмотра публикаций</p>
                                )}
                            </div>
                        ) : (
                            <div className="articles-list">
                                {articles.map((article) => (
                                    <div key={article.id} className="article-card">
                                        <h4 className="article-title">{article.title}</h4>
                                        <div
                                            className="article-content"
                                            dangerouslySetInnerHTML={{
                                                __html: article.content.length > 200
                                                    ? article.content.substring(0, 200) + '...'
                                                    : article.content
                                            }}
                                        />
                                        <div className="article-meta">
                                            <span className="article-date">
                                                {new Date(article.created_at).toLocaleDateString('ru-RU')}
                                            </span>
                                            <span className="article-views">
                                                Просмотров: {article.views_count}
                                            </span>
                                        </div>
                                        <div className="article-filters">
                                            {article.filter_path && Object.entries(article.filter_path).map(([key, value]) => (
                                                <span key={key} className="filter-tag">
                                                    {key}: {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
