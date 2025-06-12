import { useAccessToken } from "@/hooks/useAccessToken";
import React, { useState } from "react";
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
  ChevronsUpDown,
  LogOut, 
} from "lucide-react";
import { HiComputerDesktop } from "react-icons/hi2";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { CiDark, CiGrid42, CiLight, CiUser, CiWarning } from "react-icons/ci";
import { useTheme } from "@/context/ThemeContext";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

const AccountDropDown = ({ variant, user, setUser }) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { setToken } = useAccessToken();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      const { data } = await axios.get("/auth/sign-out");
      if (!data.success) {
        const message = data.message || "Failed to log out";
        return toast.error(message);
      }

      setUser(null);
      setToken(null);
      toast.success("Logged out successfully");
      navigate("/sign-in");
    } catch (error) {
      console.error(error);
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
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard")}>
            <CiGrid42 className="size-5!"/>
            Dashboard
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard?tab=account")}>
            <CiUser className="size-5!"/>
            Account
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-transparent!">
            <ToggleGroup
              defaultValue={theme}
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
        <DropdownMenuItem asChild>
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent rounded">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <CiWarning className="size-6" />
                </div>
                <AlertDialogTitle className="text-xl font-semibold text-center">
                  Are you sure you want to log out?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  You will need to sign in again to access your account
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center gap-3 sm:gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleLogout()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropDown;
