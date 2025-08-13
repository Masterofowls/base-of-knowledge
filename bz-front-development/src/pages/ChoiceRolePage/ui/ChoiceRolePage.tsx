import {classNames} from "shared/lib/classNames/classNames.ts";
import {Container, ContainerTheme} from "shared/ui/Container/Container.tsx";
import UserIcon from "shared/assets/icons/UserFace.svg?react";
import AdminIcon from "shared/assets/icons/AdminFace.svg?react"
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react"
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import {Button} from "shared/ui/Button";
import {useNavigate} from "react-router-dom";


export default function ChoiceRolePage() {
    const navigate = useNavigate();

    const handleStudentLogin = () => {
        navigate('/studentlogin');
    };

    const handleAdminLogin = () => {
        navigate('/adminlogin');
    };

    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container theme={ContainerTheme.CLEAR} paddings='0' width='min(100%, 960px)'>
                <Container gap="16px" direction="column" paddings='0'>
                    <h2 style={{textAlign:'center'}}>Выберите способ входа</h2>
                    <Container theme={ContainerTheme.CLEAR} direction={"row"} gap="16px">
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16, width:'100%'}}>
                            <Container lastMargin="12px" paddings='0' gap="10px">
                                <UserIcon width='55px' height='55px' />
                                <h3>Студент</h3>
                                <p style={{textAlign:'center'}}>Выберите свою группу для просмотра материалов</p>
                                <Button width='100%' theme={ThemeButton.ARROW} backgroundColor='#00AAFF' onClick={handleStudentLogin}><p>Вход студента</p></Button>
                            </Container>
                            <Container lastMargin="12px" paddings='0' gap="10px">
                                <AdminIcon width='55px' height='55px' />
                                <h3>Администратор</h3>
                                <p style={{textAlign:'center'}}>Войдите в административную панель</p>
                                <Button width='100%' theme={ThemeButton.ARROW} backgroundColor='rgba(228, 74, 119, 1)' onClick={handleAdminLogin}><p>Вход администратора</p></Button>
                            </Container>
                        </div>
                    </Container>
                </Container>
            </Container>
        </div>
    );
}