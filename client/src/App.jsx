import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import AuthLayout from "@/layouts/AuthLayout";
import DashboadLayout from "./layouts/DashboadLayout";
import Dashboard from "./pages/Dashboard";
import PrivateRoutes from "./components/PrivateRoutes";
import SingleCoursePage from "./pages/SingleCoursePage";
import InstructorRequestDetail from "./pages/InstructorRequestPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { ScrollArea } from "./components/ui/scroll-area";

const App = () => {
  return (
    <ScrollArea className="w-dvw h-dvh overflow-x-hidden scroll-smooth">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Auth Pages */}
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
        </Route>
        {/* Reset Password Page */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage/>}/>
        
        <Route element={<PrivateRoutes />}>
          <Route path="dashboard" element={<DashboadLayout />}>
            <Route path="" element={<Dashboard />} />
            <Route path="courses/:courseId" element={<SingleCoursePage />} />
            <Route
              path="instructors/requests/:userId"
              element={<InstructorRequestDetail />}
            />
          </Route>
        </Route>
      </Routes>
    </ScrollArea>
  );
};

export default App;
