import type {RouteProps} from "react-router-dom";
import {MainPage} from "pages/MainPage";
import {EditorPage} from "pages/EditorPage";
import {ChoiceRolePage} from "pages/ChoiceRolePage";
import {AdminLoginPage} from "pages/AdminLoginPage";
import {AdminRegistrationPage} from "pages/AdminRegistrationPage";
import {StudentLoginPage} from "pages/StudentLoginPage";
import {StudentDashboard} from "pages/StudentDashboard";
import {SmartRouter} from "pages/SmartRouter";

export const AppRoutes = {
    MAIN: 'main',
    EDITOR: 'editor',
    CHOICEROLE: 'choicerole',
    ADMINLOGIN: 'adminlogin',
    ADMINREGISTER: 'adminregister',
    STUDENTLOGIN: 'studentlogin',
    ADMIN: 'admin',
    STUDENT: 'student'
} as const;

type AppRouteKeys = typeof AppRoutes[keyof typeof AppRoutes];

export const RoutePath: Record<AppRouteKeys, string> = {
    [AppRoutes.MAIN]: '/',
    [AppRoutes.EDITOR]: '/editor',
    [AppRoutes.CHOICEROLE]: '/choicerole',
    [AppRoutes.ADMINLOGIN]: '/adminlogin',
    [AppRoutes.ADMINREGISTER]: '/adminregistration',
    [AppRoutes.STUDENTLOGIN]: '/studentlogin',
    [AppRoutes.ADMIN]: '/admin',
    [AppRoutes.STUDENT]: '/student',
}

export const routeConfig: Record<AppRouteKeys, RouteProps> = {
    [AppRoutes.MAIN]: {
        path: RoutePath[AppRoutes.MAIN],
        element: <SmartRouter/>
    },
    [AppRoutes.EDITOR]: {
        path: RoutePath[AppRoutes.EDITOR],
        element: <EditorPage/>
    },
    [AppRoutes.CHOICEROLE]: {
        path: RoutePath[AppRoutes.CHOICEROLE],
        element: <ChoiceRolePage/>
    },
    [AppRoutes.ADMINLOGIN]: {
        path: RoutePath[AppRoutes.ADMINLOGIN],
        element: <AdminLoginPage/>
    },
    [AppRoutes.ADMINREGISTER]: {
        path: RoutePath[AppRoutes.ADMINREGISTER],
        element: <AdminRegistrationPage/>
    },
    [AppRoutes.STUDENTLOGIN]: {
        path: RoutePath[AppRoutes.STUDENTLOGIN],
        element: <StudentLoginPage/>
    },
    [AppRoutes.ADMIN]: {
        path: RoutePath[AppRoutes.ADMIN],
        element: <MainPage/>
    },
    [AppRoutes.STUDENT]: {
        path: RoutePath[AppRoutes.STUDENT],
        element: <StudentDashboard/>
    },
}