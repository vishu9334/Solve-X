import { Outlet, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../features/auth/store/auth.store";
import { useLogout } from "../../features/auth/hooks/useLogout.js";

const getAvatarUrl = (user) => {
    if (!user) return '';
    const email = user.email || user.name || 'default';
    const seed = encodeURIComponent(email);
    let style = 'adventurer'; // default/student style
    if (user.role === 'mentor') {
        style = 'dylan';
    } else if (user.role === 'admin') {
        style = 'identicon';
    }
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
};

const DashboardLayout = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate: performLogout } = useLogout();

    // Redirect to public page if user is not logged in
    if (!user) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = () => {
        performLogout();
    };

    const isStudentDashboard = location.pathname === "/dashboard/student";

    return (
        <div
            style={{ backgroundColor: "#0c0b11" }}
            className="h-screen text-white font-mono flex flex-col box-border overflow-hidden"
        >

            {/* DASHBOARD HEADER - Floating Pill Glass Navbar */}
            <header className={`fixed top-3 left-1/2 z-[1000] flex w-[94%] max-w-[1200px] -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/15 px-4 py-3 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-md box-border sm:top-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-7 ${isStudentDashboard ? 'bg-white/5' : 'bg-[#0c0b11]/85'}`}>
                <Link to={user ? `/dashboard/${user.role}` : '/'} className="flex min-w-0 items-center gap-3 no-underline text-white cursor-pointer group">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110" />
                    <span className="truncate text-[11px] font-bold tracking-[0.14em] uppercase sm:text-[13px] sm:tracking-[0.2em]">
                        SOLVE-X // DASHBOARD
                    </span>
                </Link>

                <nav className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-[11px] tracking-[0.12em] font-semibold sm:justify-end sm:gap-6 sm:text-[12px] sm:tracking-[0.2em]">
                    {user && (
                        <div className="flex items-center gap-3 border-white/15 sm:mr-2 sm:border-r sm:pr-4">
                            <Link
                                to={user.role === 'admin' ? '/admin-landing' : user.role === 'mentor' ? '/mentor-landing' : '/student-landing'}
                                className="text-white/60 hover:text-white no-underline transition-colors"
                            >
                                LANDING
                            </Link>
                            <Link
                                to={user.role === 'admin' ? '/admin/profile' : user.role === 'mentor' ? '/mentor/profile' : '/student/profile'}
                                className="text-white/60 hover:text-white no-underline transition-colors"
                            >
                                PROFILE
                            </Link>
                        </div>
                    )}
                    {user && (
                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none sm:gap-4">
                            <img
                                src={getAvatarUrl(user)}
                                alt="User Avatar"
                                className="h-8 w-8 shrink-0 rounded-full border border-white/20 bg-white/5 object-contain p-0.5 sm:h-9 sm:w-9"
                            />
                            <div className="hidden min-w-0 flex-col items-start sm:flex">
                                <span className="text-[9px] text-neutral-400 uppercase leading-none mb-1">
                                    {user.role}
                                </span>
                                <span className="max-w-[160px] truncate text-[11px] text-white font-bold uppercase leading-none">
                                    {user.name || user.email}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-transparent border border-white text-white px-3 py-2 cursor-pointer text-[10px] font-bold tracking-[0.14em] rounded-full transition-all duration-200 hover:bg-white hover:text-[#0c0b11] sm:ml-2 sm:px-5 sm:text-[11px] sm:tracking-[0.2em]"
                            >
                                LOGOUT
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* DASHBOARD CONTENT - Stretch fully to full screen width with offset for the floating navbar */}
            <main className="flex-1 min-h-0 w-full pt-32 box-border flex flex-col overflow-hidden sm:pt-24">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 px-4 py-4 text-[9px] tracking-[0.14em] text-[#777777] flex flex-col gap-2 bg-transparent box-border sm:flex-row sm:justify-between sm:px-8 sm:text-[10px] sm:tracking-[0.2em]">
                <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                <span>[ STATUS: SECURE ]</span>
            </footer>
        </div>
    );
};

export { DashboardLayout };
