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
    filter_path: Record<string, string>;
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

    // Игнорирование ошибки расширений браузера
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args: any[]) => {
            if (typeof args[0] === 'string' && args[0].includes('The message port closed before a response was received')) {
                return;
            }
            originalError.apply(console, args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    // Загрузка дерева фильтров
    useEffect(() => {
        const fetchFilterTree = async () => {
            try {
                setIsLoading(true);
                const response = await http.get('/api/filters/tree');
                console.log('Filter tree response:', response.data);

                if (response.data.success) {
                    setFilterTree(response.data.data);
                } else {
                    setError('Не удалось загрузить структуру фильтров: ' + (response.data.error || 'Unknown error'));
                }
            } catch (error: any) {
                console.error('Error fetching filter tree:', error);
                setError('Не удалось загрузить структуру фильтров: ' + (error.message || 'Network error'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilterTree();
    }, []);

    // Загрузка статей при изменении фильтров
    useEffect(() => {
        const fetchArticles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                Object.entries(selectedFilters).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });

                console.log('Fetching articles with params:', params.toString());

                const response = await http.get(`/api/filters/articles?${params.toString()}`);
                console.log('Articles response:', response.data);

                if (response.data.success) {
                    setArticles(response.data.data || []);
                } else {
                    setError('Ошибка при загрузке статей: ' + (response.data.error || 'Unknown error'));
                    setArticles([]);
                }
            } catch (error: any) {
                console.error('Error fetching articles:', error);
                setError('Не удалось загрузить статьи: ' + (error.response?.data?.error || error.message || 'Network error'));
                setArticles([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Добавляем задержку чтобы избежать множественных запросов при быстром изменении фильтров
        const timeoutId = setTimeout(fetchArticles, 300);
        return () => clearTimeout(timeoutId);
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
            const newFilters = { ...prev, [filterType]: value || '' };

            // Сбрасываем зависимые фильтры
            const filterHierarchy: Record<string, (keyof FilterPath)[]> = {
                institution_type: ['city', 'program', 'course', 'form'],
                city: ['program', 'course', 'form'],
                program: ['course', 'form'],
                course: ['form'],
                form: []
            };

            if (filterHierarchy[filterType]) {
                filterHierarchy[filterType].forEach(dependentFilter => {
                    delete newFilters[dependentFilter];
                });
            }

            return newFilters;
        });
    };

    const getFilterOptions = (filterType: keyof FilterPath) => {
        if (!filterTree) return [];

        try {
            switch (filterType) {
                case 'institution_type':
                    return Object.entries(filterTree).map(([key, value]) => ({
                        value: key,
                        label: value.display_name || key
                    }));

                case 'city':
                    if (!selectedFilters.institution_type) return [];
                    const instType = filterTree[selectedFilters.institution_type];
                    if (!instType?.city) return [];
                    return Object.entries(instType.city).map(([key, value]) => ({
                        value: key,
                        label: value.display_name || key
                    }));

                case 'program':
                    if (!selectedFilters.institution_type) return [];
                    const instType2 = filterTree[selectedFilters.institution_type];
                    if (!instType2?.study_info) return [];
                    return Object.entries(instType2.study_info).map(([key]) => ({
                        value: key,
                        label: getProgramDisplayName(key)
                    }));

                case 'course':
                    if (!selectedFilters.institution_type || !selectedFilters.program) return [];
                    const instType3 = filterTree[selectedFilters.institution_type];
                    const program = instType3?.study_info?.[selectedFilters.program];
                    if (!program) return [];
                    return Object.entries(program).map(([key]) => ({
                        value: key,
                        label: getCourseDisplayName(key)
                    }));

                case 'form':
                    if (!selectedFilters.institution_type || !selectedFilters.program || !selectedFilters.course) return [];
                    const instType4 = filterTree[selectedFilters.institution_type];
                    const program2 = instType4?.study_info?.[selectedFilters.program];
                    const course = program2?.[selectedFilters.course];
                    if (!course) return [];
                    return Object.entries(course).map(([key]) => ({
                        value: key,
                        label: getFormDisplayName(key)
                    }));

                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error getting ${filterType} options:`, error);
            return [];
        }
    };

    const getProgramDisplayName = (key: string): string => {
        const names: Record<string, string> = {
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

    const getCourseDisplayName = (key: string): string => {
        const names: Record<string, string> = {
            '1 course': '1 курс',
            '2 course': '2 курс',
            '3 course': '3 курс',
            '4 course': '4 курс'
        };
        return names[key] || key;
    };

    const getFormDisplayName = (key: string): string => {
        const names: Record<string, string> = {
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

    const getActiveFiltersCount = (): number => {
        return Object.values(selectedFilters).filter(value => value && value !== '').length;
    };

    const hasActiveFilters = getActiveFiltersCount() > 0;

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
                    {hasActiveFilters && (
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
                        disabled={isLoading}
                    />

                    {selectedFilters.institution_type && (
                        <InputSelect
                            label="Город"
                            value={selectedFilters.city || ''}
                            onChange={(value) => handleFilterChange('city', value)}
                            options={getFilterOptions('city')}
                            placeholder="Выберите город"
                            disabled={isLoading}
                        />
                    )}

                    {selectedFilters.institution_type && (
                        <InputSelect
                            label="Программа"
                            value={selectedFilters.program || ''}
                            onChange={(value) => handleFilterChange('program', value)}
                            options={getFilterOptions('program')}
                            placeholder="Выберите программу"
                            disabled={isLoading}
                        />
                    )}

                    {selectedFilters.program && (
                        <InputSelect
                            label="Курс"
                            value={selectedFilters.course || ''}
                            onChange={(value) => handleFilterChange('course', value)}
                            options={getFilterOptions('course')}
                            placeholder="Выберите курс"
                            disabled={isLoading}
                        />
                    )}

                    {selectedFilters.course && (
                        <InputSelect
                            label="Форма обучения"
                            value={selectedFilters.form || ''}
                            onChange={(value) => handleFilterChange('form', value)}
                            options={getFilterOptions('form')}
                            placeholder="Выберите форму обучения"
                            disabled={isLoading}
                        />
                    )}
                </div>
            </div>

            {/* Результаты */}
            <div className="filtered-posts__results">
                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

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
                                {hasActiveFilters ? (
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
                                                Просмотров: {article.views_count || 0}
                                            </span>
                                        </div>
                                        {article.filter_path && Object.keys(article.filter_path).length > 0 && (
                                            <div className="article-filters">
                                                {Object.entries(article.filter_path).map(([key, value]) => (
                                                    value && (
                                                        <span key={key} className="filter-tag">
                                                            {key}: {value}
                                                        </span>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Отладочная информация (можно удалить в продакшене) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ display: 'none' }}>
                    <h4>Debug Info:</h4>
                    <pre>Filter Tree: {JSON.stringify(filterTree, null, 2)}</pre>
                    <pre>Selected Filters: {JSON.stringify(selectedFilters, null, 2)}</pre>
                    <pre>Articles count: {articles.length}</pre>
                </div>
            )}
        </div>
    );
}
