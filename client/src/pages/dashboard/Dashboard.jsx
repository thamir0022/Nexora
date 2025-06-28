import CoursesList from "./CourseList";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AccountPage from "./AccountPage/account-page";
import PendingInstructorsPage from "./PendingInstructorsPage";
import AllUsersPage from "./UsersList";
import CategoryPage from "./CategoryPage";
import AddCoursePage from "./CreateCoursePage";
import OfferManagementPage from "./OfferPage";
import CouponManagementPage from "./CouponManagementPage";
import MyCourses from "./MyCoursePage/MyCourses";
import Overview from "./Overview/index";
import EnrollmentsList from "./EnrollmentList";
import MyCertificatesPage from "../my-certificate-page";

const Dashboard = () => {
  const [tab, setTab] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setTab(tabParam || "");
    }
  }, [searchParams]);

  switch (tab) {
    case "overview":
      return <Overview />;
    case "courses":
      return <CoursesList />;
    case "my-courses":
      return <MyCourses />;
    case "users":
      return <AllUsersPage />;
    case "account":
      return <AccountPage />;
    case "pending-instructors":
      return <PendingInstructorsPage />;
    case "create-course":
      return <AddCoursePage />;
    case "categories":
      return <CategoryPage />;
    case "offers":
      return <OfferManagementPage />;
    case "coupon":
      return <CouponManagementPage />;
    case "enrollments":
      return <EnrollmentsList />;
    case "certificates":
      return <MyCertificatesPage />;
    default:
      return <Overview />
  }
};

export default Dashboard;
