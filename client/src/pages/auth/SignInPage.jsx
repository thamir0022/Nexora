import { Suspense, useLayoutEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "@/config/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAccessToken } from "@/hooks/useAccessToken";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader } from "lucide-react";

// Define validation schema with Zod
const signInSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setUser } = useAuth();
  const { setToken } = useAccessToken();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const emailInputRef = useRef(null);
  useLayoutEffect(() => {
    document.body.style.pointerEvents = '';
    emailInputRef.current.focus();
  }, []);

  // Initialize form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPassForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      // Make API request
      const response = await axios.post("/auth/sign-in", data, {
        withCredentials: true,
      });

      // Handle successful response
      toast.success(response.data.message || "Sign in successful");

      // Set user and token in context
      setUser(response.data.user);
      setToken(response.data.accessToken);

      const redirectUrl = from ?? (response.data.user.role === "student" ? "/" : "/dashboard");
  
      // Navigate
      navigate(redirectUrl, {replace: true});
    } catch (error) {
      // Handle API errors
      if (error.response) {
        const message =
          error.response.data.message || "An error occurred during sign in";
        toast.error(message, {
          description: "Please contact support for more",
        });
      } else {
        toast.error("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetLink = async (data) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/auth/forgot-password", data);

      if (!res.data.success) return toast.error(res.data.message);

      toast.success(res.data.message, {
        description: "Check your inbox for the link",
      });
      setOpen(false);
    } catch (error) {
      const errorMessage =
        error.response.data.message || "Something went wrong, Try Again";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="place-center">
      <Link to="/sign-up" className="link absolute right-10 top-5">
        Sign Up
      </Link>
      <div className="w-full md:w-sm lg:w-md mx-auto px-5 space-y-4 text-center">
        <div className="space-y-2">
          <p className="font-medium text-xl">Welcome Back</p>
          <p className="text-sm">
            Enter your email and password below to log in to your account
          </p>
        </div>
        <div className="">
          <Form {...form}>
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        ref={emailInputRef}
                      />
                    </FormControl>
                    <FormMessage className="text-left" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-left" />
                  </FormItem>
                )}
              />

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger className="text-right link">
                  Forgot password?
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="text-2xl text-center">
                    Forgot Your Password
                  </DialogHeader>
                  <Form {...forgotPassForm}>
                    <form
                      onSubmit={forgotPassForm.handleSubmit(
                        handleSendResetLink
                      )}
                      className="flex flex-col gap-3"
                    >
                      <FormField
                        control={forgotPassForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter your registered email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="yourname@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button className="w-1/2 mx-auto">
                        {isLoading ? (
                          <Loader className="size-7 animate-spin" />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              <div className="grid grid-cols-3 items-center">
                <Separator />
                <span className="text-center text-muted-foreground text-xs uppercase">
                  Or Continue with
                </span>
                <Separator />
              </div>
              <Suspense
                fallback={<Skeleton className="w-full h-10 rounded-full" />}
              >
                <GoogleSignInButton text="continue_with" />
              </Suspense>
            </form>
          </Form>
        </div>
        <p className="text-sm max-w-sm mx-auto">
          By clicking sign in, you agree to our{" "}
          <span className="link underline">Terms of Service</span> and{" "}
          <span className="link underline">Privacy Policy</span>.
        </p>
      </div>
    </section>
  );
}

export default SignInPage;
