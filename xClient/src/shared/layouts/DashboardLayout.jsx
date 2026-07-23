import { Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../../features/auth/store/auth.store";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DashboardLayout = () => {
    const { data: currentUser } = useCurrentUser();
    const { user: storeUser } = useAuthStore();
    const user = currentUser || storeUser;
    const location = useLocation();

    if (!user) {
        return null;
    }

    const isAssessmentTest = location.pathname === "/mentor/assessment/test";
    const isAssessmentSelect = location.pathname === "/mentor/assessment/select";
    const isDashboard = location.pathname === "/dashboard/mentor" || location.pathname === "/dashboard/student";
    const isChat = location.pathname.startsWith("/chat/");

    let mainPaddingClass = "pt-32 sm:pt-24";
    if (isAssessmentTest) {
        mainPaddingClass = "pt-0";
    } else if (isAssessmentSelect) {
        mainPaddingClass = "pt-20";
    } else if (isDashboard) {
        mainPaddingClass = "pt-0";
    } else if (isChat) {
        mainPaddingClass = "pt-0";
    }

    return (
        <div className="min-h-screen text-white font-sans flex flex-col bg-[#0c0b11]">
            {/* Reusable Header Component */}
            <Header />

            {/* Content Area */}
            <main className={`flex-1 w-full box-border flex flex-col ${mainPaddingClass}`}>
                <Outlet />
            </main>

            {/* Reusable Footer Component - hidden on chat and assessment pages */}
            {!isAssessmentTest && !isChat && <Footer />}
        </div>
    );
};

export { DashboardLayout };
