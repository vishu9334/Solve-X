import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "../shared/layouts/AuthLayout";
import { DashboardLayout } from "../shared/layouts/DashboardLayout";

import ProtectedRoute from "../routes/ProtectedRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import OTPVerificationPage from "../features/auth/pages/OTPPage";
import PublicPage from "../shared/pages/PublicPage";
import MentorDocPage from "../shared/pages/MentorDocPage";
import StudentDocPage from "../shared/pages/StudentDocPage";
import NotFoundPage from "../shared/pages/NotFoundPage";

import StudentDashboard from "../features/dashboard/pages/StudentDashboard";
import MentorDashboard from "../features/dashboard/pages/MentorDashboard";
import AdminDashboard from "../features/dashboard/admin/page/adminDashboard";

import AdminProfile from '../features/profiles/admin/pages/adminProfile.page'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/verify", element: <OTPVerificationPage /> },
      { path: "/forgot-password", element: <div>Forgot Password</div> },
      { path: "/reset-password", element: <div>Reset Password</div> },
    ],
  },

  {
    path: "/public",
    element: <PublicPage />,
  },

  {
    path: "/mentor-doc",
    element: <MentorDocPage />,
  },

  {
    path: "/student-doc",
    element: <StudentDocPage />,
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard/admin", element: <AdminDashboard /> },
          { path: "/dashboard/mentor", element: <MentorDashboard /> },
          { path: "/dashboard/student", element: <StudentDashboard /> },
        ],
      },
      { path: "/admin/profile", element: <AdminProfile /> },
    ],
  },

  { path: "/", element: <Navigate to="/public" replace /> },
  { path: "*", element: <NotFoundPage /> },
]);