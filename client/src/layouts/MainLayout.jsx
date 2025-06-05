import Footer from "@/components/footer";
import Header from "@/components/Header";
import React from "react";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <main className="size-full!">
      <Header />
      <Outlet />
      <Footer />
    </main>
  );
};

export default MainLayout;
