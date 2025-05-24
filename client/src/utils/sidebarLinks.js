import {
  BookOpen,
  LifeBuoy,
  User,
  Book,
  UserCircle,
  HelpCircle,
  Users,
  Library,
  ShoppingCart,
  Settings,
  Heart,
  GraduationCap,
  FileText,
  MessageCircle,
  Receipt,
  LibraryBig,
  House,
  ChartSpline,
  UsersRound,
  Rows4,
  ChartPie,
  Boxes,
} from "lucide-react";

const sub = [
  {
    title: "Account",
    url: "/dashboard?tab=account",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard?tab=settings",
    icon: Settings,
  },
  {
    title: "Support",
    url: "/dashboard?tab=support",
    icon: LifeBuoy,
  },
];

const studentNav = {
  main: [
    {
      title: "Home",
      url: "/",
      icon: House,
    },
    {
      title: "My Learning",
      url: "/dashboard?tab=my-courses",
      icon: LibraryBig,
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
      icon: Heart,
    },
  ],
  sub,
};

const instructorNav = {
  main: [
    {
      title: "Home",
      url: "/",
      icon: House,
    },
    {
      title: "Courses",
      url: "/dashboard?tab=instructor-courses",
      icon: Book,
      items: [
        {
          title: "My Courses",
          url: "/dashboard?tab=instructor-courses",
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
      icon: ChartPie,
    },
    {
      title: "Users",
      icon: UsersRound,
      items: [
        {
          title: "All Users",
          url: "/dashboard?tab=users",
        },
        {
          title: "Instructor Requests",
          url: "/dashboard?tab=pending-instructors",
        },
      ],
    },
    {
      title: "Courses",
      icon: LibraryBig,
      items: [
        {
          title: "All Courses",
          url: "/dashboard?tab=courses",
        },
        {
          title: "Add Course",
          url: "/dashboard?tab=add-course",
        },
      ],
    },
    {
      title: "Category",
      url: "/dashboard?tab=category",
      icon: Boxes,
    },
    {
      title: "Orders",
      url: "/dashboard?tab=orders",
      icon: Rows4,
    },
    {
      title: "Revenue Analytics",
      url: "/dashboard?tab=orders",
      icon: ChartSpline,
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
