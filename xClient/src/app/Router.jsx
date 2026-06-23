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
import StudentLandingPage from "../shared/pages/StudentLandingPage";
import MentorLandingPage from "../shared/pages/MentorLandingPage";
import AdminLandingPage from "../shared/pages/AdminLandingPage";
import NotFoundPage from "../shared/pages/NotFoundPage";

import AdminDashboard from "../features/dashboard/admin/page/adminDashboard";
import MentorDashboard from "../features/dashboard/mentor/page/MentorDashboard";
import StudentDashboard from "../features/dashboard/student/page/StudentDashboard";

import AdminProfile from '../features/profiles/admin/pages/adminProfile.page'
import StudentProfile from "../features/profiles/student/pages/studentProfile.page";
import MentorProfile from "../features/profiles/mentor/pages/mentorProfile.page";

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
    path: "/",
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
    path: "/student-landing",
    element: <StudentLandingPage />,
  },

  {
    path: "/mentor-landing",
    element: <MentorLandingPage />,
  },

  {
    path: "/admin-landing",
    element: <AdminLandingPage />,
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
      { path: "/student/profile", element: <StudentProfile /> },
      { path: "/mentor/profile", element: <MentorProfile /> },
    ],
  },

  { path: "/public", element: <Navigate to="/" replace /> },
  { path: "*", element: <NotFoundPage /> },
]);
