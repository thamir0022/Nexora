import { useAuth } from "@/hooks/useAuth";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/sign-in" replace />;
};

export default PrivateRoutes;
