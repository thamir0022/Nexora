import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { toast } from "sonner"
import axios from "@/config/axios"
import { SlidingNumber } from "@/components/ui/sliding-number"

export const OTPVerification = ({ formData, updateFormData, nextStep }) => {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post("/auth/verify-otp", {
        email: formData.email,
        otp,
      })

      if (response.data.success) {
        updateFormData({ userId: response.data.user._id })
        toast.success("OTP verified successfully!")
        nextStep()
      } else {
        toast.error(response.data.message || "Invalid OTP")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      const response = await axios.post("/auth/send-otp", {
        email: formData.email,
      })

      if (response.data.success) {
        toast.success("OTP sent successfully!")
        setCountdown(60)
        setCanResend(false)
        setOtp("")
      } else {
        toast.error(response.data.message || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("Failed to resend OTP")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">Check your inbox 📬</DialogTitle>
        <DialogDescription className="text-center">
          We've sent a 6-digit code to <span className="font-semibold">{formData.email}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex justify-center">
        <SlidingNumber value={countdown} padStart={true} />
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={otp} onChange={setOtp} onComplete={handleVerifyOTP}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="link" disabled={!canResend} onClick={handleResendOTP}>
          Resend OTP
        </Button>
        <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6}>
          {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Next"}
        </Button>
      </div>
    </div>
  )
}
