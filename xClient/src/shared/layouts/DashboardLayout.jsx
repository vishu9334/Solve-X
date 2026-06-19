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
        <div className="min-h-screen bg-slate-50 text-[#111111] font-mono flex flex-col justify-between selection:bg-black selection:text-white">
            {/* DASHBOARD HEADER */}
            <header className="flex justify-between items-center bg-white border-b border-neutral-200 px-8 py-4 shadow-sm">
                <Link to={user ? `/dashboard/${user.role}` : '/public'} className="flex items-center space-x-3 group cursor-pointer text-current no-underline">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-sm font-bold tracking-[0.2em] uppercase">SOLVE-X // DASHBOARD</span>
                </Link>

                <nav className="flex items-center space-x-6 text-xs tracking-[0.2em] font-semibold">
                    {user && (
                        <div className="flex items-center space-x-4">
                            <img 
                                src={getAvatarUrl(user)} 
                                alt="User Avatar" 
                                className="w-9 h-9 rounded-full border border-neutral-300 bg-neutral-100 object-contain p-0.5" 
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-[#777777] uppercase leading-none mb-1">
                                    {user.role}
                                </span>
                                <span className="text-xs text-black font-bold uppercase leading-none">
                                    {user.name || user.email}
                                </span>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="hover:text-neutral-500 transition-colors uppercase border border-black px-4 py-2 hover:bg-black hover:text-white duration-200 cursor-pointer text-xs font-semibold tracking-[0.2em] ml-2"
                            >
                                LOGOUT
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* DASHBOARD CONTENT */}
            <main className="flex-1 p-8 md:p-12 max-w-7xl w-full mx-auto">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="border-t border-neutral-200 px-8 md:px-12 py-4 text-[10px] tracking-[0.2em] text-[#777777] flex justify-between bg-white">
                <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                <span>[ STATUS: SECURE ]</span>
            </footer>
        </div>
    );
};

export { DashboardLayout };