import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export const useAccessToken = () => {
  const { token, setToken } = useContext(AuthContext);
  return { token, setToken };
};
