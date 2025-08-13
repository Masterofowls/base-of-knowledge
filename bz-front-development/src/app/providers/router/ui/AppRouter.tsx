import {Suspense} from 'react';
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import {routeConfig} from "shared/config/routeConfig/routeConfig.";

function AppRouter() {
    const location = useLocation()
    // Re-evaluate admin role on every render/navigation
    const isAdmin = (localStorage.getItem('user_role') === 'admin') && !!localStorage.getItem('jwt_token')
    return (
        <Suspense fallback={'Loading ...'}>
            <Routes>
                {Object.values(routeConfig).map(({element, path}) => {
                    // Treat only '/admin' and '/admin/*' as protected, not '/adminlogin'
                    const adminOnly = path === '/admin' || path?.startsWith('/admin/')
                    const guarded = adminOnly && !isAdmin ? <Navigate to='/adminlogin' replace/> : element
                    return (
                        <Route
                            key={path}
                            path={path}
                            element={guarded}
                        />
                    )
                })}
            </Routes>
        </Suspense>
    );
}

export default AppRouter;