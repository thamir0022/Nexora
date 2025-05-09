import Header from "@/components/Header";
import AppSidebar from "@/components/Siderbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <section className="w-dvw flex">
        {/* Sidebar */}
        <AppSidebar className="h-full" />
        {/* Main Dashboard Outlet */}
        <main className="h-full flex-1">
          <SidebarInset className="p-4 bg-inherit">
            <Outlet />
          </SidebarInset>
        </main>
      </section>
    </SidebarProvider>
  );
};

export default DashboardLayout;
