import { useState, useEffect, useCallback } from "react"

const STEPS = {
  OTP_VERIFICATION: 1,
  ROLE_SELECTION: 2,
  USER_REGISTRATION: 3,
  INSTRUCTOR_QUALIFICATIONS: 4,
  WELCOME: 5,
  INSTRUCTOR_WELCOME: 6
}

const INITIAL_FORM_DATA = {
  userId: "",
  email: "",
  fullName: "",
  mobile: "",
  role: "",
  password: "",
}

export const useWizardState = (email) => {
  const [currentStep, setCurrentStep] = useState(STEPS.OTP_VERIFICATION)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (email) {
      setFormData(prev => ({ ...prev, email }))
    }
  }, [email])

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      // If current step is user registration, determine next step based on role
      if (prev === STEPS.USER_REGISTRATION) {
        return formData.role === 'instructor' 
          ? STEPS.INSTRUCTOR_QUALIFICATIONS 
          : STEPS.WELCOME
      }
      return prev + 1
    })
  }, [formData.role])

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  const resetWizard = useCallback(() => {
    setCurrentStep(STEPS.OTP_VERIFICATION)
    setFormData(INITIAL_FORM_DATA)
    setIsLoading(false)
  }, [])
  
  const setUserRegistered = useCallback((userData) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        ...userData,
        userId: userData.userId || prev.userId,
        role: userData.role || prev.role
      }
      
      // Determine next step based on user role
      const nextStep = updatedData.role === 'instructor' 
        ? STEPS.INSTRUCTOR_QUALIFICATIONS 
        : STEPS.WELCOME
      
      setCurrentStep(nextStep)
      return updatedData
    })
  }, [])

  return {
    currentStep,
    formData,
    isLoading,
    setIsLoading,
    nextStep,
    previousStep,
    updateFormData,
    resetWizard,
    setUserRegistered,
  }
}
