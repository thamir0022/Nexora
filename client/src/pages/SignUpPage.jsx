import { useState } from "react";
import { Link } from "react-router-dom";
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
import { signUpFields } from "@/constants/inputFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// Define validation schema with Zod
const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    mobile: z
      .string()
      .min(10, { message: "Please enter a valid mobile number" })
      .regex(/^\d+$/, { message: "Mobile number should contain only digits" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

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
      const validatedData = signUpSchema.parse(formData);
      setErrors({});
      setIsLoading(true);

      // Remove confirmPassword before sending to API
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...dataToSend } = validatedData;

      // Make API request
      const response = await axios.post("/auth/sign-up", dataToSend);

      // Handle successful response
      if (response.data.success) {
        setStatus({
          type: "success",
          message: response.data.message || "Account created successfully",
        });

        // Reset form after successful submission
        setFormData({
          fullName: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
        });

        // Here you would typically redirect the user to sign-in page
        // navigate("/sign-in");
      }
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
            error.response.data.message || "An error occurred during sign up",
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
          Create Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {signUpFields.map(({ id, label, name, placeHolder, type }) => (
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="place-content-center">
        <p>
          Already have an account?{" "}
          <Link className="link text-blue-600 hover:underline" to="/sign-in">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignUpPage;
