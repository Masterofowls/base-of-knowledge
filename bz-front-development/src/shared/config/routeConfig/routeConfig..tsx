import type {RouteProps} from "react-router-dom";
import {MainPage} from "pages/MainPage";
// EditorPage removed from navigation/routes per new design
import {ChoiceRolePage} from "pages/ChoiceRolePage";
import {AdminLoginPage} from "pages/AdminLoginPage";
import {AdminRegistrationPage} from "pages/AdminRegistrationPage";
import {StudentLoginPage} from "pages/StudentLoginPage";
import {StudentDashboard} from "pages/StudentDashboard";
import {SmartRouter} from "pages/SmartRouter";
import {PostManagement} from "pages/PostManagement";
import {PostEditor} from "pages/PostEditor";
import {GroupManagement} from "pages/GroupManagement";
import {PostsList} from "pages/PostsList";
import {PostView} from "pages/PostView";
import Blog from "../../../../blog/Blog.tsx";
import SignInSide from "../../../../sign-in-side/SignInSide.tsx";

export const AppRoutes = {
    MAIN: 'main',
    // EDITOR route removed
    CHOICEROLE: 'choicerole',
    ADMINLOGIN: 'adminlogin',
    ADMINREGISTER: 'adminregister',
    STUDENTLOGIN: 'studentlogin',
    ADMIN: 'admin',
    STUDENT: 'student',
    ADMIN_POSTS: 'admin_posts',
    ADMIN_POST_CREATE: 'admin_post_create',
    ADMIN_POST_EDIT: 'admin_post_edit',
    ADMIN_GROUPS: 'admin_groups',
    POSTS_LIST: 'posts_list',
    POST_VIEW: 'post_view',
    BLOG: 'blog',
    SIGNIN_SIDE: 'signin_side'
} as const;

type AppRouteKeys = typeof AppRoutes[keyof typeof AppRoutes];

export const RoutePath: Record<AppRouteKeys, string> = {
    [AppRoutes.MAIN]: '/',
    [AppRoutes.CHOICEROLE]: '/choicerole',
    [AppRoutes.ADMINLOGIN]: '/adminlogin',
    [AppRoutes.ADMINREGISTER]: '/adminregistration',
    [AppRoutes.STUDENTLOGIN]: '/studentlogin',
    [AppRoutes.ADMIN]: '/admin',
    [AppRoutes.STUDENT]: '/student',
    [AppRoutes.ADMIN_POSTS]: '/admin/posts',
    [AppRoutes.ADMIN_POST_CREATE]: '/admin/post/create',
    [AppRoutes.ADMIN_POST_EDIT]: '/admin/post/edit/:id',
    [AppRoutes.ADMIN_GROUPS]: '/admin/groups',
    [AppRoutes.POSTS_LIST]: '/posts',
    [AppRoutes.POST_VIEW]: '/posts/:id',
    [AppRoutes.BLOG]: '/mui/blog',
    [AppRoutes.SIGNIN_SIDE]: '/mui/signin',
}

export const routeConfig: Record<AppRouteKeys, RouteProps> = {
    [AppRoutes.MAIN]: {
        path: RoutePath[AppRoutes.MAIN],
        element: <SmartRouter/>
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
    [AppRoutes.ADMIN_POSTS]: {
        path: RoutePath[AppRoutes.ADMIN_POSTS],
        element: <PostManagement/>
    },
    [AppRoutes.ADMIN_POST_CREATE]: {
        path: RoutePath[AppRoutes.ADMIN_POST_CREATE],
        element: <PostEditor/>
    },
    [AppRoutes.ADMIN_POST_EDIT]: {
        path: RoutePath[AppRoutes.ADMIN_POST_EDIT],
        element: <PostEditor/>
    },
    [AppRoutes.ADMIN_GROUPS]: {
        path: RoutePath[AppRoutes.ADMIN_GROUPS],
        element: <GroupManagement/>
    },
    [AppRoutes.POSTS_LIST]: {
        path: RoutePath[AppRoutes.POSTS_LIST],
        element: <Blog/>
    },
    [AppRoutes.POST_VIEW]: {
        path: RoutePath[AppRoutes.POST_VIEW],
        element: <PostView/>
    },
    [AppRoutes.BLOG]: {
        path: RoutePath[AppRoutes.BLOG],
        element: <Blog/>
    },
    [AppRoutes.SIGNIN_SIDE]: {
        path: RoutePath[AppRoutes.SIGNIN_SIDE],
        element: <SignInSide/>
    },
}