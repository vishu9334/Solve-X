import { HoverEffect } from "../../../shared/components/HoverEffect";
import useAuthStore from "../../auth/store/auth.store";

const MentorDashboard = () => {
    const { user } = useAuthStore();

    const mentorItems = [
        {
            title: "Assigned Students",
            description: "View and manage students currently assigned to you for mentorship.",
            link: "/dashboard/mentor/students",
            badge: "5 assigned"
        },
        {
            title: "Task Submissions",
            description: "Review task submissions and provide structured evaluation feedback.",
            link: "/dashboard/mentor/tasks",
            badge: "review needed"
        },
        {
            title: "Sessions Schedule",
            description: "Configure your availability calendar and host scheduled video calls.",
            link: "/dashboard/mentor/sessions",
            badge: "calendar"
        }
    ];

    return (
        <div className="flex flex-col space-y-8">
            <div className="border-b border-neutral-200 pb-6">
                <span className="text-[10px] tracking-[0.3em] text-[#777777] uppercase block mb-2">
                    [ MENTOR PORTAL // ONLINE ]
                </span>
                <h1 className="text-3xl font-light tracking-tight font-sans">
                    Welcome back, <span className="font-bold">{user?.name || "Mentor"}</span>
                </h1>
            </div>
            
            <HoverEffect items={mentorItems} />
        </div>
    );
};

export default MentorDashboard;
