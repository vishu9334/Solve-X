import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../shared/layouts/AuthLayout'
import { DashboardLayout } from '../shared/layouts/DashboardLayout'
import LoginPage from '../features/auth/pages/LoginPage'
export const router = createBrowserRouter([
    {
        element:<AuthLayout/>,
        children: [
            {path: '/login',element: <LoginPage/>},
            // {path: '/register', element: <div>Register</div>},
            {path: '/verify', element: <div>OTP</div>},
            {path: '/forgot-password', element: <div>Forgot Password</div>},
            {path: '/reset-password', element: <div>Reset Password</div>},
        ]
    },
    {
        element:<DashboardLayout/>,
        children: [
            {path:'/home', element: <div>Home</div>},
            {path:'/dashboard/admin', element: <div>Admin</div>},
            {path:'/dashboard/mentor', element: <div>Mentor</div>},
            {path:'/dashboard/student', element: <div>Student</div>}
        ]
    },
    {path:'/', element:<Navigate to="/login" replace/>},
    {path:'*', element:<div>404</div>}
])

 