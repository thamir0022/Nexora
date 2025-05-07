import axios from "@/config/axios";
import { useAccessToken } from "./useAccessToken";

const useRefreshToken = () => {
  const { setToken } = useAccessToken();

  const refresh = async () => {
    const response = await axios.get("/auth/refresh", {
      withCredentials: true,
    });
    const newAccessToken = response.data.accessToken;
    setToken(newAccessToken);
    return newAccessToken;
  };
  return refresh;
};

export default useRefreshToken;
