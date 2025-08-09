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
            <Container theme={ContainerTheme.CLEAR} footer={<span><ArrowIcon width='13px' height='11px' /><p>Вернуться на главную</p></span>}>
                <Container gap="20px" direction="column" paddings='35px' footer={<p>Регистрация администратора</p>}>
                    <h2>Выберите способ входа</h2>
                    <Container theme={ContainerTheme.CLEAR} direction={"row"} gap="30px">
                        <Container lastMargin="20px" paddings='44px' gap="13px">
                            <UserIcon width='75px' height='75px' />
                            <h2>Сотрудник</h2>
                            <p>Выберите свою группу для <br/> просмотра материалов</p>
                            <Button width='230px' theme={ThemeButton.ARROW} backgroundColor='#00AAFF' onClick={handleStudentLogin}><p>Вход сотрудника</p></Button>
                        </Container>
                        <Container lastMargin="20px" paddings='44px' gap="13px">
                            <AdminIcon width='75px' height='75px' />
                            <h2>Сотрудник</h2>
                            <p>Выберите свою группу для <br/> просмотра материалов</p>
                            <Button width='230px' theme={ThemeButton.ARROW} backgroundColor='rgba(228, 74, 119, 1)' onClick={handleAdminLogin}><p>Вход администратора</p></Button>
                        </Container>
                    </Container>
                </Container>
            </Container>
        </div>
    );
}