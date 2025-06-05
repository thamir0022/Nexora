import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const StepIndicator = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <button
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 font-medium",
              index < currentStep
                ? "bg-primary border-primary text-primary-foreground cursor-pointer"
                : index === currentStep
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground cursor-default",
              index < currentStep && "hover:bg-primary/90",
            )}
            onClick={() => index < currentStep && onStepClick(index)}
            disabled={index >= currentStep}
            aria-label={`${index < currentStep ? "Go to" : ""} step ${index + 1}: ${step.title}`}
          >
            {index < currentStep ? <Check className="h-5 w-5" /> : <span className="text-sm">{index + 1}</span>}
          </button>

          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 md:w-24 h-0.5 transition-colors duration-200",
                index < currentStep ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default StepIndicator
