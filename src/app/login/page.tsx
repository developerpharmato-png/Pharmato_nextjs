"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import { LoginSchema } from "@/utils/validateCategory";
import { requestPermissionAndGetToken } from "@/app/firebase/firebaseConfig";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  // Yup Validation Schema


  return (
    <>
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Side - Welcome Section */}
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
              <svg
                className="w-20 h-20 mb-8"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="text-5xl font-bold mb-8 leading-tight">
              Welcome Back to Your Admin PortaL
            </h1>

            <p className="text-xl text-green-50 mb-12 leading-relaxed">
              Manage your entire platform with powerful administrative tools.
              Access comprehensive analytics, user management, and real-time
              insights all in one secure dashboard.
            </p>

            <div className="space-y-6">
              <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="bg-white/20 rounded-lg p-2 mr-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Enterprise Security
                  </h3>
                  <p className="text-green-100 text-sm">
                    Bank-level encryption and multi-factor authentication
                    protect your data
                  </p>
                </div>
              </div>

              <div className="flex items-start bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="bg-white/20 rounded-lg p-2 mr-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Lightning performance
                  </h3>
                  <p className="text-green-100 text-sm">
                    Optimized infrastructure ensures instant response times
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="max-w-md w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="bg-linear-to-br from-green-600 to-emerald-700 rounded-2xl p-4">
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
                Admin Login
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 mb-8">
                Sign in to access the dashboard
              </p>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={LoginSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    // attempt to get FCM device token (may return undefined)
                    let deviceToken: string | undefined = undefined;
                    if (typeof window !== "undefined" && typeof requestPermissionAndGetToken === "function") {
                      deviceToken = await requestPermissionAndGetToken();
                    }
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...values, deviceToken }),
                    });

                    const data = await res.json();

                    if (!data.success) {
                      Swal.fire({
                        icon: "error",
                        title: "Login Failed",
                        text: data.error || ToastMessages.INVALID_CREDENTIALS,
                        showConfirmButton: true,
                        confirmButtonText: "OK",
                        confirmButtonColor: "#16a34a",
                      });
                    } else {
                      // Store all admin data
                      localStorage.setItem("admin", JSON.stringify(data.data));

                      // Store individual fields for quick access
                      localStorage.setItem("adminId", data.data._id);
                      localStorage.setItem("adminEmail", data.data.email);
                      localStorage.setItem("adminName", data.data.name);
                      localStorage.setItem("roleId", data.data.roleId);
                      localStorage.setItem("roleName", data.data.roleName);
                      localStorage.setItem("sessionToken", data.data.sessionToken);
                      if (data.data.deviceToken) {
                        localStorage.setItem("deviceToken", data.data.deviceToken);
                      }
                      localStorage.setItem("managedStores", JSON.stringify(data.data.managedStores || []));

                      // fetch role permissions and store them locally for the UI
                      try {
                        const roleId = data.data?.roleId;
                        if (roleId) {
                          const permRes = await fetch(`/api/admin/role-permission/${roleId}`);
                          const permJson = await permRes.json();
                          const perms = permJson?.data?.permissions ?? permJson?.data ?? {};
                          localStorage.setItem('adminPermissions', JSON.stringify(perms));
                        } else {
                          // clear any previous permissions
                          localStorage.removeItem('adminPermissions');
                        }
                      } catch (e) {
                        // ignore permission fetch errors; UI will default
                        console.error('Failed to load role permissions', e);
                      }
                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: ToastMessages.LOGIN_SUCCESS,
                        showConfirmButton: false,
                        timer: 2000,
                      });

                      setTimeout(() => {
                        router.push("/dashboard/NewDashboard");
                      }, 1000);
                    }
                  } catch (err) {
                    Swal.fire({
                      toast: true,
                      position: "top-end",
                      icon: "error",
                      title: "Network error. Try again.",
                      showConfirmButton: false,
                      timer: 2000,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-8 space-y-6">
                    {/* Email Field */}
                    <div>
                      <label className="text-gray-700 text-sm font-semibold block mb-2">
                        Email
                      </label>
                      <Field
                        type="email"
                        name="email"
                        placeholder="admin@example.com"
                        className="w-full mt-1 px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-600 text-xs mt-2 font-medium"
                      />
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="text-gray-700 text-sm font-semibold block mb-2">
                        Password
                      </label>

                      <div className="relative mt-1">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter password"
                          className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        />

                        {/* Eye Icon */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                        >
                          {showPassword ? (
                            <EyeOffIcon size={20} />
                          ) : (
                            <EyeIcon size={20} />
                          )}
                        </button>
                      </div>

                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-red-600 text-xs mt-2 font-medium"
                      />


                    </div>

                    {/* Submit Button */}
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
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </button>


                  </Form>
                )}
              </Formik>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  Protected by enterprise-grade security. By signing in, you
                  agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
