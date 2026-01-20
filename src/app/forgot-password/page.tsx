"use client";
import React, { useState } from 'react';
// Corrected: Removed import Link from 'next/link'; and replaced uses with <a>
import { ToastContainer, toast } from "react-toastify";
// Corrected: Removed import "react-toastify/dist/ReactToastify.css";

// Note: Ensure that the react-toastify styling is included globally in your application 
// since direct CSS imports are not supported in this environment.

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    // Using toast for success/error messages to match RegisterPage UX
    const [status, setStatus] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(""); // Clear previous status

        try {
            // Using a simple API key check for demonstration, replace with your actual API endpoint logic
            const apiKey = "" 
            const apiUrl = `/api/auth/forgot-password`;
            
            // Exponential Backoff for API call
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


            const res = await fetchWithRetry(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            
            const data = await res.json();
            
            if (data.success) {
                const successMsg = "If your email exists, a reset link has been sent.";
                setStatus(successMsg);
                toast.success(successMsg, { position: "top-right" });
            } else {
                const errorMsg = data.error || "Failed to send reset link.";
                setStatus(errorMsg);
                toast.error(errorMsg, { position: "top-right" });
            }
        } catch {
            const errorMsg = "A network error occurred. Please try again.";
            setStatus(errorMsg);
            toast.error(errorMsg, { position: "top-right" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer />
            <div className="min-h-screen flex bg-gray-50">
                {/* Left Side - Welcome Section (Copied from RegisterPage) */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-12 items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-10"></div>

                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div
                        className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
                        style={{ animationDelay: "1s" }}
                    ></div>

                    <div className="relative z-10 max-w-lg text-white">
                        <div className="mb-10">
                            {/* Icon matching the Register Page */}
                            <svg
                                className="w-20 h-20 mb-8"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </div>

                        <h1 className="text-5xl font-bold mb-8 leading-tight">
                            Trouble Signing In?
                        </h1>

                        <p className="text-xl text-green-50 mb-12 leading-relaxed">
                            We'll help you get back into your account. Enter your email below to receive instructions.
                        </p>

                        {/* Feature Cards adapted for Forgot Password context */}
                        <div className="space-y-6">
                            <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                                <div className="bg-white/20 rounded-lg p-2 mr-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 4v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">
                                        Secure Email Reset
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        A private, encrypted link will be sent to your inbox.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                                <div className="bg-white/20 rounded-lg p-2 mr-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2v2a2 2 0 01-2 2h-5l-5 5V7a2 2 0 012-2h2a2 2 0 012 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">
                                        Easy Steps
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        Follow the clear instructions to choose a new password quickly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Forgot Password Form (Styled to match RegisterPage) */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                    <div className="max-w-md w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-4">
                                <svg
                                    className="w-12 h-12 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
                            <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                                Reset Password
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600 mb-8">
                                Enter your registered email address
                            </p>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                        placeholder="admin@example.com"
                                    />
                                </div>

                                {/* Status message display matching the RegisterPage alert style */}
                                {status && (
                                    <div 
                                        className={`rounded-lg p-4 text-sm font-medium ${
                                            // Check the message content to determine success/error styling
                                            status.includes("sent") ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
                                        }`}
                                    >
                                        <p>{status}</p>
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg mt-6"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Sending Request...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>

                                <p className="text-center text-gray-600 text-sm mt-6">
                                    {/* Corrected: Replaced <Link> with <a> */}
                                    <a
                                        href="/login"
                                        className="text-green-600 hover:text-green-700 font-semibold transition"
                                    >
                                        Back to Login
                                    </a>
                                </p>
                            </form>
                            
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-xs text-center text-gray-500">
                                    Need further assistance? Contact our support team.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}