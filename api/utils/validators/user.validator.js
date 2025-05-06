import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z
    .string({
      required_error: "Full name is required",
    })
    .transform((val) => val.trim()),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Please enter a valid email address")
    .transform((val) => val.trim()),
  mobile: z
    .string({
      required_error: "Mobile number is required",
    })
    .min(10, "Mobile number must be at least 10 digits")
    .transform((val) => val.trim()),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, "Password must be at least 6 characters")
    .transform((val) => val.trim()),
  role: z
    .enum(["student", "instructor"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be a string",
    })
    .transform((val) => val.trim()),
});

export const signInSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Please enter a valid email address")
    .transform((val) => val.trim()),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(6, "Password must be at least 6 characters")
    .transform((val) => val.trim()),
});
