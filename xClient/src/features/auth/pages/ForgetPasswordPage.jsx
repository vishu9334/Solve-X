import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForget } from '../hooks/useForgetUser.js';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingOverlay from '../../../shared/components/LoadingOverlay';

const forgetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address format" }),
});

const ForgetPasswordPage = () => {
    const navigate = useNavigate();
    const { mutate: requestReset, isPending } = useForget();
    const { register, handleSubmit } = useForm({
        resolver: zodResolver(forgetPasswordSchema),
        mode: "onTouched",
    });

    const handleEmailChange = (e) => {
        if (e.target.value === '') {
            toast.error("Email is required", { toastId: 'email' });
        }
    };

    const onSubmit = (data) => {
        requestReset(data.email);
    };

    const onError = (formErrors) => {
        Object.keys(formErrors).forEach((field) => {
            toast.error(formErrors[field].message, { toastId: field });
        });
    };

    return (
        <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-white py-3 pl-4 items-center justify-center relative font-raleway">
            <LoadingOverlay isLoading={isPending} message="Requesting password reset..." />
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
                                src="https://lottie.host/33e5a280-e056-437b-ae31-38a089b2f681/PBU9GxqLJl.lottie"
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

            {/* Right Side - Forget Password Form */}
            <div className="w-full md:w-1/2 h-full md:pr-3 flex items-center justify-center overflow-y-auto px-4 py-8" data-lenis-prevent>
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl flex flex-col space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center space-y-2">
                        <img src="/logo.png" alt="Solve-X Logo" className="w-16 h-16 object-contain mb-2 transition-transform duration-300 hover:scale-115" />
                        <h1 className="text-3xl font-extrabold text-slate-850 tracking-tight">
                            Forget Password
                        </h1>
                        <p className="text-sm text-slate-500 text-center">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col space-y-5">
                        
                        {/* Email Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="yourname@example.com"
                                    {...register("email")}
                                    onChange={handleEmailChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3D3B93]/20 focus:border-[#3D3B93] transition-all duration-200 text-sm font-raleway text-slate-880"
                                />
                                <span className="absolute left-3.5 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-[#3D3B93] text-white font-bold text-sm tracking-wide shadow-md shadow-[#3D3B93]/20 hover:bg-[#2C2A7A] hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer"
                        >
                            Send Reset Link
                        </button>
                    </form>

                    {/* Footer / Links */}
                    <div className="flex justify-center text-sm font-medium">
                        <Link to="/login" className="text-[#3D3B93] hover:text-[#2C2A7A] hover:underline transition-colors">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgetPasswordPage;
