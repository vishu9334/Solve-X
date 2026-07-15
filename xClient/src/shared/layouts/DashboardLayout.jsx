import { Outlet, Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../features/auth/store/auth.store";
import Header from "../components/Header";
import Footer from "../components/Footer";

const DashboardLayout = () => {
    const { user } = useAuthStore();
    const location = useLocation();

    // Redirect to public page if user is not logged in
    if (!user) {
        return <Navigate to="/" replace />;
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
