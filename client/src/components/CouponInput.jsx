import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CiDiscount1, CiCircleCheck, CiCircleRemove, CiRedo } from "react-icons/ci"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { cn } from "@/lib/utils"


const CouponInput = ({ courseId, originalAmount, onCouponSuccess, onCouponRemove, className }) => {
  const [couponCode, setCouponCode] = useState("")
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponStatus, setCouponStatus] = useState(null)
  const [couponData, setCouponData] = useState(null)
  const [hasValidated, setHasValidated] = useState(false)

  const axios = useAxiosPrivate()

  const validateCoupon = async () => {
    if (couponCode.length < 4 || !couponCode.trim()) return

    setIsValidatingCoupon(true)
    setCouponStatus("validating")
    setHasValidated(true)

    try {
      const { data } = await axios.post("/users/coupon", {
        code: couponCode.trim(),
        orderAmount: originalAmount,
        courseId: courseId,
      })

      if (data?.success && data?.finalPrice !== undefined) {
        // Validate that finalPrice is not higher than original
        if (data.finalPrice > originalAmount) {
          throw new Error("Invalid discount amount")
        }

        const newCouponData = {
          message: data.message,
          code: data.code,
          originalAmount: data.originalAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          discountPercentage: data.discountPercentage,
          finalPrice: data.finalPrice,
        }

        setCouponData(newCouponData)
        setCouponStatus("valid")
        onCouponSuccess(newCouponData)
        toast.success("Coupon applied successfully!")
      } else {
        setCouponData({ message: data?.message || "Invalid coupon code" })
        setCouponStatus("invalid")
        toast.error(data?.message || "Invalid coupon code")
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error validating coupon"
      setCouponData({ message })
      setCouponStatus("invalid")
      toast.error(message)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleCouponRemove = () => {
    setCouponCode("")
    setCouponStatus(null)
    setCouponData(null)
    setHasValidated(false)
    onCouponRemove()
    toast.success("Coupon removed")
  }

  const handleRetryValidation = () => {
    setHasValidated(false)
    validateCoupon()
  }

  // Auto-validate when coupon is at least 4 characters
  useEffect(() => {
    if (couponCode.length >= 4 && !hasValidated) {
      const timeoutId = setTimeout(() => {
        validateCoupon()
      }, 500)
      return () => clearTimeout(timeoutId)
    } else if (couponCode.length === 0) {
      // Reset everything when coupon is cleared
      setCouponStatus(null)
      setCouponData(null)
      setHasValidated(false)
      onCouponRemove()
    } else if (couponCode.length < 4 && hasValidated) {
      // Reset when user modifies coupon to less than 4 characters
      setCouponStatus(null)
      setCouponData(null)
      setHasValidated(false)
      onCouponRemove()
    }
  }, [couponCode, hasValidated])

  return (
    <div className={className}>
      <div className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <CiDiscount1 className="h-5 w-5" />
          </div>
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              const value = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 20)
              setCouponCode(value)

              // Reset validation state when user changes the code
              if (hasValidated && value !== couponCode) {
                setHasValidated(false)
                setCouponStatus(null)
                setCouponData(null)
                onCouponRemove()
              }
            }}
            className={`pl-10 pr-10 h-12 border-2 focus-visible:ring-2 ${
              couponStatus === "valid"
                ? "border-green-500 focus-visible:ring-green-500"
                : couponStatus === "invalid"
                ? "border-red-500 focus-visible:ring-red-500"
                : "focus-visible:ring-blue-500"
            }`}
            disabled={isValidatingCoupon}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {couponStatus === "valid" && (
              <Button
                type="button"
                onClick={handleCouponRemove}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              >
                <CiCircleRemove className="h-4 w-4" />
              </Button>
            )}
            {couponStatus === "invalid" && (
              <Button
                onClick={handleRetryValidation}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                title="Retry validation"
              >
                <CiRedo className={cn("h-4 w-4 text-red-600", couponStatus === "validating" && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {couponData?.message && (
          <div
            className={`mt-2 text-sm flex items-start gap-1.5 ${
              couponStatus === "valid" ? "text-green-600" : "text-red-600"
            }`}
          >
            {couponStatus === "valid" ? (
              <CiCircleCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <CiCircleRemove className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{couponData.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CouponInput
