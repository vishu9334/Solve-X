import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "../shared/layouts/AuthLayout";
import { DashboardLayout } from "../shared/layouts/DashboardLayout";

import ProtectedRoute from "../routes/ProtectedRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import OTPVerificationPage from "../features/auth/pages/OTPPage";
import ForgetPasswordPage from "../features/auth/pages/ForgetPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import PublicPage from "../shared/pages/PublicPage";
import MentorDocPage from "../shared/pages/MentorDocPage";
import StudentDocPage from "../shared/pages/StudentDocPage";
import AdminDocPage from "../shared/pages/AdminDocPage";
import StudentLandingPage from "../shared/pages/StudentLandingPage";
import MentorLandingPage from "../shared/pages/MentorLandingPage";
import AdminLandingPage from "../shared/pages/AdminLandingPage";
import NotFoundPage from "../shared/pages/NotFoundPage";
import PrivacyPolicyPage from "../shared/pages/PrivacyPolicyPage";
import TermsConditionsPage from "../shared/pages/TermsConditionsPage";

import AdminDashboard from "../features/dashboard/admin/page/adminDashboard";
import MentorDashboard from "../features/dashboard/mentor/page/MentorDashboard";
import StudentDashboard from "../features/dashboard/student/page/StudentDashboard";

import AdminProfile from '../features/profiles/admin/pages/adminProfile.page'
import StudentProfile from "../features/profiles/student/pages/studentProfile.page";
import MentorProfile from "../features/profiles/mentor/pages/mentorProfile.page";
import AskDoubtPage from "../features/doubt/pages/AskDoubtPage";
import SpecializationSelectPage from "../features/assessment/pages/SpecializationSelectPage";
import AssessmentTestPage from "../features/assessment/pages/AssessmentTestPage";
import DoubtOffersPage from "../features/doubt/pages/DoubtOffersPage";
import ChatRoomPage from "../features/chat/pages/ChatRoomPage";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/verify", element: <OTPVerificationPage /> },
      { path: "/forgot-password", element: <ForgetPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
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
    path: "/admin-doc",
    element: <AdminDocPage />,
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
    path: "/privacy",
    element: <PrivacyPolicyPage />,
  },

  {
    path: "/terms",
    element: <TermsConditionsPage />,
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
          { path: "/student/ask-doubt", element: <AskDoubtPage /> },
          { path: "/mentor/assessment/select", element: <SpecializationSelectPage /> },
          { path: "/mentor/assessment/test", element: <AssessmentTestPage /> },
          { path: "/student/doubt-sessions/:doubtSessionId/offers", element: <DoubtOffersPage /> },
          { path: "/chat/:chatRoomId", element: <ChatRoomPage /> },
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
