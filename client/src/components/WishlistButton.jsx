"use client"

import { CiHeart, CiTrash } from "react-icons/ci"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import emptyWishlistImage from "@/assets/images/empty-wishlist.svg"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { Loader, Loader2, User } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useWishlist } from "@/context/WishlistContext"
import { useCart } from "@/context/CartContext"
import { StarRating } from "./ui/star-rating"
import { useNavigate } from "react-router-dom"
import { ScrollArea } from "./ui/scroll-area"

const WishlistButton = () => {
  // Loading states
  const [isFetching, setIsFetching] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Hooks
  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const { wishlist, setWishlist, removeItem, openSheet, setOpenSheet } = useWishlist()
  const { setCart } = useCart()
  const navigate = useNavigate()

  // Fetch wishlist data
  const fetchWishlistData = useCallback(async () => {
    if (!user?._id) return

    setIsFetching(true)
    try {
      const { data } = await axios.get(`/users/${user._id}/wishlist`)
      if (data.success) {
        setWishlist(data.wishlist)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch wishlist"
      toast.error(errorMessage)
    } finally {
      setIsFetching(false)
    }
  }, [user?._id, axios, setWishlist])

  // Handle sheet open - fetch data when wishlist is opened
  const handleSheetOpenChange = useCallback(
    (open) => {
      setOpenSheet(open)

      if (open && !hasInitialFetch && user?._id) {
        fetchWishlistData().then(() => {
          setHasInitialFetch(true)
        })
      }
    },
    [openSheet, hasInitialFetch, user?._id, fetchWishlistData, setOpenSheet],
  )

  // Reset data when user changes
  useEffect(() => {
    if (!user?._id) {
      setHasInitialFetch(false)
    }
  }, [user?._id])

  // Move course to cart
  const moveToCart = useCallback(
    async (courseId) => {
      setIsMoving(courseId)
      try {
        const { data } = await axios.patch(`/users/${user._id}/wishlist/${courseId}`)
        if (data.success) {
          setWishlist(data.wishlist)
          setCart(data.cart)
          toast.success("Course moved to cart")
        }
      } catch (error) {
        const message = error.response?.data?.message || "Failed to move course to cart"
        toast.error(message)
      } finally {
        setIsMoving(false)
      }
    },
    [axios, user._id, setWishlist, setCart],
  )

  // Remove course from wishlist
  const removeFromWishlist = useCallback(
    async (courseId) => {
      setIsRemoving(courseId)
      try {
        const res = await axios.delete(`/users/${user._id}/wishlist/${courseId}`)
        if (res.data.success) {
          removeItem(courseId)
          toast.success("Course removed from wishlist")
        } else {
          toast.error(res.data.message || "Failed to remove course from wishlist")
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to remove course from wishlist")
      } finally {
        setIsRemoving(false)
      }
    },
    [axios, user._id, removeItem],
  )

  // Navigate to course page
  const handleCourseClick = useCallback(
    (courseId) => {
      setOpenSheet(false)
      navigate(`/courses/${courseId}`)
    },
    [setOpenSheet, navigate],
  )

  // Format price
  const formatPrice = useCallback((price) => {
    return `₹${(price || 0).toLocaleString()}`
  }, [])

  // Render wishlist item
  const renderWishlistItem = useCallback(
    (item, index) => (
      <div key={item._id} className="relative">
        <div className="flex gap-4">
          {/* Course Image */}
          <div
            onClick={() => handleCourseClick(item._id)}
            className="h-20 aspect-video rounded-md overflow-hidden flex-shrink-0 cursor-pointer border hover:shadow-md transition-shadow"
          >
            <img
              className="object-cover w-full h-full hover:scale-105 transition-transform"
              src={item.thumbnailImage || "/placeholder.svg?height=96&width=96"}
              alt={item.title}
            />
          </div>

          {/* Course Details */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium line-clamp-2 text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleCourseClick(item._id)}
            >
              {item.title}
            </h3>

            {/* Instructor */}
            <div className="flex items-center gap-1 mt-1.5">
              <Avatar className="size-5">
                <AvatarImage
                  src={item.instructor?.profilePicture || "/placeholder.svg"}
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

            {/* Rating */}
            <StarRating
              value={item.rating?.averageRating || 0}
              size="sm"
              totalRatingCount={item.rating?.totalRating || 0}
              readonly
            />

            {/* Price and Actions */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">{formatPrice(item.effectivePrice || item.price)}</span>
                {item.hasDiscount && item.price !== item.effectivePrice && (
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                )}
              </div>

              {isMoving === item._id ? (
                <Loader className="size-4 text-primary animate-spin" />
              ) : (
                <button
                  onClick={() => moveToCart(item._id)}
                  className="text-xs text-primary hover:underline transition-colors font-medium"
                >
                  Move to Cart
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => removeFromWishlist(item._id)}
          disabled={isRemoving === item._id}
        >
          {isRemoving === item._id ? <Loader className="size-4 animate-spin" /> : <CiTrash className="size-4" />}
        </Button>

        {index < wishlist.length - 1 && <Separator className="mt-4" />}
      </div>
    ),
    [handleCourseClick, formatPrice, isMoving, isRemoving, wishlist.length, moveToCart, removeFromWishlist],
  )

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center flex-1">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading your wishlist...</p>
    </div>
  )

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <img src={emptyWishlistImage || "/placeholder.svg"} className="w-1/2 mx-auto" alt="Empty wishlist" />
      <p className="text-muted-foreground text-center">Your wishlist is empty</p>
      <SheetClose asChild>
        <Button variant="outline">Browse Courses</Button>
      </SheetClose>
    </div>
  )

  return (
    <Sheet open={openSheet} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Wishlist">
          <CiHeart className="size-7" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {wishlist.length}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col h-full w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
          <SheetTitle className="text-xl">Your Wishlist</SheetTitle>
          <SheetDescription className="text-sm">
            {wishlist.length > 0
              ? `${wishlist.length} ${wishlist.length === 1 ? "course" : "courses"} in your wishlist`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        {isFetching ? (
          renderLoadingState()
        ) : wishlist.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-4">{wishlist.map(renderWishlistItem)}</div>
            </ScrollArea>
          </div>
        ) : (
          renderEmptyState()
        )}
      </SheetContent>
    </Sheet>
  )
}

export default WishlistButton
