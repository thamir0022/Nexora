import { CiBoxes, CiChat1, CiChat2, CiDollar, CiFolderOn, CiGrid42, CiHeart, CiHome, CiSettings, CiUser, CiViewList } from "react-icons/ci";


const sub = [
  {
    title: "Account",
    url: "/dashboard?tab=account",
    icon: CiUser,
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
      title: "Home",
      url: "/",
      icon: CiHome,
    },
    {
      title: "My Learning",
      url: "/dashboard?tab=my-courses",
      icon: CiFolderOn,
      items: [
        {
          title: "My Courses",
          url: "/dashboard?tab=my-courses",
        },
        {
          title: "Certificates",
          url: "/dashboard?tab=certificates",
        },
      ],
    },
    {
      title: "Wishlist",
      url: "/dashboard?tab=wishlist",
      icon: CiHeart,
    },
  ],
  sub,
};

const instructorNav = {
  main: [
    {
      title: "Home",
      url: "/",
      icon: CiHome,
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
  ],
  sub,
};

const adminNav = {
  main: [
    {
      title: "Overview",
      url: "/dashboard",
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
      url: "/dashboard?tab=courses"
    },
    {
      title: "Category",
      url: "/dashboard?tab=categories",
      icon: CiBoxes,
    },
    {
      title: "Orders",
      url: "/dashboard?tab=orders",
      icon: CiViewList,
    },
    {
      title: "Revenue Analytics",
      url: "/dashboard?tab=orders",
      icon: CiDollar,
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
