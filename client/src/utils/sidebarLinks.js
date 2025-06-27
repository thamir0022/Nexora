import {
  CiBellOn,
  CiBoxes,
  CiChat1,
  CiChat2,
  CiDiscount1,
  CiFileOn,
  CiFolderOn,
  CiGrid42,
  CiHeart,
  CiHome,
  CiSettings,
  CiShoppingTag,
  CiUser,
  CiViewList,
} from "react-icons/ci";

const sub = [
  {
    title: "Account",
    url: "/dashboard?tab=account",
    icon: CiUser,
  },
  {
    title: "Notifications",
    icon: CiBellOn,
    url: "/dashboard?tab=notifications",
  },
  {
    title: "Settings",
    url: "/dashboard?tab=settings",
    icon: CiSettings,
  },
  {
    title: "Support",
    url: "/dashboard?tab=support",
    icon: CiChat1,
  },
];

const studentNav = {
  main: [
    {
      title: "Overview",
      url: "/dashboard?tab=overview",
      icon: CiGrid42,
    },
    {
      title: "Certificates",
      url: "/dashboard?tab=certificates",
      icon: CiFileOn,
    },
  ],
  sub,
};

const instructorNav = {
  main: [
    {
      title: "Overview",
      url: "/dashboard?tab=overview",
      icon: CiGrid42,
    },
    {
      title: "Course Management",
      icon: CiFolderOn,
      items: [
        {
          title: "My Courses",
          url: "/dashboard?tab=courses",
        },
        {
          title: "Create Course",
          url: "/dashboard?tab=create-course",
        },
        {
          title: "Course Analytics",
          url: "/dashboard?tab=course-analytics",
        },
      ],
    },
    {
      title: "Offers",
      url: "/dashboard?tab=offers",
      icon: CiDiscount1,
    },
  ],
  sub,
};

const adminNav = {
  main: [
    {
      title: "Overview",
      url: "/dashboard?tab=overview",
      icon: CiGrid42,
    },
    {
      title: "Users",
      icon: CiUser,
      url: "/dashboard?tab=users",
    },
    {
      title: "Instructor Requests",
      icon: CiChat2,
      url: "/dashboard?tab=pending-instructors",
    },
    {
      title: "Courses",
      icon: CiFolderOn,
      url: "/dashboard?tab=courses",
    },
    {
      title: "Category",
      url: "/dashboard?tab=categories",
      icon: CiBoxes,
    },
    {
      title: "Enrollments",
      url: "/dashboard?tab=enrollments",
      icon: CiViewList,
    },
    {
      title: "Coupons",
      url: "/dashboard?tab=coupon",
      icon: CiShoppingTag,
    },
    {
      title: "Offers",
      url: "/dashboard?tab=offers",
      icon: CiDiscount1,
    },
  ],
  sub,
};

export const sidebarLinks = (role) => {
  switch (role) {
    case "student":
      return studentNav;
    case "instructor":
      return instructorNav;
    case "admin":
      return adminNav;
    default:
      return studentNav;
  }
};
