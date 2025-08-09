import {classNames} from "shared/lib/classNames/classNames.ts";
import {Input} from "shared/ui/Input/Input.tsx";
import {Container} from "shared/ui/Container/Container.tsx";
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import AdminIcon from "shared/assets/icons/AdminFace.svg?react"
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react"
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import http from 'shared/api/http'

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@test.com')
    const [password, setPassword] = useState('Admin123!')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleBack = () => {
        navigate('/');
    };

    async function handleLogin() {
        if (isLoading) return
        setError(null)
        setIsLoading(true)
        try {
            const response = await http.post('/api/auth/login', {
                email, 
                password
            });
            
            if (response.data?.access_token) {
                localStorage.setItem('jwt_token', response.data.access_token);
                localStorage.setItem('user_role', response.data.user?.role || 'admin');
                navigate('/admin');
            }
        } catch (e: any) {
            if (e.response?.status === 401) {
                setError('Неверные учетные данные');
            } else {
                setError(e.message ?? 'Ошибка входа');
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container footerContentHeight='65px' firstMargin='5px' footer={<span><span onClick={handleBack} style={{display: 'inline-flex', alignItems: 'center', gap: "5px", flexDirection: 'row', cursor: 'pointer'}}><ArrowIcon width='13px' height='11px' /><p>Назад к выбору входа</p></span><p>Регистрация администратора</p></span>} gap='16px' paddings='25px' width="450px">
                {/*Сделать компонент, или ещё что-то придумать, пока пусть висит этот хэдер и футер*/}
                <div style={{display: 'flex',flexDirection: 'row', gap: '10px', marginBottom: '7px', fontSize: '24px', fontWeight: '700'}}>
                    <AdminIcon width='25px' height='25px'/>
                    <p>Вход администратора</p>
                </div>
                    <Input placeholder='Введите логин' label={<p>Логин</p>} value={email} onChange={(v)=>setEmail(String(v))}/>
                    <Input type="password" placeholder='Введите пароль' label={<p>Пароль</p>} value={password} onChange={(v)=>setPassword(String(v))}/>
                <div style={{display:'flex',flexDirection:'column', gap:8}}>
                    {error && <div style={{color:'crimson', fontSize:12}}>{error}</div>}
                    <Button width='250px' backgroundColor='rgba(228, 74, 119, 1)' theme={ThemeButton.ARROW} onClick={handleLogin} disabled={isLoading}><span>{isLoading ? 'Входим...' : 'Войти как администратор'}</span></Button>
                </div>
            </Container>
        </div>
    );
}