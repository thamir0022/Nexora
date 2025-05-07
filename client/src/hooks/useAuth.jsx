import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export const useAuth = () => {
  const { user, setUser } = useContext(AuthContext);
  return { user, setUser };
};
