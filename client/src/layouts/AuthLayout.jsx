import React from "react";
import { Outlet } from "react-router-dom";
import bgVideo from "@/assets/videos/bg.mp4";

const AuthLayout = () => {
  return (
    <section className="w-dvw h-dvh grid grid-cols-2">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="place-center">
        <Outlet />
      </div>
    </section>
  );
};

export default AuthLayout;
