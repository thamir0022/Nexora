import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import axios from "@/config/axios"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useAccessToken } from "@/hooks/useAccessToken"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import GoogleSignInButton from "@/components/GoogleSignInButton"

// Define validation schema with Zod
const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }).min(1, { message: "Email is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuth()
  const { setToken } = useAccessToken()
  const navigate = useNavigate()

  // Initialize form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)

      // Make API request
      const response = await axios.post("/auth/sign-in", data, {
        withCredentials: true,
      })

      // Handle successful response
      toast.success(response.data.message || "Sign in successful")

      // Set user and token in context/state
      setUser(response.data.user)
      setToken(response.data.accessToken)

      const redirectUrl = response.data.user.role === "student" ? "/" : "/dashboard";

      // Navigate
      navigate(redirectUrl)
    } catch (error) {
      // Handle API errors
      if (error.response) {
        toast.error(error.response.data.message || "An error occurred during sign in")
      } else {
        toast.error("Unable to connect to the server. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link className="text-sm link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            <GoogleSignInButton/>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p>
          Don't have an account?{" "}
          <Link className="link" to="/sign-up">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default SignInPage
