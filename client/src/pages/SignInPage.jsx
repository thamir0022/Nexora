import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import axios from "@/config/axios";
import CustomInput from "@/components/CustomInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInFields } from "@/constants/inputFields";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAccessToken } from "@/hooks/useAccessToken";

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

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const { setToken } = useAccessToken();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear field-specific error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      // Validate form data with Zod
      const validatedData = signInSchema.parse(formData);
      setErrors({});
      setIsLoading(true);

      // Make API request
      const response = await axios.post("/auth/sign-in", validatedData, {
        withCredentials: true,
      });

      setStatus({
        type: "success",
        message: response.data.message || "Sign in successful",
      });

      if (!response.data.success) {
        setFormData({});
      }

      setUser(response.data.user);
      setToken(response.data.accessToken);

      navigate("/");
      // Here you would typically store the token and redirect the user
      // localStorage.setItem("token", response.data.accessToken);
      // navigate("/dashboard");
    } catch (error) {
      setIsLoading(false);

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      // Handle API errors
      if (error.response) {
        setStatus({
          type: "error",
          message:
            error.response.data.message || "An error occurred during sign in",
        });
      } else {
        setStatus({
          type: "error",
          message: "Unable to connect to the server. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
      toast(status.message);
    }
  };

  return (
    <Card className="w-2/3">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {signInFields.map(({ id, label, name, placeHolder, type }) => (
            <div key={id} className="space-y-1">
              <CustomInput
                id={id}
                label={label}
                name={name}
                placeHolder={placeHolder}
                type={type}
                onChange={handleInputChange}
                value={formData[id] || ""}
              />
              {errors[id] && (
                <p className="text-sm text-red-500">{errors[id]}</p>
              )}
            </div>
          ))}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p>
          Don't have an account?{" "}
          <Link className="link text-blue-600 hover:underline" to="/sign-up">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignInPage;
