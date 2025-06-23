import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CiDiscount1 } from "react-icons/ci"
import { Loader2 } from "lucide-react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

const CouponSelect = ({ courseIds, originalAmount, onCouponSuccess, onCouponRemove, selectedCoupon }) => {
  const [coupons, setCoupons] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const axios = useAxiosPrivate()
  const { user } = useAuth()

  const fetchAvailableCoupons = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios.get(`/users/${user?._id}/coupon`)
      if (data.success) {
        // Filter coupons based on minimum order amount
        const validCoupons = data.coupons.filter((coupon) => originalAmount >= coupon.minOrderAmount)
        setCoupons(validCoupons)
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error)
      toast.error("Failed to load available coupons")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (originalAmount > 0) {
      fetchAvailableCoupons()
    }
  }, [originalAmount])

  const applyCoupon = async (couponCode) => {
    if (!couponCode) {
      onCouponRemove()
      return
    }

    setIsApplying(true)
    try {
      const { data } = await axios.post("/users/coupon", {
        code: couponCode,
        orderAmount: originalAmount,
        courseId: courseIds[0], // Use first course ID for validation
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

        onCouponSuccess(newCouponData)
        toast.success("Coupon applied successfully!")
      } else {
        toast.error(data?.message || "Invalid coupon code")
        onCouponRemove()
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error applying coupon"
      toast.error(message)
      onCouponRemove()
    } finally {
      setIsApplying(false)
    }
  }

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
    let description = `Min order: ${formatPrice(coupon.minOrderAmount)}`
    if (coupon.maxDiscount && coupon.discountType === "percentage") {
      description += ` • Max: ${formatPrice(coupon.maxDiscount)}`
    }
    return description
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CiDiscount1 className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Available Coupons</span>
        {isApplying && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      <Select
        value={selectedCoupon || ""}
        onValueChange={applyCoupon}
        disabled={isLoading || isApplying || coupons.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading coupons..." : "Select a coupon"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NO_COUPON">No coupon</SelectItem>
          {coupons.map((coupon) => (
            <SelectItem key={coupon._id} value={coupon.code}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{coupon.code}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getDiscountText(coupon)}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{getCouponDescription(coupon)}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {coupons.length === 0 && !isLoading && (
        <p className="text-xs text-gray-500">No coupons available for this order amount</p>
      )}
    </div>
  )
}

export default CouponSelect
