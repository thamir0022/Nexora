"use client"
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export const WelcomeScreen = ({ formData, onClose }) => {
  const navigate = useNavigate()

  const handleContinue = () => {
    onClose()

    if (formData.role === "student") {
      navigate("/dashboard")
    } else {
      navigate("/")
    }
  }

  const isStudent = formData.role === "student"

  return (
    <div className="space-y-6 p-6 text-center">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {isStudent ? "🎓" : "🎉"} Welcome{isStudent ? "" : " Aboard"},{" "}
          {formData.fullName || (isStudent ? "Student" : "Instructor")}!
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {isStudent ? (
          <p className="text-lg text-muted-foreground">
            You're officially part of the learning journey! 🚀 Get ready to explore new courses, gain skills, and level
            up your knowledge.
          </p>
        ) : (
          <>
            <p className="text-lg text-muted-foreground">
              Your qualifications have been submitted successfully! Our team will review your profile shortly. Get ready
              to inspire and teach the next generation! 🚀
            </p>
            <p className="text-sm text-muted-foreground">
              Any updates will be sent straight to your email inbox at{" "}
              <span className="font-medium">{formData.email}</span>. 📬
            </p>
          </>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleContinue} className="w-full">
          {isStudent ? "Go to Dashboard" : "Done"}
        </Button>
      </DialogFooter>
    </div>
  )
}
