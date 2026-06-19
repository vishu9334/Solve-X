import { HoverEffect } from "../../../shared/components/HoverEffect";
import useAuthStore from "../../auth/store/auth.store";

const AdminDashboard = () => {
    const { user } = useAuthStore();

    const adminItems = [
        {
            title: "Manage Users",
            description: "Browse, filter, and moderate registered student and mentor accounts.",
            link: "/dashboard/admin/users",
            badge: "system"
        },
        {
            title: "Mentor Approvals",
            description: "Review pending mentor verification requests and document submittals.",
            link: "/dashboard/admin/approvals",
            badge: "2 pending"
        },
        {
            title: "System Logs",
            description: "Inspect system logs, API metrics, and database operational state.",
            link: "/dashboard/admin/logs",
            badge: "v1.0.0"
        }
    ];

    return (
        <div className="flex flex-col space-y-8">
            <div className="border-b border-neutral-200 pb-6">
                <span className="text-[10px] tracking-[0.3em] text-[#777777] uppercase block mb-2">
                    [ ADMIN SYSTEM // SECURE ]
                </span>
                <h1 className="text-3xl font-light tracking-tight font-sans">
                    System Console: <span className="font-bold">{user?.name || "Admin"}</span>
                </h1>
            </div>
            
            <HoverEffect items={adminItems} />
        </div>
    );
};

export default AdminDashboard;
