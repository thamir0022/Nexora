import { CiShoppingCart, CiTrash } from "react-icons/ci"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import emptyCartImage from "@/assets/images/empty-cart.svg"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { Loader, Loader2, User } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"
import { StarRating } from "./ui/star-rating"
import { useWishlist } from "@/context/WishlistContext"
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "./ui/scroll-area"
import PaymentButton from "./PaymentButton"
import WalletToggle from "./wallet-toggle"
import CouponManager from "./coupon-manager"
import { Badge } from "./ui/badge"

const CartButton = () => {
  // Loading states
  const [isFetching, setIsFetching] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  // Cart data
  const [cartProductIds, setCartProductIds] = useState([])

  // Discount states
  const [discountData, setDiscountData] = useState(null)

  // Wallet states
  const [walletBalance, setWalletBalance] = useState(0)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const [isWalletApplied, setIsWalletApplied] = useState(false)

  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const { cart, setCart, removeItem, openSheet, setOpenSheet } = useCart()
  const { setWishlist } = useWishlist()
  const navigate = useNavigate()

  // Calculate amounts using useMemo for better performance
  const amounts = useMemo(() => {
    // Original cart total
    const originalTotal = cart.reduce((acc, item) => acc + (item.price || 0), 0)

    // After coupon discount
    const afterCoupon = discountData ? discountData.finalPrice : originalTotal

    // Wallet amount to be used
    const walletAmount = isWalletApplied && walletBalance > 0 ? Math.min(walletBalance, afterCoupon) : 0

    // Final amount to be charged
    const finalAmount = Math.max(0, afterCoupon - walletAmount)

    return {
      originalTotal,
      afterCoupon,
      walletAmount,
      finalAmount,
      totalSavings: originalTotal - finalAmount,
    }
  }, [cart, discountData, isWalletApplied, walletBalance])

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
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
  }

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      if (!user?._id) return

      setIsFetching(true)
      try {
        const { data } = await axios.get(`/users/${user._id}/cart`)
        if (data.success) {
          setCart(data.cart)
          setCartProductIds(data.cart.map((item) => item._id))
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch cart"
        toast.error(errorMessage)
      } finally {
        setIsFetching(false)
      }
    }

    fetchCart()
    fetchWalletBalance()
  }, [user?._id])

  // Cart actions
  const removeFromCart = async (courseId) => {
    setIsRemoving(courseId)
    try {
      const res = await axios.delete(`/users/${user._id}/cart/${courseId}`)
      if (res.data.success) {
        removeItem(courseId)
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
  }

  const moveToWishlist = async (courseId) => {
    setIsMoving(courseId)
    try {
      const { data } = await axios.patch(`/users/${user._id}/cart/${courseId}`)
      if (data.success) {
        setWishlist(data.wishlist)
        setCart(data.cart)
        toast.success("Course moved to wishlist")
        resetDiscounts()
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to move course to wishlist"
      toast.error(message)
    } finally {
      setIsMoving(false)
    }
  }

  // Discount handlers
  const resetDiscounts = () => {
    setDiscountData(null)
    setIsWalletApplied(false)
  }

  const handleCouponSuccess = (couponData) => {
    setDiscountData(couponData)
  }

  const handleCouponRemove = () => {
    setDiscountData(null)
  }

  const handleWalletToggle = (pressed) => {
    setIsWalletApplied(pressed)
  }

  // Navigation
  const handleCourseClick = (courseId) => {
    setOpenSheet(false)
    navigate(`/courses/${courseId}`)
  }

  // Utility
  const formatPrice = (price) => `₹${price.toLocaleString()}`


console.log("FINAL AMOUNT",amounts.finalAmount);

  return (
    <Sheet open={openSheet} onOpenChange={setOpenSheet}>
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

        {isFetching ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        ) : cart.length > 0 ? (
          <>
            {/* Cart Items - Scrollable */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-4">
                  {cart.map((item, index) => (
                    <div key={item._id} className="relative group">
                      <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Course Image */}
                        <div
                          onClick={() => handleCourseClick(item._id)}
                          className="h-20 w-32 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border shadow-sm"
                        >
                          <img
                            className="object-cover w-full h-full hover:scale-105 transition-transform"
                            src={item.thumbnailImage || "/placeholder.svg?height=80&width=128"}
                            alt={item.title}
                          />
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
                          <div className="flex items-center gap-2">
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

                          {/* Price and Rating */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg text-primary">{formatPrice(item.price || 0)}</span>
                            <div className="flex items-center gap-2">
                              <StarRating
                                size="sm"
                                value={item.rating?.averageRating || 0}
                                readonly
                                showCount={false}
                              />
                            </div>
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
                          {isRemoving === item._id ? (
                            <Loader className="size-4 animate-spin" />
                          ) : (
                            <CiTrash className="size-4" />
                          )}
                        </Button>
                      </div>

                      {index < cart.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Offers Section - Compact */}
            <div className="border-t bg-gray-50/50 px-6 py-3 flex-shrink-0">
              <div className="space-y-3">
                {/* Coupon Manager - Compact */}
                <div className="bg-white rounded-lg p-3 border">
                  <CouponManager
                    courseIds={cartProductIds}
                    originalAmount={amounts.originalTotal}
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
              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatPrice(amounts.originalTotal)}</span>
                </div>

                {discountData && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({discountData.code}):</span>
                    <div className="text-right">
                      <span className="text-green-600">-{formatPrice(discountData.discountAmount)}</span>
                      {discountData.discountPercentage && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {discountData.discountPercentage}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

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
                    <span className={amounts.totalSavings > 0 ? "text-green-600" : ""}>
                      {formatPrice(amounts.finalAmount)}
                    </span>
                    {amounts.totalSavings > 0 && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(amounts.originalTotal)}
                      </div>
                    )}
                  </div>
                </div>

                {amounts.totalSavings > 0 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      🎉 You saved {formatPrice(amounts.totalSavings)}!
                    </Badge>
                  </div>
                )}
              </div>

              {/* Payment Button */}
              <SheetClose asChild>
                <PaymentButton
                  course={cartProductIds}
                  className="w-full py-3 text-lg font-semibold"
                  isCart={true}
                  icon
                  text="Proceed to Checkout"
                  amount={amounts.finalAmount}
                  walletAmount={amounts.walletAmount > 0 ? amounts.walletAmount : undefined}
                  couponCode={discountData?.code || undefined}
                />
              </SheetClose>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
            <img src={emptyCartImage || "/placeholder.svg"} className="w-1/2 mx-auto" alt="Empty cart" />
            <p className="text-muted-foreground text-center">Your cart is empty</p>
            <SheetClose asChild>
              <Button variant="outline">Browse Courses</Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default CartButton
