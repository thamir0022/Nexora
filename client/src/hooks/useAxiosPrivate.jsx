import { axiosPrivate } from "@/config/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useAccessToken } from "./useAccessToken";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

const useAxiosPrivate = () => {
  const refresh = useRefreshToken();
  const { token } = useAccessToken();
  const {setUser} = useAuth();
  const navigate = useNavigate();
  
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

        // If access token expired
        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;

          try {
            const newAccessToken = await refresh();
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            // If refresh token is invalid or expired
            if (
              refreshError?.response?.status === 401 ||
              refreshError?.response?.status === 403
            ) {
              setUser(null); // Clear auth state
              navigate("/sign-in"); // Redirect to login
            }

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
