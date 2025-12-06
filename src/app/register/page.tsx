"use client";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RegisterinitialValues } from "@/utils/initCategory";
import { RegistervalidationSchema } from "@/utils/validateCategory";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (
    values: typeof RegisterinitialValues,
    { setSubmitting, setStatus }: any
  ) => {
    setStatus(null);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone,
          // role removed
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus(
          Array.isArray(data.error) ? data.error.join(", ") : data.error
        );
        toast.error(
          Array.isArray(data.error) ? data.error.join(", ") : data.error,
          { position: "top-right" }
        );
      } else {
        toast.success("Registration successful!", { position: "top-right" });
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2000);
      }
    } catch (err) {
      setStatus("Failed to register. Please try again.");
      toast.error("Failed to register. Please try again.", {
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Side - Welcome Section */}
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
              <svg
                className="w-20 h-20 mb-8"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold mb-8 leading-tight">
              Join Our Admin Team
            </h1>

            <p className="text-xl text-green-50 mb-12 leading-relaxed">
              Create your admin account to get started. Gain access to powerful
              management tools and take control of your platform's operations.
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Secure Registration
                  </h3>
                  <p className="text-green-100 text-sm">
                    Your data is encrypted and protected with industry-standard
                    security
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Full Control</h3>
                  <p className="text-green-100 text-sm">
                    Access comprehensive admin features and customize your
                    experience
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
                  <h3 className="font-bold text-lg mb-1">Quick Setup</h3>
                  <p className="text-green-100 text-sm">
                    Get started in minutes with our streamlined onboarding
                    process
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
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
                Admin Registration
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 mb-8">
                Create your admin account
              </p>

              <Formik
                initialValues={RegisterinitialValues}
                validationSchema={RegistervalidationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, status }) => (
                  <Form className="mt-8 space-y-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Full Name
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        placeholder="John Doe"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        placeholder="admin@example.com"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Phone Number
                      </label>
                      <Field
                        id="phone"
                        name="phone"
                        type="tel"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        placeholder="1234567890"
                      />
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Role
                      </label>
                      <Field
                        as="select"
                        id="role"
                        name="role"
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                      >
                        <option value="admin">Admin</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="doctor">Doctor</option>
                      </Field>
                      <ErrorMessage
                        name="role"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Password
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
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Field
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                          placeholder="Re-enter your password"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="text-red-600 text-xs mt-1"
                      />
                    </div>

                    {status && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium">
                          {status}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg mt-6"
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
                          Creating account...
                        </span>
                      ) : (
                        "Register"
                      )}
                    </button>

                    <p className="text-center text-gray-600 text-sm mt-6">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-green-600 hover:text-green-700 font-semibold transition"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </Form>
                )}
              </Formik>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  By registering, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
