import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = ({ role = "all" }) => {
  const { user } = useAuth();

  // Not logged in
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role === "admin") return <Outlet />

  // Logged in but doesn't have correct role
  if (role !== "all" && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
