import { axiosPrivate } from "@/config/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useAccessToken } from "./useAccessToken";
import { useAuth } from "./useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Shared across all hook calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const useAxiosPrivate = () => {
  const refresh = useRefreshToken();
  const { token, setToken } = useAccessToken();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already retried
        if (error?.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (isRefreshing) {
            // Wait for the refresh to complete
            return new Promise((resolve, reject) => {
              failedQueue.push({
                resolve: (token) => {
                  originalRequest.headers["Authorization"] = `Bearer ${token}`;
                  resolve(axiosPrivate(originalRequest));
                },
                reject: (err) => reject(err),
              });
            });
          }

          isRefreshing = true;

          try {
            const newAccessToken = await refresh();
            setToken(newAccessToken);
            processQueue(null, newAccessToken);
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);

            const message =
              refreshError?.response?.data?.message || "Session expired";

            toast.error(message, {
              description: "Please sign in again.",
              duration: 5000,
            });

            setUser(null);
            navigate(
              `/sign-in?from=${encodeURIComponent(location.pathname)}${
                location.search
              }`
            );

            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [token, refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;
