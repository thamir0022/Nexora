import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CiDiscount1, CiCircleCheck, CiCircleRemove, CiRedo } from "react-icons/ci"
import { Loader2, Sparkles } from "lucide-react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CouponManager = ({ courseIds, originalAmount, onCouponSuccess, onCouponRemove, className }) => {
  const [coupons, setCoupons] = useState([])
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  // Manual input states
  const [manualCouponCode, setManualCouponCode] = useState("")
  const [couponStatus, setCouponStatus] = useState(null)
  const [couponData, setCouponData] = useState(null)
  const [hasValidated, setHasValidated] = useState(false)

  // Selected states
  const [selectedCouponCode, setSelectedCouponCode] = useState("")
  const [bestCoupon, setBestCoupon] = useState(null)
  const [autoAppliedBest, setAutoAppliedBest] = useState(false)

  const axios = useAxiosPrivate()
  const { user } = useAuth()

  const fetchAvailableCoupons = async () => {
    setIsLoadingCoupons(true)
    try {
      const { data } = await axios.get(`/users/${user?._id}/coupon`)
      if (data.success) {
        // Filter coupons based on minimum order amount
        const validCoupons = data.coupons.filter((coupon) => originalAmount >= coupon.minOrderAmount)
        setCoupons(validCoupons)

        // Find and auto-apply best coupon
        if (validCoupons.length > 0 && !autoAppliedBest) {
          const best = findBestCoupon(validCoupons)
          setBestCoupon(best)
          if (best) {
            setSelectedCouponCode(best.code)
            await applyCoupon(best.code, true) // Auto-apply
            setAutoAppliedBest(true)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error)
    } finally {
      setIsLoadingCoupons(false)
    }
  }

  const findBestCoupon = (availableCoupons) => {
    let bestCoupon = null
    let maxDiscount = 0

    availableCoupons.forEach((coupon) => {
      let discount = 0

      if (coupon.discountType === "percentage") {
        discount = (originalAmount * coupon.discountValue) / 100
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount)
        }
      } else {
        discount = coupon.discountValue
      }

      if (discount > maxDiscount) {
        maxDiscount = discount
        bestCoupon = coupon
      }
    })

    return bestCoupon
  }

  useEffect(() => {
    if (originalAmount > 0) {
      fetchAvailableCoupons()
    }
  }, [originalAmount])

  const applyCoupon = async (couponCode, isAutoApply = false) => {
    if (!couponCode || couponCode === "NO_COUPON") {
      handleCouponRemove()
      return
    }

    setIsApplyingCoupon(true)
    if (!isAutoApply) {
      setCouponStatus("validating")
      setHasValidated(true)
    }

    try {
      const { data } = await axios.post(`/users/${user?._id}/coupon`, {
        code: couponCode,
        orderAmount: originalAmount,
      })

      if (data?.success && data?.finalPrice !== undefined) {
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
        setSelectedCouponCode(couponCode)
        setManualCouponCode(couponCode)
        onCouponSuccess(newCouponData)

        if (isAutoApply) {
          toast.success(`Best coupon "${couponCode}" applied automatically! 🎉`)
        } else {
          toast.success("Coupon applied successfully!")
        }
      } else {
        throw new Error(data?.message || "Invalid coupon code")
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error applying coupon"
      setCouponData({ message })
      setCouponStatus("invalid")
      if (!isAutoApply) {
        toast.error(message)
      }
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleCouponRemove = () => {
    setManualCouponCode("")
    setSelectedCouponCode("")
    setCouponStatus(null)
    setCouponData(null)
    setHasValidated(false)
    onCouponRemove()
  }

  const handleSelectChange = (value) => {
    if (value === "NO_COUPON") {
      handleCouponRemove()
      toast.success("Coupon removed")
    } else {
      applyCoupon(value)
    }
  }

  const handleManualInputChange = (e) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20)

    setManualCouponCode(value)
    setSelectedCouponCode(value)

    // Reset validation state when user changes the code
    if (hasValidated && value !== manualCouponCode) {
      setHasValidated(false)
      setCouponStatus(null)
      setCouponData(null)
      onCouponRemove()
    }

    // Reset when empty
    if (value.length === 0) {
      handleCouponRemove()
    }
  }

  const handleRetryValidation = () => {
    setHasValidated(false)
    applyCoupon(manualCouponCode)
  }

  // Auto-validate manual input
  useEffect(() => {
    if (manualCouponCode.length >= 4 && !hasValidated && !coupons.find((c) => c.code === manualCouponCode)) {
      const timeoutId = setTimeout(() => {
        applyCoupon(manualCouponCode)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [manualCouponCode, hasValidated])

  const formatPrice = (price) => {
    return `₹${price.toLocaleString()}`
  }

  const getDiscountText = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`
    } else {
      return `${formatPrice(coupon.discountValue)} OFF`
    }
  }

  const getCouponDescription = (coupon) => {
    let description = `Min: ${formatPrice(coupon.minOrderAmount)}`
    if (coupon.maxDiscount && coupon.discountType === "percentage") {
      description += ` • Max: ${formatPrice(coupon.maxDiscount)}`
    }
    return description
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {/* Compact Header */}
        <div className="flex items-center gap-2">
          <CiDiscount1 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Coupons</span>
          {isApplyingCoupon && <Loader2 className="h-3 w-3 animate-spin" />}
          {bestCoupon && autoAppliedBest && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Best
            </Badge>
          )}
        </div>

        {/* Combined Input Row - More Compact */}
        <div className="flex gap-2">
          {/* Coupon Select */}
          <div className="flex-1">
            <Select
              value={selectedCouponCode || ""}
              onValueChange={handleSelectChange}
              disabled={isLoadingCoupons || isApplyingCoupon}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={isLoadingCoupons ? "Loading..." : "Select coupon"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_COUPON">No coupon</SelectItem>
                {coupons.map((coupon) => (
                  <SelectItem key={coupon._id} value={coupon.code}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{coupon.code}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getDiscountText(coupon)}
                          </Badge>
                          {bestCoupon?.code === coupon.code && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Best
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{getCouponDescription(coupon)}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Enter code"
              value={manualCouponCode}
              onChange={handleManualInputChange}
              className={`h-9 text-sm pr-8 ${
                couponStatus === "valid"
                  ? "border-green-500 focus-visible:ring-green-500"
                  : couponStatus === "invalid"
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
              }`}
              disabled={isApplyingCoupon}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {couponStatus === "valid" && (
                <Button
                  type="button"
                  onClick={handleCouponRemove}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  <CiCircleRemove className="h-3 w-3" />
                </Button>
              )}
              {couponStatus === "invalid" && (
                <Button
                  onClick={handleRetryValidation}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Retry validation"
                >
                  <CiRedo className={cn("h-3 w-3 text-red-600", isApplyingCoupon && "animate-spin")} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages - More Compact */}
        {couponData?.message && (
          <div
            className={`text-xs flex items-start gap-1.5 ${
              couponStatus === "valid" ? "text-green-600" : "text-red-600"
            }`}
          >
            {couponStatus === "valid" ? (
              <CiCircleCheck className="h-3 w-3 mt-0.5 flex-shrink-0" />
            ) : (
              <CiCircleRemove className="h-3 w-3 mt-0.5 flex-shrink-0" />
            )}
            <span>{couponData.message}</span>
          </div>
        )}

        {/* No coupons available message */}
        {coupons.length === 0 && !isLoadingCoupons && originalAmount > 0 && (
          <p className="text-xs text-gray-500">No coupons available for this order amount</p>
        )}
      </div>
    </div>
  )
}

export default CouponManager
