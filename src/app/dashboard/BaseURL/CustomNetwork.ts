import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

// Generic GET request
export async function customGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axios.get<T>(url, config);
}

// Generic POST request with built-in toast
export async function customPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    const res = await axios.post<T>(url, data, config);
    // Generic toast for { success, message } API response
    const responseData: any = res.data;
    if (typeof responseData?.success !== 'undefined' && typeof responseData?.message === 'string') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: responseData.success ? 'success' : 'error',
        title: responseData.message,
        showConfirmButton: false,
        timer: 2000,
      });
    }
    return res;
  } catch (err: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err?.response?.data?.message || err?.message || 'Request failed',
      showConfirmButton: false,
      timer: 2000,
    });
    throw err;
  }
}
