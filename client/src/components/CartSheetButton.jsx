import { CiShoppingCart } from "react-icons/ci";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import emptyCartImage from "@/assets/images/empty-cart.svg";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Loader2, Star, Trash2, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";

const CartButton = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const { user } = useAuth();
  const axios = useAxiosPrivate();
  const {cart, setCart, removeItem, openSheet, setOpenSheet} = useCart();

  useEffect(() => {
    const fetchCart = async () => {
      setIsFetching(true);
      try {
        const { data } = await axios.get(`/users/${user._id}/cart`);

        if (data.success) {
          const cartItems = data.cart;
          setCart(cartItems);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch cart";
        toast.error(errorMessage);
      } finally {
        setIsFetching(false);
      }
    };
    fetchCart();
  }, []);

  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = cart.reduce((acc, item) => {
        return acc + item.price;
      }, 0);
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [cart]);

  const removeFromCart = async (courseId) => {
    setIsRemoving(true);
    try {
      const res = await axios.delete(`/users/${user._id}/cart/${courseId}`);

      if (res.data.success) {
        removeItem(courseId);
        toast.success("Course removed from cart");
      } else {
        toast.error(res.data.message || "Failed to remove course from cart");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove course from cart"
      );
    } finally {
      setIsRemoving(false);
    }
  };
  

  return (
    <Sheet open={openSheet} onOpenChange={setOpenSheet}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative"
          aria-label="Shopping cart"
        >
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
            {cart.length > 0
              ? `${cart.length} ${
                  cart.length === 1 ? "course" : "courses"
                } in your cart`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {isFetching ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        ) : cart.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-2">
              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item._id} className="relative">
                    <div className="flex gap-4">
                      <div className="w-36 rounded-md overflow-hidden flex-shrink-0 border">
                        <img
                          className="size-full object-cover"
                          src={
                            item.thumbnailImage ||
                            "/placeholder.svg?height=96&width=96"
                          }
                          alt={item.title}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-2 text-sm">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-1 mt-1.5">
                          <Avatar className="h-4 w-4">
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

                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs">
                              {item.rating?.averageRating || "0"}{" "}
                              <span className="text-muted-foreground">
                                ({item.rating?.ratingCount || "0"})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {item.enrolledCount?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 font-medium">
                          ₹{(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item._id)}
                      disabled={isRemoving === item._id}
                    >
                      {isRemoving === item._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>

                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className="bg-muted/40 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground text-sm">
                    Subtotal:
                  </span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className="text-lg">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <SheetFooter className="flex justify-end">
                <SheetClose asChild>
                  <Button className="w-full sm:w-auto">
                    Proceed to Checkout
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <img
              src={emptyCartImage || "/placeholder.svg"}
              className="w-1/2 mx-auto"
              alt="Empty cart"
            />
            <p className="text-muted-foreground text-center">
              Your cart is empty
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

export default CartButton;
