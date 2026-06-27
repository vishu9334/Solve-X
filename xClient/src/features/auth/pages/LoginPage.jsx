import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginZodValidator } from '../../validations/auth.schema';
import { useLogin } from '../hooks/useLogin.js';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingOverlay from '../../../shared/components/LoadingOverlay';

const LoginPage = () => {
    const navigate = useNavigate();
    const { mutate: login, isPending } = useLogin();
    const { register, handleSubmit } = useForm({
        resolver: zodResolver(loginZodValidator),
        mode: "onTouched",
    });

    const handleEmailChange = (e) => {
        if (e.target.value === '') {
            toast.error("Email is required", { toastId: 'email' });
        }
    };

    const handlePasswordChange = (e) => {
        if (e.target.value === '') {
            toast.error("Password is required", { toastId: 'password' });
        }
    };

    const onSubmit = (data) => {
        login(data);
    };

    const onError = (formErrors) => {
        // Show validation errors as toast notifications
        Object.keys(formErrors).forEach((field) => {
            toast.error(formErrors[field].message, { toastId: field });
        });
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white md:py-3 md:pl-4 items-center justify-center relative">
            <LoadingOverlay isLoading={isPending} message="Signing in to Solve-X..." />
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white active:scale-95 transition-all duration-200 cursor-pointer"
                aria-label="Go Back"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            {/* Left Side - Brand Box */}
            <div className="hidden md:flex w-1/2 h-full justify-center items-center rounded-3xl bg-gradient-to-b from-[#3D3B93] via-[#ECD7AD] to-[#FFFFFE]">
                <div className="w-[90%] h-full flex items-center justify-between flex-col pt-15">
                    <div className="flex flex-col items-center space-y-2">
                        <img src="/logo.png" alt="Solve-X Logo" className="w-20 h-20 object-contain transition-transform duration-300 hover:scale-110" />
                        <p className="text-5xl font-bold text-white font-raleway">Solve-X</p>
                    </div>
                    <div className="w-full flex-1 flex items-center justify-center">
                        <div className="w-[80%] max-w-sm aspect-square">
                            <DotLottieReact
                                src="https://lottie.host/bb63aecb-262c-4c16-98d4-ddbc18671878/mGPRnySj1q.lottie"
                                loop
                                autoplay
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    <footer className="w-full flex justify-between items-center text-[11px] text-slate-600 font-raleway py-4 border-t border-slate-200">
                        <p>© 2026 Solve-X. All rights reserved.</p>
                        <div className="flex space-x-4">
                            <Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
                            <Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 h-full md:pr-3 flex items-center justify-center overflow-y-auto px-4 py-8" data-lenis-prevent>
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl flex flex-col space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center space-y-2">
                        <img src="/logo.png" alt="Solve-X Logo" className="w-16 h-16 object-contain mb-2 transition-transform duration-300 hover:scale-115" />
                        <h1 className="text-3xl font-extrabold text-slate-850 tracking-tight">
                            Solve-X
                        </h1>
                        <p className="text-sm text-slate-500">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col space-y-5">
                        
                        {/* Email Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                Email Address
                            </label>
                            <div className="relative">
                                <input 
                                    {...register('email', { onChange: handleEmailChange })} 
                                    type="email"
                                    placeholder="name@domain.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                    Password
                                </label>
                                <Link 
                                    to="/forgot-password" 
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input 
                                    {...register('password', { onChange: handlePasswordChange })} 
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link 
                            to="/register" 
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                            Sign up
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;