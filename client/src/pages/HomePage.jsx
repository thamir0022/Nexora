import React from "react";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const axiosPrivate = useAxiosPrivate(); // ✅ this returns the instance with interceptors
  const { token } = useAccessToken();
  const { user } = useAuth();

  const fetPrivateRoute = async () => {
    try {
      const res = await axiosPrivate.get("/user"); // ✅ use hook's axios instance
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  console.log("TOKEN", token);
  console.log("USER", user);

  return (
    <div>
      HomePage
      <button onClick={fetPrivateRoute}>Retry</button>
    </div>
  );
};

export default HomePage;
