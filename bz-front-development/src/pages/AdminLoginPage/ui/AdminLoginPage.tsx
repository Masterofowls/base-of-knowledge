import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import http from 'shared/api/http'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@test.com')
    const [password, setPassword] = useState('Admin123!')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleBack = () => navigate('/')

    async function handleLogin() {
        if (isLoading) return
        setError(null)
        setIsLoading(true)
        try {
            const response = await http.post('/auth/login', {
                email, 
                password
            });
            
            if (response.data?.access_token) {
                localStorage.setItem('jwt_token', response.data.access_token);
                const roleName = (response.data.user?.role || '').toLowerCase()
                const normalizedRole = roleName.includes('администратор') || roleName === 'admin' ? 'admin' : roleName
                localStorage.setItem('user_role', normalizedRole || 'admin');
                if (import.meta.env.DEV) console.log('[auth] admin login success:', { user: response.data.user });
                navigate('/admin', { replace: true });
            }
        } catch (e: any) {
            if (e.response?.status === 401) {
                setError('Неверные учетные данные');
                if (import.meta.env.DEV) console.log('[auth] admin login failed: 401');
            } else {
                setError(e.message ?? 'Ошибка входа');
                if (import.meta.env.DEV) console.log('[auth] admin login error:', e);
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}>
          <Paper elevation={3} sx={{ p:3, width:'100%', borderRadius:3 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
              <AdminPanelSettingsIcon color="primary"/>
              <Typography variant="h6" fontWeight={700}>Вход администратора</Typography>
            </Box>
            <TextField
              label="Логин"
              placeholder="Введите логин"
              fullWidth
              margin="normal"
              value={email}
              onChange={e=>setEmail(e.target.value)}
            />
            <TextField
              type="password"
              label="Пароль"
              placeholder="Введите пароль"
              fullWidth
              margin="normal"
              value={password}
              onChange={e=>setPassword(e.target.value)}
            />
            {error && <Alert severity="error" sx={{ mt:1 }}>{error}</Alert>}
            <Box sx={{ display:'flex', gap:1, mt:2 }}>
              <Button onClick={handleBack} startIcon={<ArrowBackIcon/>} variant="outlined" color="inherit">Назад</Button>
              <Button onClick={handleLogin} disabled={isLoading} variant="contained" sx={{ ml:'auto' }}>
                {isLoading ? 'Входим...' : 'Войти'}
              </Button>
            </Box>
            <Divider sx={{ my:2 }} />
            <Typography variant="body2" color="text.secondary">Регистрация администратора доступна в панели управления</Typography>
          </Paper>
        </Container>
    );
}