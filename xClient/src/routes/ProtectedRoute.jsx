import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";

const ProtectedRoute = () => {
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) {
    return null;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;