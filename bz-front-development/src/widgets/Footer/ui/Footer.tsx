import {classNames} from "shared/lib/classNames/classNames";
import cls from './Footer.module.scss'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Divider from '@mui/material/Divider'
import SchoolIcon from '@mui/icons-material/School'

interface FooterProps {
    className?: string
}

function Footer({className}: FooterProps) {
  return (
    <footer className={classNames(cls.Footer, {}, [className])}>
      <Divider />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 2, flexWrap:'wrap' }}>
          <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
            <SchoolIcon fontSize='small' />
            <Typography variant='subtitle1' color='text.secondary'>Студенческий Портал Хекслет</Typography>
          </Box>
          <Typography variant='body2' color='text.secondary'>
            © {new Date().getFullYear()} Студенческий Портал Хекслет. Все права защищены.
          </Typography>
        </Box>
        <Box sx={{ mt: 1, display:'flex', gap: 2, flexWrap:'wrap' }}>
          <Link href='/' underline='hover' color='inherit' variant='body2'>Главная</Link>
          <Link href='/posts' underline='hover' color='inherit' variant='body2'>Посты</Link>
          <Link href='/choicerole' underline='hover' color='inherit' variant='body2'>Вход</Link>
        </Box>
      </Container>
    </footer>
  );
}

export default Footer;
