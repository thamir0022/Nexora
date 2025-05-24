import { useAccessToken } from "@/hooks/useAccessToken";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuButton } from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { HiComputerDesktop } from "react-icons/hi2";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { CiDark, CiLight } from "react-icons/ci";
import { useTheme } from "@/context/ThemeContext";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

const AccountDropDown = ({ variant, user, setUser }) => {
  const { setToken } = useAccessToken();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const res = await axios.get("/auth/sign-out");

      console.log(res);

      if (!res.data.success) return toast.error(res.data.message || "Logout failed");
      
      setUser(null);
      setToken(null);
      toast.success("Logged out successfully");
      navigate("/sign-in");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Logout failed";
      toast.error(errorMessage);
    }
  };

  const Wrapper = variant === "sidebar" ? SidebarMenuButton : "div";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Wrapper
          {...(variant === "sidebar"
            ? {
                size: "lg",
                className:
                  "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
              }
            : {})}
        >
          <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
            <AvatarImage
              src={user?.profilePicture}
              alt={user?.fullName || "Guest"}
            />
            <AvatarFallback className="rounded-lg">
              {user?.fullName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {variant === "sidebar" && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.fullName || "Guest"}
                </span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </>
          )}
        </Wrapper>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user?.profilePicture}
                alt={user?.fullName || "Guest"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="rounded-lg">
                {user?.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.fullName || "Guest"}
              </span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-transparent!">
            <ToggleGroup
              onValueChange={(value) => setTheme(value)}
              className="w-full"
              variant="outline"
              type="single"
            >
              <ToggleGroupItem value="light" aria-label="Toggle light">
                <CiLight />
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Toggle dark">
                <CiDark />
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="Toggle system">
                <HiComputerDesktop />
              </ToggleGroupItem>
            </ToggleGroup>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleLogout()}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropDown;
