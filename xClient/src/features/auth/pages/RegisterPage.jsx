import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerZodValidator } from '../../validations/auth.schema';
import { useRegister } from '../hooks/useRegister';
import { toast } from 'react-toastify';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingOverlay from '../../../shared/components/LoadingOverlay';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const defaultRole = searchParams.get('role') || 'student';

    const { mutate: registerUser, isPending } = useRegister();
    const { register, handleSubmit } = useForm({
        resolver: zodResolver(registerZodValidator),
        mode: "onTouched",
        defaultValues: {
            role: defaultRole
        }
    });

    const handleNameChange = (e) => {
        if (e.target.value === '') {
            toast.error("Name is required", { toastId: 'name' });
        }
    };

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
        registerUser(data);
    };

    const onError = (formErrors) => {
        Object.keys(formErrors).forEach((field) => {
            toast.error(formErrors[field].message, { toastId: field });
        });
    };

    return (
        <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-white py-3 pl-4 items-center justify-center relative">
            <LoadingOverlay isLoading={isPending} message="Creating your account..." />
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
                    <div className="w-full h-[30%] flex items-center justify-center flex-col text-center">
                        <h1 className="text-4xl text-black">
                            Get Doubt Question{' '}
                            <span className="relative inline-block font-edu-vic-wa-nt-beginner">
                                Anywhere
                                <svg className="absolute left-0 bottom-[-8px] w-full h-[8px] pointer-events-none overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <motion.path
                                        d="M0,5 Q50,10 100,3"
                                        stroke="#3D3B93"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
                                    />
                                </svg>
                            </span>
                        </h1>
                        <p className="text-sm text-black/90 font-raleway mt-2">
                            Your ultimate interactive space to get doubts resolved instantly by expert mentors, ensuring your learning never stops.
                        </p>
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

            {/* Right Side - Register Form */}
            <div className="w-full md:w-1/2 h-full md:pr-3 flex items-center justify-center overflow-y-auto px-4 py-8" data-lenis-prevent>
                <div className="w-full max-w-md p-8 flex flex-col space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center space-y-2">
                        <img src="/logo.png" alt="Solve-X Logo" className="w-16 h-16 object-contain mb-2 transition-transform duration-300 hover:scale-115" />
                        <h1 className="text-4xl font-bold font-raleway text-[#4853F8]">
                            Sign up <span className="font-architects-daughter">With</span>
                        </h1>
                        <p className="text-sm text-slate-500">
                            Create your account to get started.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col space-y-4">
                        
                        {/* Name Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                Full Name
                            </label>
                            <input 
                                {...register('name', { onChange: handleNameChange })} 
                                type="text"
                                placeholder="John Doe"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                Email Address
                            </label>
                            <input 
                                {...register('email', { onChange: handleEmailChange })} 
                                type="email"
                                placeholder="name@domain.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                Password
                            </label>
                            <input 
                                {...register('password', { onChange: handlePasswordChange })} 
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>

                        {/* Role Select Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                                Register As
                            </label>
                            <select 
                                {...register('role')}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm cursor-pointer [&>option]:bg-white [&>option]:text-slate-800"
                            >
                                <option value="student">Student</option>
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Registering...</span>
                                </div>
                            ) : (
                                'Register'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link 
                            to="/login" 
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                            Sign in
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegisterPage;