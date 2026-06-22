import { Outlet, Link, useNavigate, Navigate } from "react-router-dom";
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
    const { mutate: performLogout } = useLogout();

    // Redirect to public page if user is not logged in
    if (!user) {
        return <Navigate to="/public" replace />;
    }

    const handleLogout = () => {
        performLogout();
    };

    return (
        <div
            style={{ backgroundColor: "#0c0b11" }}
            className="h-screen text-white font-mono flex flex-col justify-between box-border overflow-hidden"
        >

            {/* DASHBOARD HEADER - Floating Pill Glass Navbar */}
            <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[1200px] z-[1000] flex justify-between items-center bg-[#0c0b11]/80 border border-white/15 px-7 py-3 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-md box-border text-white">
                <Link to={user ? `/dashboard/${user.role}` : '/public'} className="flex items-center gap-3 no-underline text-white cursor-pointer group">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[13px] font-bold tracking-[0.2em] uppercase">
                        SOLVE-X // DASHBOARD
                    </span>
                </Link>

                <nav className="flex items-center gap-6 text-[12px] tracking-[0.2em] font-semibold">
                    {user && (
                        <div className="flex items-center gap-4">
                            <img
                                src={getAvatarUrl(user)}
                                alt="User Avatar"
                                className="w-9 h-9 rounded-full border border-white/20 bg-white/5 object-contain p-0.5"
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] text-neutral-400 uppercase leading-none mb-1">
                                    {user.role}
                                </span>
                                <span className="text-[11px] text-white font-bold uppercase leading-none">
                                    {user.name || user.email}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-transparent border border-white text-white px-5 py-2 cursor-pointer text-[11px] font-bold tracking-[0.2em] ml-2 rounded-full transition-all duration-200 hover:bg-white hover:text-[#0c0b11]"
                            >
                                LOGOUT
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* DASHBOARD CONTENT - Stretch fully to full screen width with offset for the floating navbar */}
            <main className="flex-1 w-full pt-24 box-border flex flex-col overflow-hidden">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 px-8 py-4 text-[10px] tracking-[0.2em] text-[#777777] flex justify-between bg-transparent box-border">
                <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                <span>[ STATUS: SECURE ]</span>
            </footer>
        </div>
    );
};

export { DashboardLayout };