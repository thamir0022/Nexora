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
import MyCourses from "./MyCourses";

const Dashboard = () => {
  const [tab, setTab] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setTab(tabParam);
    }
  }, [searchParams]);

  switch (tab) {
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
    default:
      return <AccountPage />
  }
};

export default Dashboard;
