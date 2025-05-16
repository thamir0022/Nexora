import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "@/config/axios";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Loader } from "lucide-react";
import Wizard from "@/components/Wizard";

const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [openWizard, setOpenWizard] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setUserEmail(data.email);
    try {
      const res = await axios.post("/auth/send-otp", data);

      if (!res.data.success) {
        toast.error(res.data.message || "Something went wrong");
      }

      setOpenWizard(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Something went wrong, Try again!";
      toast.error(message);
      console.log(error);
    } finally {
      setIsLoading(false);
      form.reset();
    }
  };

  return (
    <section className="place-center">
      <Link to="/sign-in" className="link absolute right-10 top-5">
        Sign In
      </Link>
      <div className="w-full md:w-sm lg:w-md mx-auto px-5 space-y-4 text-center">
        <div className="space-y-2">
          <p className="font-medium text-xl">Create Your Account</p>
          <p className="text-sm">
            Enter your email below to create your account
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="yourname@example.com" {...field} />
                  </FormControl>
                  <FormMessage className="text-left" />
                </FormItem>
              )}
            />
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader className="size-5 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>
        <div className="grid grid-cols-3 items-center">
          <Separator />
          <span className="text-center text-muted-foreground text-xs uppercase">
            Or Continue with
          </span>
          <Separator />
        </div>
        <GoogleSignInButton text="continue_with" />
        <p className="text-sm">
          By clicking continue, you agree to our{" "}
          <span className="link underline">Terms of Service</span> and{" "}
          <span className="link underline">Privacy Policy</span>.
        </p>
        <Wizard
          email={userEmail}
          open={openWizard}
          onOpenChange={setOpenWizard}
        />
      </div>
    </section>
  );
}

export default SignUpPage;
