import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StudentTreeFilter from 'widgets/StudentTreeFilter/ui/StudentTreeFilter'

export default function StudentLoginPage() {
    const navigate = useNavigate();
    useEffect(() => {
        // instant student mode and redirect to dashboard
        localStorage.setItem('user_role','student');
        localStorage.setItem('strict_audience','1');
        navigate('/student', { replace: true });
    }, [navigate]);
    function handleBack(){ navigate('/') }
    return (
      <Container maxWidth="md" sx={{ display:'grid', placeItems:'center', minHeight:'calc(100dvh - 140px)' }}>
        <Paper elevation={3} sx={{ p:3, width:'100%', borderRadius:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
            <Typography variant="h6" fontWeight={700}>Выбор студента по дереву</Typography>
          </Box>
          {/* Auto-redirect active; UI not shown */}
          <Box sx={{ display:'flex', gap:1, mt:2 }}>
            <Button onClick={handleBack} startIcon={<ArrowBackIcon/>} variant="outlined" color="inherit">Назад</Button>
          </Box>
        </Paper>
      </Container>
    );
}
