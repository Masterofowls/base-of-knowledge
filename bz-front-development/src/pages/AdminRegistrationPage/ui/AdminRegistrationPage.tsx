import {classNames} from "shared/lib/classNames/classNames.ts";
import {Input} from "shared/ui/Input/Input.tsx";
import {Container, ContainerTheme} from "shared/ui/Container/Container.tsx";
import {Button} from "shared/ui/Button";
import {ThemeButton} from "shared/ui/Button/ui/Button.tsx";
import AdminIcon from "shared/assets/icons/AdminFace.svg?react"
import ArrowIcon from "shared/assets/icons/ArrrowLeft.svg?react"


export default function AdminRegistrationPage() {
    return (
        <div className={classNames('page-center-wrapper', {}, [])}>
            <Container footer={<span><ArrowIcon width='13px' height='11px' /><p>Назад к выбору входа</p></span>} theme={ContainerTheme.CLEAR}>
                <Container footerContentHeight='65px' firstMargin='13px' footer={<span><p>Уже есть аккаунт?</p><p style={{color: 'rgba(255,89,138, 1)'}}>Войти в систему?</p></span>} gap='16px' paddings='25px' width="503px">
                    {/*Сделать компонент, или ещё что-то придумать, пока пусть висит этот хэдер*/}
                    <div style={{display: 'flex',flexDirection: 'row', gap: '10px', marginBottom: '5px', fontSize: '24px', fontWeight: '700'}}>
                        <AdminIcon width='25px' height='25px'/>
                        <p>Регистрация администратора</p>
                    </div>
                    <Input placeholder='Выберите логин' label={<p>Логин</p>}/>
                    <Input placeholder='Введите пароль' label={<p>Пароль</p>}/>
                    <Input placeholder='Введите пароль ещё раз' label={<p>Подтвердите пароль</p>}/>
                    <Input placeholder='Введите код администратора' label={<p>Код администратора</p>}/>
                    <Button width='208px' backgroundColor='rgba(228, 74, 119, 1)' theme={ThemeButton.ARROW}><p>Зарегестрироваться</p></Button>
                </Container>
            </Container>
        </div>
    );
}