import React from "react";
import { Outlet } from "react-router-dom";
import bgVideo from "@/assets/videos/bg.mp4";

const AuthLayout = () => {
  return (
    <section className="w-dvw h-dvh max-md:place-center md:grid md:grid-cols-2">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="max-md:hidden w-full h-full object-cover"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <Outlet />
    </section>
  );
};

export default AuthLayout;
