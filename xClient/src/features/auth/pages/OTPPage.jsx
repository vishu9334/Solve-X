import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useVerificationOtp, useResendOtp } from '../hooks/useOtp.js';
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Link, useSearchParams, useNavigate } from "react-router-dom"; 
import { verifyOtpValidator } from '../../validations/auth.schema.js'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LoadingOverlay from '../../../shared/components/LoadingOverlay';

const OTPVerificationPage = () => {
    const navigate = useNavigate();
    const { mutate: verification, isPending } = useVerificationOtp();
    const { mutate: resendOtp, isPending: isResending } = useResendOtp();
    const [searchParams] = useSearchParams()
    const emailParam = searchParams.get('email')
    const emailFromUrl = emailParam === 'undefined' ? '' : (emailParam || '')
    
    const { register, handleSubmit, setValue } = useForm({
        resolver: zodResolver(verifyOtpValidator),
        mode: "onTouched",
        defaultValues:{
            email: emailFromUrl
        }
    });

    const [otpValues, setOtpValues] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    useEffect(() => {
        if (emailFromUrl) {
            setValue("email", emailFromUrl);
        }
    }, [emailFromUrl, setValue]);

    const handleResend = () => {
        if (timer > 0 || isResending) return;
        const email = emailFromUrl || "";
        if (!email) {
            toast.error("Email is required to resend OTP");
            return;
        }
        resendOtp({ email }, {
            onSuccess: () => {
                setTimer(60);
            }
        });
    };

    const handleOtpChange = (index, value) => {
        if (value !== "" && !/^\d$/.test(value)) return;

        const newOtpValues = [...otpValues];
        newOtpValues[index] = value;
        setOtpValues(newOtpValues);

        const combinedOtp = newOtpValues.join("");
        setValue("otp", combinedOtp, { shouldValidate: true });

        if (value !== "" && index < 3) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (otpValues[index] === "" && index > 0) {
                const prevInput = document.getElementById(`otp-input-${index - 1}`);
                if (prevInput) {
                    prevInput.focus();
                    const newOtpValues = [...otpValues];
                    newOtpValues[index - 1] = "";
                    setOtpValues(newOtpValues);
                    setValue("otp", newOtpValues.join(""), { shouldValidate: true });
                }
            } else {
                const newOtpValues = [...otpValues];
                newOtpValues[index] = "";
                setOtpValues(newOtpValues);
                setValue("otp", newOtpValues.join(""), { shouldValidate: true });
            }
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (/^\d{4}$/.test(pastedData)) {
            const newOtpValues = pastedData.split("");
            setOtpValues(newOtpValues);
            setValue("otp", pastedData, { shouldValidate: true });
            
            const lastInput = document.getElementById("otp-input-3");
            if (lastInput) lastInput.focus();
        }
    };

    const onSubmit = (data) => {
        verification(data);
        setOtpValues(["", "", "", ""]);
        setValue("otp", "");
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
    };

    const onError = (formErrors) => {
        Object.keys(formErrors).forEach((field) => {
            toast.error(formErrors[field].message, { toastId: field });
        });
    };

    return (
        <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-white p-4 md:p-6 items-center justify-center">
            <LoadingOverlay isLoading={isPending || isResending} message={isResending ? "Resending verification code..." : "Verifying your account..."} />
            
            {/* Left Side - Hero / Brand Box */}
            <div className="w-full md:w-1/2 h-[350px] md:h-full min-h-[300px] md:min-h-[500px] flex justify-center items-center rounded-3xl bg-gradient-to-b from-[#3D3B93] via-[#ECD7AD] to-[#FFFFFE] p-6">
                <div className="w-[90%] h-full flex items-center justify-between flex-col">
                    <div className="flex flex-col items-center space-y-2">
                        <img src="/logo.png" alt="Solve-X Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain transition-transform duration-300 hover:scale-110" />
                        <p className="text-3xl md:text-5xl font-bold text-white font-raleway">Solve-X</p>
                    </div>
                    <div className="w-full flex-1 flex items-center justify-center py-4">
                        <div className="w-[60%] md:w-[80%] max-w-[200px] md:max-w-sm aspect-square">
                            <DotLottieReact
                                src="https://lottie.host/ed633c05-b309-4232-b940-7dbd3ba81e84/Q11ajeXfdv.lottie"
                                loop
                                autoplay
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    <footer className="w-full flex justify-between items-center text-[10px] md:text-[11px] text-slate-600 font-raleway py-3 border-t border-slate-200/50">
                        <p>© 2026 Solve-X. All rights reserved.</p>
                        <div className="flex space-x-4">
                            <Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
                            <Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Right Side - OTP Verification Form */}
            <section className="w-full md:w-1/2 h-auto md:h-full flex flex-col justify-center items-center px-4 md:px-8 py-6 md:py-0">
                <div className="w-full max-w-md flex flex-col items-center">
                    
                    {/* Back Button in normal document flow */}
                    <button 
                        onClick={() => navigate(-1)}
                        className="self-start mb-6 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all duration-200 cursor-pointer"
                        aria-label="Go Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    
                    {/* Header */}
                    <div className="w-full flex justify-center items-center flex-col text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold font-raleway text-[#4853F8]">
                            Verification <span className="font-architects-daughter">With</span>
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 font-raleway mt-2">
                            Enter your email and the 4-digit OTP to verify your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="w-full flex flex-col space-y-5">
                        
                        {/* Email Input */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-raleway">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="name@domain.com"
                                {...register('email')}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4853F8]/50 focus:border-transparent transition-all duration-200 text-sm font-raleway"
                            />
                        </div>

                        {/* OTP Input - 4 Square Boxes */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-raleway text-center">
                                OTP Code
                            </label>
                            
                            {/* Hidden input for react-hook-form validation */}
                            <input type="hidden" {...register('otp')} />

                            {/* 4 Custom Square OTP Inputs (type="text") */}
                            <div className="flex gap-4 justify-center items-center py-2" onPaste={handleOtpPaste}>
                                {otpValues.map((val, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-input-${idx}`}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={val}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        className="w-12 h-12 md:w-14 md:h-14 border-2 border-slate-200 rounded-2xl text-center text-xl md:text-2xl font-bold text-slate-800 focus:border-[#4853F8] focus:ring-2 focus:ring-[#4853F8]/20 outline-none transition-all duration-200"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-[#4853F8] hover:bg-[#3540de] text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-4 font-raleway text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Verify'
                            )}
                        </button>

                        {/* Resend OTP Section */}
                        <div className="flex flex-col items-center space-y-2 pt-2">
                            <p className="text-xs text-slate-500 font-raleway">
                                Didn't receive the code?
                            </p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={timer > 0 || isResending}
                                className={`text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                    timer > 0 || isResending
                                        ? "text-slate-400 cursor-not-allowed"
                                        : "text-[#4853F8] hover:text-[#3540de] hover:underline"
                                }`}
                            >
                                {isResending ? (
                                    <span className="flex items-center gap-1.5 justify-center">
                                        <svg className="animate-spin h-3.5 w-3.5 text-[#4853F8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resending...
                                    </span>
                                ) : timer > 0 ? (
                                    `Resend Code in ${timer}s`
                                ) : (
                                    "Resend OTP"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
};
export default OTPVerificationPage;