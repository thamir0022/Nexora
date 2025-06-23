import { useRef, useLayoutEffect, useState } from "react"
import { Link } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import axios from "@/config/axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import GoogleSignInButton from "@/components/GoogleSignInButton"
import { Loader } from "lucide-react"
import Wizard from "@/components/wizard/wizard"

const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const emailInputRef = useRef(null)

    useLayoutEffect(() => {
      emailInputRef.current.focus();
    }, []);

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      const response = await axios.post("/auth/send-otp", data)

      if (response.data.success) {
        setUserEmail(data.email)
        setWizardOpen(true)
        toast.success("OTP sent successfully!")
      } else {
        toast.error(response.data.message || "Something went wrong")
      }
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong, Try again!"
      toast.error(message)
    } finally {
      setIsLoading(false)
      form.reset()
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center">
      <Link to="/sign-in" className="link absolute right-10 top-5">
        Sign In
      </Link>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Create Your Account</h1>
          <p className="text-gray-600">Enter your email below to create your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="yourname@example.com" type="email" {...field} ref={emailInputRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or Continue with</span>
          </div>
        </div>

        <GoogleSignInButton text="continue_with" />

        <p className="text-sm max-w-sm text-center mx-auto">
          By continuing, you agree to our{" "}
          <span className="link underline">Terms of Service</span> and{" "}
          <span className="link underline">Privacy Policy</span>.
        </p>
      </div>

      <Wizard email={userEmail} open={wizardOpen} onOpenChange={setWizardOpen} />
    </section>
  )
}

export default SignUpPage
