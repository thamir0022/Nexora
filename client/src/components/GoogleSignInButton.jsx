import axios from "@/config/axios";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignInButton = ({text = "signin"}) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { setToken } = useAccessToken();

  const onSuccess = async (googleCredential) => {
    const res = await axios.post("/auth/google", {
      credential: googleCredential.credential,
    });

    if (!res.data.success) {
      return toast.error(res.data.message || "Something went wrong!");
    }

    setUser(res.data.user);
    setToken(res.data.accessToken);
    toast.success("Login Successful!");

    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const onError = (error) => {
    toast.error(error.message || "Login Failed");
    console.log(error);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        shape="pill"
        ux_mode="popup"
        text={text === "signin" ? "signin_with" : "signup_with"}
      >
        <FcGoogle className="size-full" />
      </GoogleLogin>
    </GoogleOAuthProvider>
  );
};

export default GoogleSignInButton;
