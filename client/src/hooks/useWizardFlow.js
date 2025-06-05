import { useState, useEffect, useCallback } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"

const INITIAL_FORM_DATA = {
  userId: "",
  email: "",
  fullName: "",
  mobile: "",
  role: "",
  password: "",
}

export const useWizardState = (email) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [originalData, setOriginalData] = useState({})
  const axios = useAxiosPrivate()

  useEffect(() => {
    if (email) {
      setFormData((prev) => ({ ...prev, email }))
      setOriginalData((prev) => ({ ...prev, email }))
    }
  }, [email])

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const nextStep = useCallback(async () => {
    // Check if user data has changed and update if necessary
    if (formData.userId && hasDataChanged()) {
      await updateUserData()
    }
    setCurrentStep((prev) => prev + 1)
  }, [formData])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }, [])

  const hasDataChanged = useCallback(() => {
    const fieldsToCheck = ["fullName", "mobile", "email"]
    return fieldsToCheck.some((field) => formData[field] !== originalData[field])
  }, [formData, originalData])

  const updateUserData = useCallback(async () => {
    if (!formData.userId) return

    try {
      const changedData = {}
      const fieldsToCheck = ["fullName", "mobile", "email"]

      fieldsToCheck.forEach((field) => {
        if (formData[field] !== originalData[field]) {
          changedData[field] = formData[field]
        }
      })

      if (Object.keys(changedData).length > 0) {
        setIsLoading(true)
        const response = await axios.patch(`/users/${formData.userId}`, changedData)

        if (response.data.success) {
          setOriginalData((prev) => ({ ...prev, ...changedData }))
          toast.success("Profile updated successfully!")
        }
      }
    } catch (error) {
      toast.error("Failed to update profile")
      console.error("Update error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, originalData, axios])

  const setUserRegistered = useCallback((userData) => {
    setFormData((prev) => ({ ...prev, ...userData }))
    setOriginalData((prev) => ({ ...prev, ...userData }))
  }, [])

  const resetWizard = useCallback(() => {
    setCurrentStep(1)
    setFormData(INITIAL_FORM_DATA)
    setOriginalData({})
    setIsLoading(false)
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
    hasDataChanged: hasDataChanged(),
  }
}
