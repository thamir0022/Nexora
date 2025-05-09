import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({ maxRating = 5, size = "md", defaultRating = 0, onChange, readonly = false, className }) {
  const [rating, setRating] = useState(defaultRating)
  const [hoverRating, setHoverRating] = useState(0)

  // Update internal state if defaultRating changes externally
  useEffect(() => {
    setRating(defaultRating)
  }, [defaultRating])

  const handleSetRating = (newRating) => {
    if (readonly) return
    setRating(newRating)
    onChange?.(newRating)
  }

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  // Calculate the filled percentage for each star
  const getStarFillPercentage = (starPosition) => {
    const currentRating = hoverRating || rating

    if (starPosition <= Math.floor(currentRating)) {
      return 100 // Full star
    } else if (starPosition > Math.ceil(currentRating)) {
      return 0 // Empty star
    } else {
      // Partial star - calculate percentage
      return (currentRating - Math.floor(currentRating)) * 100
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)} role="radiogroup" aria-label="Rating">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1
        const fillPercentage = getStarFillPercentage(starValue)

        return (
          <span
            key={`star-${index}`}
            type="button"
            className={cn(
              "relative rounded-full p-1 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500",
              "hover:scale-110",
              readonly ? "cursor-default" : "cursor-pointer",
            )}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => handleSetRating(starValue)}
            aria-checked={Math.ceil(rating) === starValue}
            role="radio"
            tabIndex={readonly ? -1 : 0}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            {/* Background star (gray) */}
            <Star
              className={cn(sizeClasses[size], "fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600")}
              strokeWidth={1.5}
            />

            {/* Foreground star (yellow - clipped based on rating) */}
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 overflow-hidden p-1"
                style={{
                  clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                }}
              >
                <Star
                  className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400 drop-shadow-sm")}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </span>
        )
      })}

      {!readonly && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {rating > 0 ? `${rating.toFixed(1)} of ${maxRating}` : "Rate"}
        </span>
      )}
    </div>
  )
}
