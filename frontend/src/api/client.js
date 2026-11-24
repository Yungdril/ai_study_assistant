import axios from "axios";
import { auth } from "../firebase/config";

// Falls back to the previous production URL when no API URL is configured.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://smartpal.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;