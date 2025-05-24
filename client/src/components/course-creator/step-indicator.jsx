"use client"

import { Check } from "lucide-react"

const StepIndicator = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {/* Step circle */}
          <button
            className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
              index < currentStep
                ? "bg-primary border-primary text-white"
                : index === currentStep
                  ? "border-primary text-primary"
                  : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
            } ${index < currentStep ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => onStepClick(index)}
            disabled={index >= currentStep}
            aria-label={`Go to step ${index + 1}: ${step.title}`}
          >
            {index < currentStep ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
          </button>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`w-12 md:w-24 h-1 ${index < currentStep ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default StepIndicator
