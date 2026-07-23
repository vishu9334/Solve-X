import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";

const ProtectedRoute = () => {
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#050509] flex items-center justify-center text-white font-mono">
        <div className="animate-pulse">Loading session...</div>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;