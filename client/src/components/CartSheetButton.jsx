import { CiShoppingCart, CiTrash } from "react-icons/ci"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import emptyCartImage from "@/assets/images/empty-cart.svg"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { Loader, Loader2, User } from "lucide-react"
import { useEffect, useState } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"
import { StarRating } from "./ui/star-rating"
import { useWishlist } from "@/context/WishlistContext"
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "./ui/scroll-area"
import PaymentButton from "./PaymentButton"
import CouponInput from "./CouponInput"
import { Badge } from "./ui/badge"

const CartButton = () => {
  const [isFetching, setIsFetching] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [originalTotalPrice, setOriginalTotalPrice] = useState(0)
  const [discountData, setDiscountData] = useState(null)
  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const { cart, setCart, removeItem, openSheet, setOpenSheet } = useCart()
  const { setWishlist } = useWishlist()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCart = async () => {
      setIsFetching(true)
      try {
        const { data } = await axios.get(`/users/${user._id}/cart`)

        if (data.success) {
          const cartItems = data.cart
          setCart(cartItems)
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to fetch cart"
        toast.error(errorMessage)
      } finally {
        setIsFetching(false)
      }
    }
    fetchCart()
  }, [])

  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = cart.reduce((acc, item) => {
        return acc + item.price
      }, 0)
      setTotalPrice(total)
      setOriginalTotalPrice(total)
    }

    calculateTotalPrice()
  }, [cart])

  const removeFromCart = async (courseId) => {
    setIsRemoving(true)
    try {
      const res = await axios.delete(`/users/${user._id}/cart/${courseId}`)

      if (res.data.success) {
        removeItem(courseId)
        toast.success("Course removed from cart")
        // Reset coupon when cart changes
        setDiscountData(null)
        setTotalPrice(originalTotalPrice)
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
        // Reset coupon when cart changes
        setDiscountData(null)
        setTotalPrice(originalTotalPrice)
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to move course to wishlist"
      toast.error(message)
    } finally {
      setIsMoving(false)
    }
  }

  const handleCourseClick = (courseId) => {
    setOpenSheet(false)
    navigate(`/courses/${courseId}`)
  }

  const handleCouponSuccess = (couponData) => {
    setDiscountData(couponData)
    setTotalPrice(Math.max(0, couponData.finalPrice))
  }

  const handleCouponRemove = () => {
    setDiscountData(null)
    setTotalPrice(originalTotalPrice)
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString()}`
  }

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
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">Your Cart</SheetTitle>
          <SheetDescription>
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
            <ScrollArea className="h-[250px] pl-2 pr-3">
              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item._id} className="relative">
                    <div className="flex gap-4">
                      <div
                        onClick={() => handleCourseClick(item._id)}
                        className="h-20 aspect-video rounded-md overflow-hidden flex-shrink-0 cursor-pointer border"
                      >
                        <img
                          className="object-cover"
                          src={item.thumbnailImage || "/placeholder.svg?height=96&width=96" || "/placeholder.svg"}
                          alt={item.title}
                        />
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <h3
                          className="font-medium line-clamp-2 text-sm cursor-pointer"
                          onClick={() => handleCourseClick(item._id)}
                        >
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-1">
                          <Avatar className="size-5">
                            <AvatarImage
                              src={item.instructor?.profilePicture || "/placeholder.svg" || "/placeholder.svg"}
                              alt={item.instructor?.fullName}
                            />
                            <AvatarFallback className="text-[8px]">
                              {item.instructor?.fullName?.charAt(0) || <User className="h-2 w-2" />}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {item.instructor?.fullName || "Instructor"}
                          </span>
                        </div>

                        <StarRating
                          size="sm"
                          value={item.rating?.averageRating || 0}
                          readonly
                          totalRatingCount={item.rating?.totalRating || 0}
                        />

                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">₹{(item.price || 0).toLocaleString()}</span>
                          {isMoving === item._id ? (
                            <Loader className="size-4 text-primary animate-spin" />
                          ) : (
                            <span
                              onClick={() => moveToWishlist(item._id)}
                              className="cursor-pointer text-primary transition-all"
                            >
                              Move to Wishlist
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item._id)}
                      disabled={isRemoving === item._id}
                    >
                      {isRemoving === item._id ? (
                        <Loader className="size-4 animate-spin" />
                      ) : (
                        <CiTrash className="size-5" />
                      )}
                    </Button>

                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-auto pt-4 space-y-4">
              {/* Coupon Input */}
              <CouponInput
                courseIds={cart.map((item) => item._id)}
                originalAmount={originalTotalPrice}
                onCouponSuccess={handleCouponSuccess}
                onCouponRemove={handleCouponRemove}
              />

              {/* Price Breakdown */}
              <div className="bg-muted/40 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(originalTotalPrice)}</span>
                  </div>

                  {discountData && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount ({discountData.code}):</span>
                        <div className="text-right">
                          <span className="text-green-600">-{formatPrice(discountData.discountAmount)}</span>
                          {discountData.discountPercentage && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {discountData.discountPercentage}% OFF
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount Type:</span>
                        <span className="capitalize">
                          {discountData.discountType}
                          {discountData.discountType === "percentage" && ` (${discountData.discountValue}%)`}
                          {discountData.discountType === "fixed" && ` (${formatPrice(discountData.discountValue)})`}
                        </span>
                      </div>

                      <Separator className="my-2" />
                    </>
                  )}

                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <div className="text-right">
                      <span className={discountData ? "text-green-600" : ""}>{formatPrice(totalPrice)}</span>
                      {discountData && originalTotalPrice !== totalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(originalTotalPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  {discountData && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        You saved {formatPrice(originalTotalPrice - totalPrice)}!
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter className="flex justify-end">
                <SheetClose asChild>
                  <PaymentButton isCart text="Proceed to Checkout" amount={totalPrice} couponData={discountData} />
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
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
