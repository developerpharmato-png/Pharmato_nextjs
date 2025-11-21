"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


export default function ResetPasswordPage() {
    const router = useRouter();
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm router={router} />
        </React.Suspense>
    );
}

function ResetPasswordForm({ router }: { router: ReturnType<typeof useRouter> }) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage("Password reset successful. Redirecting to login...");
                setTimeout(() => router.push("/login"), 2000);
            } else {
                setError(data.error || "Failed to reset password.");
            }
        } catch {
            setError("Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded shadow">
                <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-2"
                            placeholder="Re-enter new password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {message && <p className="text-sm text-green-600">{message}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
