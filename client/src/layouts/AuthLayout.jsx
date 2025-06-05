import React from "react";
import { Outlet } from "react-router-dom";
import bgVideo from "@/assets/videos/bg.mp4";
import BrandLogo from "@/components/BrandLogo";

const AuthLayout = () => (
  <div className="h-screen max-md:place-center md:grid grid-cols-2">
    {/* Logo for mobile */}
    <div className="absolute top-4 left-4 z-10">
      <BrandLogo/>
    </div>

    {/* Left side - Video (hidden on mobile) */}
    <div className="max-md:hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      <p className="absolute w-1/2 bottom-10  text-center text-white text-sm px-4">
        Join thousands of students learning new skills today
      </p>
    </div>
    <Outlet />
  </div>
);

export default AuthLayout;
