import axios from "axios";

// Falls back to the previous hardcoded production URL so behavior is
// unchanged if VITE_API_BASE_URL isn't set.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://smartpal.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;
