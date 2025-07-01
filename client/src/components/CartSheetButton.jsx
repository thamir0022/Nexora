"use client"

import { CiCreditCard1, CiShoppingCart, CiTrash } from "react-icons/ci"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import emptyCartImage from "@/assets/images/empty-cart.svg"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { Loader, Loader2, User } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "./ui/scroll-area"
import WalletToggle from "./wallet-toggle"
import CouponManager from "./coupon-manager"
import { Badge } from "./ui/badge"
import { FaStar } from "react-icons/fa"
import useRazorpay from "@/hooks/useRazorpay"

const CartButton = () => {
  // Loading states
  const [isFetching, setIsFetching] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Cart data
  const [cartProductIds, setCartProductIds] = useState([])
  const [cartSummary, setCartSummary] = useState(null)

  // Discount states
  const [discountData, setDiscountData] = useState(null)

  // Wallet states
  const [walletBalance, setWalletBalance] = useState(0)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const [isWalletApplied, setIsWalletApplied] = useState(false)

  // Hooks
  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const { cart, setCart, removeItem, openSheet, setOpenSheet } = useCart()
  const { setWishlist } = useWishlist()
  const navigate = useNavigate()
  const { isProcessing, initiatePayment, paymentState } = useRazorpay()

  // Calculate amounts using useMemo for better performance
  const amounts = useMemo(() => {
    if (!cartSummary) {
      return {
        originalTotal: 0,
        subtotal: 0,
        afterCoupon: 0,
        walletAmount: 0,
        finalAmount: 0,
        totalSavings: 0,
        discountPercentage: 0,
      }
    }

    const subtotal = cartSummary.totalEffectivePrice
    const afterCoupon = discountData ? discountData.finalPrice : subtotal
    const walletAmount = isWalletApplied && walletBalance > 0 ? Math.min(walletBalance, afterCoupon) : 0
    const finalAmount = Math.max(0, afterCoupon - walletAmount)
    const cartSavings = cartSummary.totalSavings || 0
    const couponSavings = discountData ? subtotal - afterCoupon : 0
    const totalSavings = cartSavings + couponSavings + walletAmount
    const discountPercentage =
      cartSummary.totalOriginalPrice > 0
        ? Math.round(((cartSummary.totalOriginalPrice - finalAmount) / cartSummary.totalOriginalPrice) * 100)
        : 0

    return {
      originalTotal: cartSummary.totalOriginalPrice,
      subtotal,
      afterCoupon,
      walletAmount,
      finalAmount,
      totalSavings,
      discountPercentage,
      cartSavings,
      couponSavings,
    }
  }, [cartSummary, discountData, isWalletApplied, walletBalance])

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!user?._id) return

    setIsWalletLoading(true)
    try {
      const { data } = await axios.get("/wallet")
      if (data.success) {
        setWalletBalance(data.wallet.balance || 0)
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error)
      setWalletBalance(0)
    } finally {
      setIsWalletLoading(false)
    }
  }, [user?._id, axios])

  // Fetch cart data
  const fetchCartData = useCallback(async () => {
    if (!user?._id) return

    setIsFetching(true)
    try {
      const { data } = await axios.get(`/users/${user._id}/cart`)
      if (data.success) {
        setCart(data.cart)
        setCartSummary(data.summary)
        setCartProductIds(data.cart.map((item) => item._id))
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch cart"
      toast.error(errorMessage)
    } finally {
      setIsFetching(false)
    }
  }, [user?._id, axios, setCart])

  // Handle sheet open - fetch data when cart is opened
  const handleSheetOpenChange = useCallback(
    (open) => {
      setOpenSheet(open)

      if (open && !hasInitialFetch && user?._id) {
        // Fetch both cart and wallet data when sheet opens for the first time
        Promise.all([fetchCartData(), fetchWalletBalance()]).then(() => {
          setHasInitialFetch(true)
        })
      }
    },
    [openSheet, hasInitialFetch, user?._id, fetchCartData, fetchWalletBalance, setOpenSheet],
  )

  // Reset data when user changes
  useEffect(() => {
    if (!user?._id) {
      setHasInitialFetch(false)
      setCartSummary(null)
      setCartProductIds([])
      setWalletBalance(0)
      resetDiscounts()
    }
  }, [user?._id])

  // Cart actions
  const removeFromCart = useCallback(
    async (courseId) => {
      setIsRemoving(courseId)
      try {
        const res = await axios.delete(`/users/${user._id}/cart/${courseId}`)
        if (res.data.success) {
          removeItem(courseId)
          setCartSummary(res.data.summary)
          toast.success("Course removed from cart")
          resetDiscounts()
        } else {
          toast.error(res.data.message || "Failed to remove course from cart")
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to remove course from cart")
      } finally {
        setIsRemoving(false)
      }
    },
    [axios, user._id, removeItem],
  )

  const moveToWishlist = useCallback(
    async (courseId) => {
      setIsMoving(courseId)
      try {
        const { data } = await axios.patch(`/users/${user._id}/cart/${courseId}`)
        if (data.success) {
          setWishlist(data.wishlist)
          setCart(data.cart)
          setCartSummary(data.summary)
          toast.success("Course moved to wishlist")
        }
      } catch (error) {
        const message = error.response?.data?.message || "Failed to move course to wishlist"
        toast.error(message)
      } finally {
        setIsMoving(false)
      }
    },
    [axios, user._id, setWishlist, setCart],
  )

  // Discount handlers
  const resetDiscounts = useCallback(() => {
    setDiscountData(null)
    setIsWalletApplied(false)
  }, [])

  const handleCouponSuccess = useCallback((couponData) => {
    setDiscountData(couponData)
  }, [])

  const handleCouponRemove = useCallback(() => {
    setDiscountData(null)
  }, [])

  const handleWalletToggle = useCallback((pressed) => {
    setIsWalletApplied(pressed)
  }, [])

  // Navigation
  const handleCourseClick = useCallback(
    (courseId) => {
      setOpenSheet(false)
      navigate(`/courses/${courseId}`)
    },
    [setOpenSheet, navigate],
  )

  // Payment handler
  const handlePayment = useCallback(async () => {
    const orderData = {
      amount: amounts.finalAmount,
      isCart: true,
    }
    await initiatePayment(orderData)
  }, [amounts.finalAmount, initiatePayment])

  // Utility
  const formatPrice = useCallback(
    (price) =>
      price.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }),
    [],
  )

  // Render cart item
  const renderCartItem = useCallback(
    (item, index) => (
      <div key={item._id} className="relative group">
        <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          {/* Course Image */}
          <div
            onClick={() => handleCourseClick(item._id)}
            className="h-20 w-32 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border shadow-sm relative"
          >
            <img
              className="object-cover w-full h-full hover:scale-105 transition-transform"
              src={item.thumbnailImage || "/placeholder.svg"}
              alt={item.title}
            />
            {/* Offer Badge */}
            {item.hasDiscount && item.offer && (
              <Badge className="absolute top-1 right-1 text-xs px-1 py-0 h-5 bg-primary">{item.offer.name}</Badge>
            )}
          </div>

          {/* Course Details */}
          <div className="flex-1 space-y-2 min-w-0">
            <h3
              className="font-semibold text-sm cursor-pointer leading-tight hover:text-primary transition-colors line-clamp-2"
              onClick={() => handleCourseClick(item._id)}
            >
              {item.title}
            </h3>

            {/* Instructor */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Avatar className="size-5">
                  <AvatarImage
                    src={item.instructor?.profilePicture || "/placeholder.svg"}
                    alt={item.instructor?.fullName}
                  />
                  <AvatarFallback className="text-[10px]">
                    {item.instructor?.fullName?.charAt(0) || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {item.instructor?.fullName || "Instructor"}
                </span>
              </div>
              <div className="flex items-center">
                <FaStar className="fill-yellow-500 h-3 w-3" />
                <span className="text-xs font-bold text-muted-foreground ml-1">{item.rating.averageRating}</span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">({item.rating.ratingCount})</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">{formatPrice(item.effectivePrice || 0)}</span>
              {item.hasDiscount && (
                <span className="text-muted-foreground line-through text-sm">{formatPrice(item.price || 0)}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end">
              {isMoving === item._id ? (
                <Loader className="size-3 text-primary animate-spin" />
              ) : (
                <button
                  onClick={() => moveToWishlist(item._id)}
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  Move to Wishlist
                </button>
              )}
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeFromCart(item._id)}
            disabled={isRemoving === item._id}
          >
            {isRemoving === item._id ? <Loader className="size-4 animate-spin" /> : <CiTrash className="size-4" />}
          </Button>
        </div>
        {index < cart.length - 1 && <Separator className="mt-4" />}
      </div>
    ),
    [handleCourseClick, formatPrice, isMoving, isRemoving, cart.length],
  )

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center flex-1">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading your cart...</p>
    </div>
  )

  // Render empty cart state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
      <img src={emptyCartImage || "/placeholder.svg"} className="w-1/2 mx-auto" alt="Empty cart" />
      <p className="text-muted-foreground text-center">Your cart is empty</p>
      <SheetClose asChild>
        <Button variant="outline">Browse Courses</Button>
      </SheetClose>
    </div>
  )

  // Render price breakdown
  const renderPriceBreakdown = () => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal:</span>
        <span>{formatPrice(amounts.subtotal)}</span>
      </div>

      {/* Cart Discounts */}
      {cartSummary?.hasAnyDiscount && amounts.cartSavings > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Course Discounts:</span>
          <div className="text-right">
            <span className="text-green-600">-{formatPrice(amounts.cartSavings)}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {cartSummary.totalDiscountPercentage}% OFF
            </Badge>
          </div>
        </div>
      )}

      {/* Coupon Discount */}
      {discountData && amounts.couponSavings > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Coupon ({discountData.code}):</span>
          <div className="text-right">
            <span className="text-green-600">-{formatPrice(amounts.couponSavings)}</span>
            {discountData.discountPercentage && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {discountData.discountPercentage}% OFF
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Wallet Usage */}
      {isWalletApplied && amounts.walletAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Wallet Used:</span>
          <span className="text-blue-600">-{formatPrice(amounts.walletAmount)}</span>
        </div>
      )}

      <Separator />

      <div className="flex justify-between font-semibold text-lg">
        <span>Total:</span>
        <div className="text-right">
          <span className={amounts.totalSavings > 0 ? "text-green-600" : ""}>{formatPrice(amounts.finalAmount)}</span>
          {amounts.totalSavings > 0 && (
            <div className="text-sm text-muted-foreground line-through">{formatPrice(amounts.originalTotal)}</div>
          )}
        </div>
      </div>

      {/* Total Savings Display */}
      {amounts.totalSavings > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-green-600 border-green-600">
            🎉 You saved {formatPrice(amounts.totalSavings)} ({amounts.discountPercentage}% OFF)
          </Badge>
        </div>
      )}
    </div>
  )

  return (
    <Sheet open={openSheet} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Shopping cart">
          <CiShoppingCart className="size-7" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {cart.length}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
          <SheetTitle className="text-xl">Your Cart</SheetTitle>
          <SheetDescription className="text-sm">
            {cart.length > 0 ? `${cart.length} ${cart.length === 1 ? "course" : "courses"} in your cart` : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        {isFetching ? (
          renderLoadingState()
        ) : cart.length > 0 ? (
          <>
            {/* Cart Items - Scrollable */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-4">{cart.map(renderCartItem)}</div>
              </ScrollArea>
            </div>

            {/* Offers Section - Compact */}
            <div className="border-t bg-gray-50/50 px-6 py-3 flex-shrink-0">
              <div className="space-y-3">
                {/* Coupon Manager - Compact */}
                <div className="bg-white rounded-lg p-3 border">
                  <CouponManager
                    courseIds={cartProductIds}
                    originalAmount={amounts.subtotal}
                    onCouponSuccess={handleCouponSuccess}
                    onCouponRemove={handleCouponRemove}
                    className="text-sm"
                  />
                </div>

                {/* Wallet Toggle - Compact */}
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Use Wallet Balance</span>
                    <WalletToggle
                      walletBalance={walletBalance}
                      isLoading={isWalletLoading}
                      onWalletToggle={handleWalletToggle}
                      isWalletApplied={isWalletApplied}
                      walletAmount={amounts.walletAmount}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary & Payment */}
            <div className="border-t bg-white px-6 py-4 space-y-4 flex-shrink-0">
              {renderPriceBreakdown()}

              {/* Payment Button */}
              <SheetClose asChild>
                <Button onClick={handlePayment} className="w-full inline-flex gap-2">
                  <CiCreditCard1 className="size-6!" />
                  Proceed to Payment
                </Button>
              </SheetClose>
            </div>
          </>
        ) : (
          renderEmptyState()
        )}
      </SheetContent>
    </Sheet>
  )
}

export default CartButton
