// src/utils/axiosConfig.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true, // Ini yang penting!
});
export default instance;
