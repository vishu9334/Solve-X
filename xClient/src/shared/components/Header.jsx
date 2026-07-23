import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../features/auth/store/auth.store";
import { useLogout } from "../../features/auth/hooks/useLogout.js";
import NotificationBell from "./NotificationBell.jsx";
import { useGetActiveSession } from "../../features/doubt/hooks/useDoubt.js";

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

import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser.js";

const Header = () => {
    const { user: storeUser } = useAuthStore();
    const { data: currentUser } = useCurrentUser();
    const user = currentUser || storeUser;
    const location = useLocation();
    const { mutate: performLogout } = useLogout();
    const [menuOpen, setMenuOpen] = useState(false);
    const { data: activeSession } = useGetActiveSession();

    const handleLogout = () => {
        performLogout();
    };

    const isAssessmentTest = location.pathname === "/mentor/assessment/test";
    const isAssessmentSelect = location.pathname === "/mentor/assessment/select";

    if (!user) return null;

    const isChat = location.pathname.startsWith("/chat/");
    if (isChat) return null;

    const forceCollapse = isAssessmentTest || location.pathname.startsWith("/chat/");

    const headerClasses = (isAssessmentSelect || isAssessmentTest)
        ? "fixed top-0 left-0 right-0 z-[1000] flex w-full flex-col gap-3 border-b border-white/10 px-6 py-3.5 text-white bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.37)] box-border xl:flex-row xl:items-center xl:justify-between xl:px-8 backdrop-blur-[20px]"
        : `fixed top-3 left-1/2 z-[1000] flex w-[94%] max-w-[1200px] -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/10 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-[20px] box-border xl:top-4 xl:flex-row xl:items-center xl:justify-between xl:rounded-full xl:px-7 bg-white/[0.03]`;

    return (
        <header className={headerClasses}>
            <div className="flex w-full items-center justify-between xl:w-auto">
                <Link to={`/dashboard/${user.role}`} className="flex min-w-0 items-center gap-3 no-underline text-white cursor-pointer group">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110" />
                    <span className="truncate text-[11px] font-bold tracking-[0.14em] uppercase xl:text-[13px] xl:tracking-[0.2em] flex items-center gap-1.5">
                        <i className="hgi-stroke hgi-dashboard-square-01 xl:hidden text-sm"></i>
                        <span>
                            {isAssessmentSelect
                                ? "SOLVE-X // ASSESSMENT"
                                : isAssessmentTest
                                ? "SOLVE-X // EXAM IN PROGRESS"
                                : "SOLVE-X // DASHBOARD"}
                        </span>
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {activeSession && activeSession.chatRoomId && activeSession.status === "in_session" && (
                        <Link
                            to={`/chat/${activeSession.chatRoomId}`}
                            className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300 transition-all hover:bg-emerald-400/20 xl:hidden"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>LIVE</span>
                        </Link>
                    )}
                    {!forceCollapse && (
                        <div className="flex xl:hidden">
                            <NotificationBell />
                        </div>
                    )}
                    {/* Mobile/Tablet Hamburger Icon - visible on all screens when collapsed */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`items-center justify-center p-1 bg-transparent border-none text-white focus:outline-none cursor-pointer ${forceCollapse ? "flex" : "flex xl:hidden"}`}
                    >
                        <span className="material-symbols-outlined text-2xl select-none">
                            {menuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Desktop Menu - visible on xl and above, but hidden if forceCollapse is true */}
            {!forceCollapse && (
                <nav className="hidden xl:flex min-w-0 flex-wrap items-center justify-between gap-3 text-[11px] tracking-[0.12em] font-semibold xl:justify-end xl:gap-6 xl:text-[12px] xl:tracking-[0.2em]">
                    <div className="flex items-center gap-3 border-white/15 xl:mr-2 xl:border-r xl:pr-4">
                        <Link
                            to={user.role === 'admin' ? '/admin-landing' : user.role === 'mentor' ? '/mentor-landing' : '/student-landing'}
                            className="text-white/60 hover:text-white no-underline transition-colors flex items-center gap-1"
                            title="Landing"
                        >
                            <i className="hgi-stroke hgi-home-01 xl:hidden text-base"></i>
                            <span className="hidden xl:inline">LANDING</span>
                        </Link>
                        <Link
                            to={user.role === 'admin' ? '/admin/profile' : user.role === 'mentor' ? '/mentor/profile' : '/student/profile'}
                            className="text-white/60 hover:text-white no-underline transition-colors flex items-center gap-1"
                            title="Profile"
                        >
                            <i className="hgi-stroke hgi-user-circle xl:hidden text-base"></i>
                            <span className="hidden xl:inline">PROFILE</span>
                        </Link>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-3 xl:flex-none xl:gap-4">
                        {activeSession && activeSession.chatRoomId && activeSession.status === "in_session" && (
                            <Link
                                to={`/chat/${activeSession.chatRoomId}`}
                                className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-400/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>LIVE CHAT</span>
                            </Link>
                        )}
                        <NotificationBell />
                        <img
                            src={getAvatarUrl(user)}
                            alt="User Avatar"
                            className="h-8 w-8 shrink-0 rounded-full border border-white/20 bg-white/5 object-contain p-0.5 xl:h-9 xl:w-9"
                        />
                        <div className="hidden min-w-0 flex-col items-start xl:flex">
                            <span className="text-[9px] text-neutral-400 uppercase leading-none mb-1">
                                {user.role}
                            </span>
                            <span className="max-w-[160px] truncate text-[11px] text-white font-bold uppercase leading-none">
                                {user.name || user.email}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-transparent border border-white text-white p-2 xl:px-5 xl:py-2 cursor-pointer text-[10px] font-bold tracking-[0.14em] rounded-full transition-all duration-200 hover:bg-white hover:text-[#0c0b11] xl:ml-2 xl:px-5 xl:text-[11px] xl:tracking-[0.2em] flex items-center justify-center gap-1"
                            title="Logout"
                        >
                            <i className="hgi-stroke hgi-logout-02 xl:hidden text-base"></i>
                            <span className="hidden xl:inline">LOGOUT</span>
                        </button>
                    </div>
                </nav>
            )}

            {/* Mobile Dropdown Menu Drawer */}
            {menuOpen && (
                <div className={`absolute top-[110%] left-0 right-0 z-[1000] flex flex-col gap-3 rounded-2xl border border-blue-500/25 bg-blue-950/45 px-6 py-4 shadow-[0_20px_50px_rgba(30,58,138,0.25)] backdrop-blur-xl ${forceCollapse ? "" : "xl:hidden"}`}>
                    <Link
                        to={user.role === 'admin' ? '/admin-landing' : user.role === 'mentor' ? '/mentor-landing' : '/student-landing'}
                        className="text-white/70 hover:text-white no-underline transition-colors py-2.5 border-b border-white/10 flex items-center gap-2 font-semibold text-xs tracking-wider"
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="hgi-stroke hgi-home-01 text-base"></i>
                        <span>LANDING</span>
                    </Link>
                    <Link
                        to={user.role === 'admin' ? '/admin/profile' : user.role === 'mentor' ? '/mentor/profile' : '/student/profile'}
                        className="text-white/70 hover:text-white no-underline transition-colors py-2.5 border-b border-white/10 flex items-center gap-2 font-semibold text-xs tracking-wider"
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="hgi-stroke hgi-user-circle text-base"></i>
                        <span>PROFILE</span>
                    </Link>
                    <button
                        onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                        }}
                        className="w-full text-left bg-transparent border-none text-rose-400 py-2.5 flex items-center gap-2 cursor-pointer font-semibold text-xs tracking-wider uppercase"
                    >
                        <i className="hgi-stroke hgi-logout-02 text-base"></i>
                        <span>LOGOUT</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
