import { axiosPrivate } from "@/config/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useAccessToken } from "./useAccessToken";
import { useAuth } from "./useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
        const prevRequest = error?.config;

        // Access token expired → try refresh
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;
          try {
            const newAccessToken = await refresh();
            setToken(newAccessToken);
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            // Refresh token failed → handle logout
            const message = refreshError?.response?.data?.message;
            toast.error("Session expired", {
              description: message || "Please log in again.",
            });
            navigate(
              `/sign-in?from=${encodeURIComponent(location.pathname)}${
                location.search
              }`
            );

            setUser(null);

            return Promise.reject(refreshError);
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
