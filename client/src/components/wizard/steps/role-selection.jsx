import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"

export const RoleSelection = ({ formData, updateFormData, nextStep, previousStep }) => {
  const [selectedRole, setSelectedRole] = useState(formData.role || "")

  // Update local state when formData changes
  useEffect(() => {
    if (formData.role) {
      setSelectedRole(formData.role)
    }
  }, [formData.role])

  const handleContinue = () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue")
      return
    }

    updateFormData({ role: selectedRole })
    nextStep()
  }

  return (
    <div className="space-y-6 p-6">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">Choose Your Path 🎓</DialogTitle>
        <DialogDescription className="text-center">
          Let's get you set up! Tell us what you're here for.
        </DialogDescription>
      </DialogHeader>

      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={selectedRole}
          onValueChange={setSelectedRole}
          variant="outline"
          size="lg"
          className="grid grid-cols-2 gap-4"
        >
          <ToggleGroupItem value="student" className="h-20 flex-col space-y-2" aria-label="Select student role">
            <span className="text-2xl">👨‍🎓</span>
            <span>Student</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="instructor" className="h-20 flex-col space-y-2" aria-label="Select instructor role">
            <span className="text-2xl">👩‍🏫</span>
            <span>Instructor</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <DialogFooter className="flex justify-between">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedRole}>
          Continue
        </Button>
      </DialogFooter>
    </div>
  )
}
