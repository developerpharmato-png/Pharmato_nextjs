


import axios from "axios";


export const BaseApi = "";

const api = axios.create({
  baseURL: BaseApi,
  timeout: 10000,
  withCredentials: true,
});



export default api;