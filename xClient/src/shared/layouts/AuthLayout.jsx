import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/auth.store';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

const AuthLayout = () => {
    const { user } = useAuthStore();
    const [shouldRedirectToPublic, setShouldRedirectToPublic] = useState(false);

    const resetTimer = useCallback(() => {
        setShouldRedirectToPublic(false);
    }, []);

    // Only run inactivity timer when user is NOT logged in (on auth pages)
    useEffect(() => {
        if (user) return; // Logged-in users are never redirected by this timer

        let timer = setTimeout(() => {
            setShouldRedirectToPublic(true);
        }, INACTIVITY_LIMIT);

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

        const handleActivity = () => {
            clearTimeout(timer);
            setShouldRedirectToPublic(false);
            timer = setTimeout(() => setShouldRedirectToPublic(true), INACTIVITY_LIMIT);
        };

        events.forEach((e) => window.addEventListener(e, handleActivity));

        return () => {
            clearTimeout(timer);
            events.forEach((e) => window.removeEventListener(e, handleActivity));
        };
    }, [user]);

    if (shouldRedirectToPublic) {
        return <Navigate to="/" replace />;
    }

    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin-landing" replace />;
        if (user.role === 'mentor') return <Navigate to="/mentor-landing" replace />;
        return <Navigate to="/student-landing" replace />;
    }

    return (
        <div>
            <Outlet />
        </div>
    );
};

export { AuthLayout };