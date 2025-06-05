import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader } from "lucide-react"
import { toast } from "sonner"
import axios from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { useAccessToken } from "@/hooks/useAccessToken"

const registrationSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    mobile: z
      .string()
      .min(10, "Please enter a valid mobile number")
      .regex(/^\d+$/, "Mobile number should contain only digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const UserRegistration = ({ formData, updateFormData, nextStep, previousStep, setUserRegistered }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const { setUser } = useAuth()
  const { setToken } = useAccessToken()

  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: formData.fullName || "",
      email: formData.email || "",
      mobile: formData.mobile || "",
      password: "",
      confirmPassword: "",
    },
  })

  // Check if user is already registered
  useEffect(() => {
    if (formData.userId && formData.fullName) {
      setIsRegistered(true)
      // Pre-fill form with existing data
      form.setValue("fullName", formData.fullName)
      form.setValue("email", formData.email)
      form.setValue("mobile", formData.mobile)
    }
  }, [formData, form])

  const onSubmit = async (data) => {
    // If already registered, just update form data and proceed
    if (isRegistered) {
      updateFormData({
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
      })
      nextStep()
      return
    }

    setIsLoading(true)

    try {
      const registrationData = {
        ...formData,
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
      }

      const response = await axios.post("/auth/register", registrationData)

      // Check for successful response
      if (response.data && response.data.success) {
        const userData = {
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          userId: response.data.user._id,
        }

        setUserRegistered(userData)
        setIsRegistered(true)
        toast.success("Registration successful!")

        // Handle different user roles
        if (response.data.user.role === "student") {
          setUser(response.data.user)
          setToken(response.data.accessToken)
        }

        nextStep()
      } else {
        // Handle case where response doesn't have success flag
        throw new Error(response.data?.message || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Registration failed"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">
          {isRegistered ? "Update Your Information ✏️" : "Let's Get Started ✨"}
        </DialogTitle>
        <DialogDescription className="text-center">
          {isRegistered
            ? "Review and update your information if needed"
            : "One step closer to mastering something new, let's begin!"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isRegistered && (
            <>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={previousStep}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : isRegistered ? "Continue" : "Register"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
