import { CiHeart, CiStar, CiTrash, CiUser } from "react-icons/ci";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import emptyWishlistImage from "@/assets/images/empty-wishlist.svg";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Loader, Loader2, Star, Trash2, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { StarRating } from "./ui/star-rating";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "./ui/scroll-area";

const WishlistButton = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user } = useAuth();
  const axios = useAxiosPrivate();
  const { wishlist, setWishlist, removeItem, openSheet, setOpenSheet } = useWishlist();
  const { setCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      setIsFetching(true);
      try {
        const { data } = await axios.get(`/users/${user._id}/wishlist`);

        if (data.success) {
          const wishlistItems = data.wishlist;
          setWishlist(wishlistItems);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch wishlist";
        toast.error(errorMessage);
      } finally {
        setIsFetching(false);
      }
    };
    fetchWishlist();
  }, []);


  const moveToCart = async (courseId) => {
    setIsMoving(courseId);
    try {
      const { data } = await axios.patch(`/users/${user._id}/wishlist/${courseId}`);
      if (data.success) {
        setWishlist(data.wishlist);
        setCart(data.cart);
        toast.success("Course moved to cart");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to move course to cart";
      toast.error(message);
    } finally {
      setIsMoving(false);
    }
  }


  const removeFromWishlist = async (courseId) => {
    setIsRemoving(courseId);
    try {
      const res = await axios.delete(`/users/${user._id}/wishlist/${courseId}`);

      if (res.data.success) {
        removeItem(courseId);
        toast.success("Course removed from wishlist");
      } else {
        toast.error(res.data.message || "Failed to remove course from wishlist");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove course from cart"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCourseClick = (courseId) => {
    setOpenSheet(false);
    navigate(`/courses/${courseId}`);
  }


  return (
    <Sheet open={openSheet} onOpenChange={setOpenSheet}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative"
          aria-label="Shopping cart"
        >
          <CiHeart className="size-7" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {wishlist.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">Your Wishlist</SheetTitle>
          <SheetDescription>
            {wishlist.length > 0
              ? `${wishlist.length} ${wishlist.length === 1 ? "course" : "courses"
              } in your wishlist`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {isFetching ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your wishlist...</p>
          </div>
        ) : wishlist.length > 0 ? (
          <ScrollArea className="flex-1 h-[calc(100%-10rem)] pl-2 pr-3">
            <div className="space-y-5">
              {wishlist.map((item) => (
                <div key={item._id} className="relative">
                  <div className="flex gap-4">
                    <div onClick={() => handleCourseClick(item._id)} className="h-20 aspect-video rounded-md overflow-hidden flex-shrink-0 cursor-pointer border">
                      <img
                        className="object-cover"
                        src={
                          item.thumbnailImage ||
                          "/placeholder.svg?height=96&width=96"
                        }
                        alt={item.title}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-2 text-sm cursor-pointer"
                        onClick={() => handleCourseClick(item._id)}
                      >
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1 mt-1.5">
                        <Avatar className="size-5">
                          <AvatarImage
                            src={
                              item.instructor?.profilePicture ||
                              "/placeholder.svg"
                            }
                            alt={item.instructor?.fullName}
                          />
                          <AvatarFallback className="text-[8px]">
                            {item.instructor?.fullName?.charAt(0) || (
                              <User className="h-2 w-2" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.instructor?.fullName || "Instructor"}
                        </span>
                      </div>

                      <StarRating value={item.rating?.averageRating || 0} size="sm" totalRatingCount={item.rating?.totalRating || 0} readonly />

                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">₹{(item.price || 0).toLocaleString()}</span>
                        {isMoving === item._id ? (
                          <Loader className="size-4 text-primary animate-spin" />
                        ) : (
                          <span onClick={() => moveToCart(item._id)} className="cursor-pointer text-primary transition-all">Move to Cart</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromWishlist(item._id)}
                    disabled={isRemoving === item._id}
                  >
                    {isRemoving === item._id ? (
                      <Loader className="size-5 animate-spin" />
                    ) : (
                      <CiTrash className="size-5" />
                    )}
                  </Button>
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <img
              src={emptyWishlistImage || "/placeholder.svg"}
              className="w-1/2 mx-auto"
              alt="Empty cart"
            />
            <p className="text-muted-foreground text-center">
              Your wishlist is empty
            </p>
            <SheetClose asChild>
              <Button variant="outline">Browse Courses</Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WishlistButton;
