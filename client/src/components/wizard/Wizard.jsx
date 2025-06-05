import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OTPVerification } from "./steps/otp-verification"
import { RoleSelection } from "./steps/role-selection"
import { UserRegistration } from "./steps/user-registration"
import { InstructorQualifications } from "./steps/instructor-qualifications"
import { WelcomeScreen } from "./steps/welcome-screen"
import { useWizardState } from "./hooks/use-wizard-state"

const STEPS = {
  OTP_VERIFICATION: 1,
  ROLE_SELECTION: 2,
  USER_REGISTRATION: 3,
  INSTRUCTOR_QUALIFICATIONS: 4,
  WELCOME: 5,
}

const Wizard = ({ open, onOpenChange, email }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const { 
    currentStep, 
    formData, 
    isLoading, 
    nextStep, 
    previousStep, 
    updateFormData, 
    resetWizard, 
    setUserRegistered 
  } = useWizardState(email)

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Show confirmation dialog when trying to close
      setShowExitConfirm(true)
    }
  }

  const handleConfirmExit = () => {
    setShowExitConfirm(false)
    onOpenChange(false)
    resetWizard()
  }

  const handleCancelExit = () => {
    setShowExitConfirm(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetWizard()
  }

  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      updateFormData,
      nextStep,
      previousStep,
      isLoading,
      setUserRegistered,
    }

    switch (currentStep) {
      case STEPS.OTP_VERIFICATION:
        return <OTPVerification {...commonProps} />
      case STEPS.ROLE_SELECTION:
        return <RoleSelection {...commonProps} />
      case STEPS.USER_REGISTRATION:
        return (
          <UserRegistration 
            {...commonProps}
            setUserRegistered={(userData) => {
              setUserRegistered(userData);
              updateFormData(userData);
            }}
          />
        )
      case STEPS.INSTRUCTOR_QUALIFICATIONS:
        return <InstructorQualifications {...commonProps} />
      case STEPS.WELCOME:
        return <WelcomeScreen {...commonProps} onClose={handleClose} />
      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">{renderCurrentStep()}</DialogContent>
      </Dialog>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost and you'll need to start the registration process again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Wizard
