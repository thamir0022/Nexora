import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import AuthLayout from "@/layouts/AuthLayout";
import DashboadLayout from "./layouts/DashboadLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import PrivateRoutes from "./components/PrivateRoutes";
import InstructorRequestDetail from "./pages/InstructorRequestPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import { ScrollArea } from "./components/ui/scroll-area";
import SingleUserPage from "./pages/dashboard/SingleUserPage";
import InstructorSingleCoursePage from "./pages/courses/instructor/CourseDetailsPage";
import StudentSingleCoursePage from "./pages/courses/student/single-course-page/index";
import MainLayout from "./layouts/MainLayout";
import CertificatePage from "./pages/CertificatePage";
import CoursesPage from "./pages/AllCourses";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <ScrollArea className="w-dvw h-dvh overflow-x-hidden scroll-smooth">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/certificate/:certificateId" element={<CertificatePage />} />
        </Route>

        {/* Auth Pages */}
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
        </Route>

        {/* Reset Password Page */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Private Routes */}
        <Route element={<PrivateRoutes />}>
          {/* Dashboard */}
          <Route path="dashboard" element={<DashboadLayout />}>
            <Route path="" element={<Dashboard />} />
            <Route element={<PrivateRoutes role="admin" />}>
              <Route
                path="instructors/requests/:userId"
                element={<InstructorRequestDetail />}
              />
              <Route
                path="users/:userId"
                element={<SingleUserPage />}
              />
            </Route>

            <Route element={<PrivateRoutes role="instructor" />}>
              <Route
                path="courses/:courseId"
                element={<InstructorSingleCoursePage />}
              />
            </Route>
          </Route>
          <Route element={<MainLayout />}>
            {/* Student Course View */}
            <Route path="courses/:courseId" element={<StudentSingleCoursePage />} />
            <Route path="courses/:courseId/:lessonId" element={<StudentSingleCoursePage />} />
          </Route>
        </Route>
      </Routes>
    </ScrollArea>
  );
};

export default App;
