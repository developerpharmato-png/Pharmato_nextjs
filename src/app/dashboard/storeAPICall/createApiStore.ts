import { create } from "zustand";
import { devtools } from "zustand/middleware";


import type { AxiosError } from "axios";
import api from "./API/api";


const handleUnauthorizedError = (error: AxiosError | any) => {
  if (error?.response?.status === 401) {
    localStorage.clear();
    window.location.href = "/";
  }
  if (error?.response?.status === 405) {
    handleAuthRefreshAndRetry(error);
  }
};

async function handleAuthRefreshAndRetry<T>(
  originalRequest: () => Promise<any>
): Promise<T> {
  const refreshToken = localStorage.getItem("REFRESH_TOKEN_KEY");

  // if (!refreshToken) {
  //   handleUnauthorizedError({ response: { status: 401 } });
  //   throw new Error("Missing Refresh Token");
  // }

  // try {
  //   const refreshResponse = await api.post(REFRESH_TOKEN_URL, {
  //     refreshToken: refreshToken,
  //   });

  //   const newAccessToken = refreshResponse.data.accessToken;

  //   api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
  //   localStorage.setItem("accessToken", newAccessToken);

  //   return await originalRequest();
  // } catch (refreshError: any) {
  //   handleUnauthorizedError(refreshError);
  //   throw refreshError;
  // }
}

export function createApiStore<T>() {
  return create<
    ApiState<T> & {
      fetchData: (params?: Record<string, any>) => Promise<void>;
      postData: (url: string, body: any) => Promise<void>;
      putData: (url: string, body: any) => Promise<void>;
      patchData: (url: string, body: any) => Promise<void>;
      clearData: () => void;
      setData: (data: T) => void;
    }
  >()(
    devtools((set) => ({
      data: null,
      loading: false,
      error: null,

      fetchData: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const response = await api.get<T>(params?.url);
          set({ data: response.data, loading: false });
        } catch (error: any) {
          handleUnauthorizedError(error);
          set({ error: error.message, loading: false });
        }
      },

      postData: async (url, body) => {
        set({ loading: true, error: null });
        try {
          const isAbsolute = /^https?:\/\//i.test(url);
          const isPath = url.startsWith("/");
          const finalUrl = isAbsolute
            ? url
            : isPath && typeof window !== "undefined"
              ? `${window.location.origin}${url}`
              : url;

          const response = await api.post<T>(finalUrl, body);
          set({ data: response.data, loading: false });
        } catch (error: any) {
          handleUnauthorizedError(error);
          set({ error: error.message, loading: false });
        }
      },

      putData: async (url, body) => {
        set({ loading: true, error: null });
        try {
          const isAbsolute = /^https?:\/\//i.test(url);
          const isPath = url.startsWith("/");
          const finalUrl = isAbsolute
            ? url
            : isPath && typeof window !== "undefined"
              ? `${window.location.origin}${url}`
              : url;

          const response = await api.put<T>(finalUrl, body);
          set({ data: response.data, loading: false });
        } catch (error: any) {
          handleUnauthorizedError(error);
          set({ error: error.message, loading: false });
        }
      },

      patchData: async (url, body) => {
        set({ loading: true, error: null });
        try {
          const isAbsolute = /^https?:\/\//i.test(url);
          const isPath = url.startsWith("/");
          const finalUrl = isAbsolute
            ? url
            : isPath && typeof window !== "undefined"
              ? `${window.location.origin}${url}`
              : url;

          const response = await api.patch<T>(finalUrl, body);
          set({ data: response.data, loading: false });
        } catch (error: any) {
          handleUnauthorizedError(error);
          set({ error: error.message, loading: false });
        }
      },

      clearData: () => set({ data: null, error: null }),
      setData: (data: T) => set({ data }),
    }))
  );
}
