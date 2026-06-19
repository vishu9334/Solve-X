import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/auth.store';

const AuthLayout = () => {
    const { user } = useAuthStore();
    const [shouldRedirectToPublic, setShouldRedirectToPublic] = useState(false);

    // Redirect to public page after 5 minutes if user does not log in
    useEffect(() => {
        const timer = setTimeout(() => {
            setShouldRedirectToPublic(true);
        }, 300000); // 5 minutes

        return () => clearTimeout(timer);
    }, []);

    if (shouldRedirectToPublic) {
        return <Navigate to="/public" replace />;
    }

    if (user) {
        if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
        if (user.role === 'mentor') return <Navigate to="/dashboard/mentor" replace />;
        return <Navigate to="/dashboard/student" replace />;
    }

    return (
        <div>
            <Outlet />
        </div>
    );
};

export { AuthLayout };