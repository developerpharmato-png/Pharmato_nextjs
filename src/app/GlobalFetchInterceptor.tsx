"use client";
import { useEffect } from "react";

export default function GlobalFetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
          const data = await response.clone().json();
          if (
            data?.success === false &&
            data?.error === "Auth error: Session expired or logged in elsewhere"
          ) {
            document.cookie =
              "access_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            window.location.href = "/";
            return response;
          }
        } catch (e) {}
        return response;
      };
    }
  }, []);
  return null;
}
