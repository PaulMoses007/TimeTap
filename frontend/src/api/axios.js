import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Vercel's /api rewrite does not forward addresses ending in "/", so send
    // them without it. The backend accepts both forms.
    if (typeof config.url === "string") {
      config.url = config.url.replace(/\/(\?|$)/, "$1");
    }

    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;