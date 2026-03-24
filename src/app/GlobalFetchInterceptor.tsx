"use client";
import { useEffect } from "react";
import axios from "axios";

export default function GlobalFetchInterceptor() {
  
  useEffect(() => {
    console.log("ssdfdfgdf");
    
    if (typeof window !== "undefined") {
      const isAuthPage = window.location.pathname === "/" || window.location.pathname === "/login";

      // Axios interceptor for 401 errors
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          const isLoginApi = error.config?.url?.includes("/api/auth/login");
          if (error?.response?.status === 401 && !isAuthPage && !isLoginApi) {
            window.location.href = "/";
          }
          return Promise.reject(error);
        }
      );

      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        const isLoginApi = url.includes("/api/auth/login");
        
        const response = await originalFetch(...args);
        
        if (response.status === 401 && !isAuthPage && !isLoginApi) {
          window.location.href = "/";
          return response;
        }
        try {
          const data = await response.clone().json();
          if (
            data?.success === false &&
            data?.error === "Auth error: Session expired or logged in elsewhere"
          ) {
            // Clear all cookies and localStorage
            document.cookie =
              "access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie =
              "accessToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie =
              "refreshToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            localStorage.removeItem("admin");
            localStorage.removeItem("adminPermissions");
            window.location.href = "/login";
            return response;
          }
        } catch (e) {}
        return response;
      };
    }
  }, []);
  return null;
}
