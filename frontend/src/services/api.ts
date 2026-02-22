import axios from "axios";
import type { AuthTokens } from "@/types";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach access token
api.interceptors.request.use(
    (config) => {
        const tokensRaw = localStorage.getItem("tokens");
        if (tokensRaw) {
            const tokens: AuthTokens = JSON.parse(tokensRaw);
            config.headers.Authorization = `Bearer ${tokens.access}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const tokensRaw = localStorage.getItem("tokens");
            if (!tokensRaw) {
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const tokens: AuthTokens = JSON.parse(tokensRaw);
                const response = await axios.post("/api/v1/auth/token/refresh/", {
                    refresh: tokens.refresh,
                });

                const newTokens: AuthTokens = response.data;
                localStorage.setItem("tokens", JSON.stringify(newTokens));
                originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

                return api(originalRequest);
            } catch {
                localStorage.removeItem("tokens");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
