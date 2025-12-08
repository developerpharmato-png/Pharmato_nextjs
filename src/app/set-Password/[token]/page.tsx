"use client";
import React, { useState } from 'react';
// Corrected: Removed unsupported 'next/navigation' imports
import { ToastContainer, toast } from "react-toastify";
// Note: Ensure that the react-toastify styling is included globally in your application 
// since direct CSS imports are not supported in this environment.
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const useRouter = () => ({
    push: (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    },
});

const useParams = (): { token?: string } => {
    if (typeof window === 'undefined') return {};
    try {
        const params = new URLSearchParams(window.location.search);
        const qToken = params.get('token');
        if (qToken) return { token: qToken };
        const path = window.location.pathname || '';
        const parts = path.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        return { token: last };
    } catch (e) {
        return { token: '' };
    }
};
// -----------------------------------------------------------


// Mocked Eye/EyeOff icons using SVG for environment compatibility
const Eye = ({ size = 20, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.06 13C2.8 9.5 6.75 4 12 4s9.2 5.5 9.94 9"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);
const EyeOff = ({ size = 20, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.25 0-9.2-4.5-9.94-8.98"></path>
        <path d="M21 12c-.74 4.48-4.69 8.98-9.94 8.98"></path>
        <path d="M10.15 10.15C10.66 10.36 11.31 10.5 12 10.5c1.1 0 2-.9 2-2c0-.69-.14-1.34-.35-1.85"></path>
        <path d="M2.06 2.06 21.94 21.94"></path>
        <path d="M14.07 4.07 12 7.77 9.93 4.07"></path>
    </svg>
);

const SetPasswordValidationSchema = Yup.object({
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Required'),
    confirm: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Required'),
});

// Exponential Backoff implementation for fetch calls
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            // For non-200 responses, throw an error to trigger retry/catch
            throw new Error(`API returned status ${response.status}`);
        } catch (error) {
            if (i < retries - 1) {
                // Wait exponentially before retrying
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Throw error on last attempt
            }
        }
    }
    throw new Error("API call failed after multiple retries.");
};


export default function SetPasswordPage() {
    const router = useRouter();
    // Use the mocked useParams hook
    const { token } = useParams();
    console.log(token,"tokentoken");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState(""); // For form error/success messages

    const handleSubmit = async (
        values: { password: string, confirm: string },
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        setStatus(""); // Clear previous status
        setSubmitting(true);

        // Simple check to ensure a token is present
        if (!token) {
            const errorMsg = "Invalid or missing reset token. Please ensure you clicked the full link from your email.";
            setStatus(errorMsg);
            toast.error(errorMsg, { position: "top-right" });
            setSubmitting(false);
            return;
        }

        try {
            // Note: The API call endpoint remains the same as provided in the original code.
            const apiUrl = '/api/admins/set-password';

            const res = await fetchWithRetry(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: values.password }),
            });

            const data = await res.json();
            
            if (data.success) {
                const successMsg = "Password set successfully! Redirecting to login...";
                setStatus(successMsg);
                toast.success(successMsg, { position: "top-right" });
                // Simulate router push after successful API call
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const errorMsg = data.message || data.error || 'Failed to set password.';
                setStatus(errorMsg);
                toast.error(errorMsg, { position: "top-right" });
            }
        } catch (err) {
            const errorMsg = 'A network error occurred. Please try again.';
            setStatus(errorMsg);
            toast.error(errorMsg, { position: "top-right" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ToastContainer />
            <div className="min-h-screen flex bg-gray-50">
                {/* Left Side - Welcome Section (Matching Register/Forgot Page) */}
                <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-green-600 via-green-700 to-emerald-800 p-12 items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-10"></div>

                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div
                        className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
                        style={{ animationDelay: "1s" }}
                    ></div>

                    <div className="relative z-10 max-w-lg text-white">
                        <div className="mb-10">
                            <svg className="w-20 h-20 mb-8" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>

                        <h1 className="text-5xl font-bold mb-8 leading-tight">
                            Create Your New Password
                        </h1>

                        <p className="text-xl text-green-50 mb-12 leading-relaxed">
                            A secure, updated password is essential for protecting your administrative access.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                                <div className="bg-white/20 rounded-lg p-2 mr-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6-6v2m12-2v2m-6-6v2m-6 4h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">
                                        Strong Security
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        Choose a password with a minimum of 6 characters for safety.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                                <div className="bg-white/20 rounded-lg p-2 mr-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">
                                        Quick Access
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        Once updated, you'll be redirected to the secure login page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Set Password Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                    <div className="max-w-md w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="bg-linear-to-br from-green-600 to-emerald-700 rounded-2xl p-4">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
                            <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                                Set New Password
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600 mb-8">
                                Please enter and confirm your new password
                            </p>

                            <Formik
                                initialValues={{ password: '', confirm: '' }}
                                validationSchema={SetPasswordValidationSchema}
                                onSubmit={handleSubmit}
                            >
                                {({ isSubmitting, status: formikStatus }) => (
                                    <Form className="mt-8 space-y-5">
                                        {/* Password Field */}
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Field
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                    placeholder="Minimum 6 characters"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={20} />
                                                    ) : (
                                                        <Eye size={20} />
                                                    )}
                                                </button>
                                            </div>
                                            <ErrorMessage name="password" component="div" className="text-red-600 text-xs mt-1" />
                                        </div>

                                        {/* Confirm Password Field */}
                                        <div>
                                            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <Field
                                                    id="confirm"
                                                    name="confirm"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                    placeholder="Re-enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff size={20} />
                                                    ) : (
                                                        <Eye size={20} />
                                                    )}
                                                </button>
                                            </div>
                                            <ErrorMessage name="confirm" component="div" className="text-red-600 text-xs mt-1" />
                                        </div>

                                        {/* General Status Message */}
                                        {status && (
                                            <div 
                                                className={`rounded-lg p-4 text-sm font-medium ${
                                                    status.includes("successfully") ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
                                                }`}
                                            >
                                                <p>{status}</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-3 rounded-lg bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg mt-6"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                                                    <svg
                                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Setting Password...
                                                </span>
                                            ) : (
                                                "Set Password"
                                            )}
                                        </button>
                                    </Form>
                                )}
                            </Formik>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-xs text-center text-gray-500">
                                    <a href="/login" className="text-green-600 hover:text-green-700 font-semibold transition">
                                        Return to Login
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}