/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import LazyRoute from "./LazyRoute.jsx";
import RootLayout from "./RootLayout.jsx";
import { AuthLayout } from "../shared/layouts/AuthLayout";
import { DashboardLayout } from "../shared/layouts/DashboardLayout";

import ProtectedRoute from "../routes/ProtectedRoute";

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const OTPVerificationPage = lazy(() => import("../features/auth/pages/OTPPage"));
const ForgetPasswordPage = lazy(() => import("../features/auth/pages/ForgetPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ResetPasswordPage"));
const PublicPage = lazy(() => import("../shared/pages/PublicPage"));
const MentorDocPage = lazy(() => import("../shared/pages/MentorDocPage"));
const StudentDocPage = lazy(() => import("../shared/pages/StudentDocPage"));
const AdminDocPage = lazy(() => import("../shared/pages/AdminDocPage"));
const StudentLandingPage = lazy(() => import("../shared/pages/StudentLandingPage"));
const MentorLandingPage = lazy(() => import("../shared/pages/MentorLandingPage"));
const AdminLandingPage = lazy(() => import("../shared/pages/AdminLandingPage"));
const NotFoundPage = lazy(() => import("../shared/pages/NotFoundPage"));
const PrivacyPolicyPage = lazy(() => import("../shared/pages/PrivacyPolicyPage"));
const TermsConditionsPage = lazy(() => import("../shared/pages/TermsConditionsPage"));

const AdminDashboard = lazy(() => import("../features/dashboard/admin/page/adminDashboard"));
const MentorDashboard = lazy(() => import("../features/dashboard/mentor/page/MentorDashboard"));
const StudentDashboard = lazy(() => import("../features/dashboard/student/page/StudentDashboard"));

const AdminProfile = lazy(() => import("../features/profiles/admin/pages/adminProfile.page"));
const StudentProfile = lazy(() => import("../features/profiles/student/pages/studentProfile.page"));
const MentorProfile = lazy(() => import("../features/profiles/mentor/pages/mentorProfile.page"));
const AskDoubtPage = lazy(() => import("../features/doubt/pages/AskDoubtPage"));
const SpecializationSelectPage = lazy(() => import("../features/assessment/pages/SpecializationSelectPage"));
const AssessmentTestPage = lazy(() => import("../features/assessment/pages/AssessmentTestPage"));
const DoubtOffersPage = lazy(() => import("../features/doubt/pages/DoubtOffersPage"));
const ChatRoomPage = lazy(() => import("../features/chat/pages/ChatRoomPage"));

const page = (Component) => (
  <LazyRoute>
    <Component />
  </LazyRoute>
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: page(LoginPage) },
          { path: "/register", element: page(RegisterPage) },
          { path: "/verify", element: page(OTPVerificationPage) },
          { path: "/forgot-password", element: page(ForgetPasswordPage) },
          { path: "/reset-password", element: page(ResetPasswordPage) },
        ],
      },

      {
        path: "/",
        element: page(PublicPage),
      },

      {
        path: "/mentor-doc",
        element: page(MentorDocPage),
      },

      {
        path: "/student-doc",
        element: page(StudentDocPage),
      },

      {
        path: "/admin-doc",
        element: page(AdminDocPage),
      },

      {
        path: "/student-landing",
        element: page(StudentLandingPage),
      },

      {
        path: "/mentor-landing",
        element: page(MentorLandingPage),
      },

      {
        path: "/admin-landing",
        element: page(AdminLandingPage),
      },

      {
        path: "/privacy",
        element: page(PrivacyPolicyPage),
      },

      {
        path: "/terms",
        element: page(TermsConditionsPage),
      },

      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: "/dashboard/admin", element: page(AdminDashboard) },
              { path: "/dashboard/mentor", element: page(MentorDashboard) },
              { path: "/dashboard/student", element: page(StudentDashboard) },
              { path: "/student/ask-doubt", element: page(AskDoubtPage) },
              { path: "/mentor/assessment/select", element: page(SpecializationSelectPage) },
              { path: "/mentor/assessment/test", element: page(AssessmentTestPage) },
              { path: "/student/doubt-sessions/:doubtSessionId/offers", element: page(DoubtOffersPage) },
              { path: "/chat/:chatRoomId", element: page(ChatRoomPage) },
            ],
          },
          { path: "/admin/profile", element: page(AdminProfile) },
          { path: "/student/profile", element: page(StudentProfile) },
          { path: "/mentor/profile", element: page(MentorProfile) },
        ],
      },

      { path: "/public", element: <Navigate to="/" replace /> },
      { path: "*", element: page(NotFoundPage) },
    ],
  },
]);
