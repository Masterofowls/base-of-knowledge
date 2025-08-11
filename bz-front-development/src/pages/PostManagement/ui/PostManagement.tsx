import { classNames } from "shared/lib/classNames/classNames.ts";
import { Container } from "shared/ui/Container/Container.tsx";
import { Button } from "shared/ui/Button";
import { ThemeButton } from "shared/ui/Button/ui/Button.tsx";
import { Input } from "shared/ui/Input/Input.tsx";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import http from "shared/api/http";
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react";
import PlusIcon from "shared/assets/icons/Plus.svg?react";
import PenIcon from "shared/assets/icons/Pen.svg?react";
import PublishIcon from "shared/assets/icons/circle-check-solid.svg?react";

interface Article {
    id: number;
    title: string;
    content: string;
    is_published: boolean;
    is_for_staff: boolean;
    is_actual: boolean;
    created_at: string;
    updated_at: string;
    authors: Array<{
        id: number;
        full_name: string;
        email: string;
    }>;
    categories: Array<{
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
    }>;
}

export default function PostManagement() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyDrafts, setShowOnlyDrafts] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, [showOnlyDrafts, searchTerm]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params: any = {
                per_page: 50,
                page: 1
            };
            
            if (showOnlyDrafts) {
                params.is_published = false;
            }
            
            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            const response = await http.get('/api/articles', { params });
            setArticles(response.data?.articles || []);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
            setError('Не удалось загрузить посты');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishToggle = async (articleId: number, currentStatus: boolean) => {
        try {
            const endpoint = currentStatus ? `/api/articles/${articleId}/unpublish` : `/api/articles/${articleId}/publish`;
            await http.post(endpoint);
            
            // Update local state
            setArticles(prev => prev.map(article => 
                article.id === articleId 
                    ? { ...article, is_published: !currentStatus }
                    : article
            ));
        } catch (error) {
            console.error('Failed to toggle publish status:', error);
            setError('Не удалось изменить статус публикации');
        }
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
            return;
        }

        try {
            await http.delete(`/api/articles/${articleId}`);
            
            // Remove from local state
            setArticles(prev => prev.filter(article => article.id !== articleId));
        } catch (error) {
            console.error('Failed to delete article:', error);
            setError('Не удалось удалить пост');
        }
    };

    const handleBack = () => {
        navigate('/admin');
    };

    const handleCreatePost = () => {
        navigate('/admin/post/create');
    };

    const handleEditPost = (articleId: number) => {
        navigate(`/admin/post/edit/${articleId}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (article: Article) => {
        if (article.is_published) {
            return <span style={{ color: '#92DA63', fontSize: '12px', fontWeight: 'bold' }}>ОПУБЛИКОВАН</span>;
        } else {
            return <span style={{ color: '#E44A77', fontSize: '12px', fontWeight: 'bold' }}>ЧЕРНОВИК</span>;
        }
    };

    if (loading) {
        return (
            <div className={classNames('page-center-wrapper', {}, [])}>
                <Container gap="16px" width='900px' direction="column" paddings='24px'>
                    <p>Загрузка постов...</p>
                </Container>
            </div>
        );
    }

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container gap="16px" width='1000px' direction="column" paddings='24px'>
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
                        <h2>Управление постами</h2>
                    </div>
                    <Button 
                        onClick={handleCreatePost} 
                        width='180px' 
                        backgroundColor='#00AAFF' 
                        theme={ThemeButton.ARROW}
                    >
                        <span><PlusIcon width='13px' height='13px' /><p>Создать пост</p></span>
                    </Button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                    <Input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchTerm}
                        onChange={(value) => setSearchTerm(value)}
                        style={{ width: '300px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showOnlyDrafts}
                            onChange={(e) => setShowOnlyDrafts(e.target.checked)}
                        />
                        <span>Только черновики</span>
                    </label>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ color: '#E44A77', padding: '12px', backgroundColor: '#ffe6ee', borderRadius: '6px', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                {/* Articles List */}
                {articles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <p>Посты не найдены</p>
                        {searchTerm && <p>Попробуйте изменить поисковый запрос</p>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {articles.map((article) => (
                            <div 
                                key={article.id}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    backgroundColor: '#fff',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{article.title}</h3>
                                        {getStatusBadge(article)}
                                    </div>
                                    <p style={{ margin: 0, color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                                        {article.content.length > 150 
                                            ? `${article.content.substring(0, 150)}...` 
                                            : article.content
                                        }
                                    </p>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888' }}>
                                        <span>Создан: {formatDate(article.created_at)}</span>
                                        <span>Обновлен: {formatDate(article.updated_at)}</span>
                                        {article.authors.length > 0 && (
                                            <span>Автор: {article.authors[0].full_name}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Button
                                        onClick={() => handleEditPost(article.id)}
                                        width='100px'
                                        backgroundColor='#7F61DD'
                                        theme={ThemeButton.CLEAR}
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                        <span><PenIcon width='12px' height='12px' /></span>
                                    </Button>
                                    
                                    <Button
                                        onClick={() => handlePublishToggle(article.id, article.is_published)}
                                        width='120px'
                                        backgroundColor={article.is_published ? '#E44A77' : '#92DA63'}
                                        theme={ThemeButton.CLEAR}
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                        <span>
                                            <PublishIcon width='12px' height='12px' />
                                            <p>{article.is_published ? 'Снять' : 'Опубликовать'}</p>
                                        </span>
                                    </Button>
                                    
                                    <Button
                                        onClick={() => handleDeleteArticle(article.id)}
                                        width='100px'
                                        backgroundColor='#ff4444'
                                        theme={ThemeButton.CLEAR}
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
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
