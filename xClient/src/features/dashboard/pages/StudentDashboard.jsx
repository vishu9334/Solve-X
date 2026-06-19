import { HoverEffect } from "../../../shared/components/HoverEffect";
import useAuthStore from "../../auth/store/auth.store";

const StudentDashboard = () => {
    const { user } = useAuthStore();

    const studentItems = [
        {
            title: "Elite Mentors",
            description: "Browse verified industry experts and connect with them for direct guidance.",
            link: "/dashboard/student/mentors",
            badge: "active"
        },
        {
            title: "Assigned Tasks",
            description: "View and submit tasks assigned by your mentors to track your technical progress.",
            link: "/dashboard/student/tasks",
            badge: "3 pending"
        },
        {
            title: "Assessments",
            description: "Take quick assessments and skill checkups to unlock new study milestones.",
            link: "/dashboard/student/assessments",
            badge: "practice"
        }
    ];

    return (
        <div className="flex flex-col space-y-8">
            <div className="border-b border-neutral-200 pb-6">
                <span className="text-[10px] tracking-[0.3em] text-[#777777] uppercase block mb-2">
                    [ STUDENT PORTAL // ONLINE ]
                </span>
                <h1 className="text-3xl font-light tracking-tight font-sans">
                    Welcome back, <span className="font-bold">{user?.name || "Student"}</span>
                </h1>
            </div>
            
            <HoverEffect items={studentItems} />
        </div>
    );
};

export default StudentDashboard;
