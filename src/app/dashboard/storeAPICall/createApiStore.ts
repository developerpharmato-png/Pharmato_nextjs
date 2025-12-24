import { create } from "zustand";
// Devtools middleware import removed due to resolution error.


import type { AxiosError } from "axios";
import api from "./API/api";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

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
): Promise<T | void> {
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
      fetchData: (params?: Record<string, any>) => Promise<T | undefined>;
      postData: (url: string, body: any) => Promise<T | undefined>;
      postBlob: (url: string, body: any) => Promise<Blob | undefined>;
      putData: (url: string, body: any) => Promise<T | undefined>;
      patchData: (url: string, body: any) => Promise<T | undefined>;
      clearData: () => void;
      setData: (data: T) => void;
    }
  >((set) => ({
    data: null,
    loading: false,
    error: null,

    fetchData: async (params = {}) => {
      set({ loading: true, error: null });
      try {
        const url = (params as any)?.url as string;
        const data = (params as any)?.data;
        const isAbsolute = /^https?:\/\//i.test(url || '');
        const isPath = (url || '').startsWith("/");
        const finalUrl = isAbsolute
          ? url
          : isPath && typeof window !== "undefined"
            ? `${window.location.origin}${url}`
            : url;

        // If data is provided, use POST instead of GET
        const response = data
          ? await api.post<T>(finalUrl, data)
          : await api.get<T>(finalUrl);
        set({ data: response.data, loading: false });
        return response.data;
      } catch (error: any) {
        handleUnauthorizedError(error);
        set({ error: error.message, loading: false });
        throw error;
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
        return response.data;
      } catch (error: any) {
        handleUnauthorizedError(error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },
    // POST expecting binary/blob response (e.g., file export)
    postBlob: async (url: string, body: any) => {
      set({ loading: true, error: null });
      try {
        const isAbsolute = /^https?:\/\//i.test(url);
        const isPath = url.startsWith("/");
        const finalUrl = isAbsolute
          ? url
          : isPath && typeof window !== "undefined"
            ? `${window.location.origin}${url}`
            : url;

        const response = await api.post(finalUrl, body, { responseType: 'blob' });
        set({ loading: false });
        return response.data as Blob;
      } catch (error: any) {
        handleUnauthorizedError(error);
        set({ error: error?.message || String(error), loading: false });
        throw error;
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
        return response.data;
      } catch (error: any) {
        handleUnauthorizedError(error);
        set({ error: error.message, loading: false });
        throw error;
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
        return response.data;
      } catch (error: any) {
        handleUnauthorizedError(error);
        set({ error: error.message, loading: false });
      }
    },

    clearData: () => set({ data: null, error: null }),
    setData: (data: T) => set({ data }),
  }));
}
