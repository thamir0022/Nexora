import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarRating } from "./ui/star-rating";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCart } from "@/context/CartContext";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";
import { SlHeart } from "react-icons/sl";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useWishlist } from "@/context/WishlistContext";

import { PiHeartFill, PiHeartStraightFill, PiHeartStraightLight } from "react-icons/pi";


export default function Thumbnail({
  _id,
  title,
  description,
  thumbnailImage,
  rating,
  category,
  instructor,
  price,
}) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [removingFromWishlist, setRemovingFromWishlist] = useState(false);
  const axios = useAxiosPrivate();
  const { cart, setCart, setOpenSheet } = useCart();
  const { wishlist, setWishlist } = useWishlist();
  const { user } = useAuth();

  const addToCart = async (courseId) => {
    setAddingToCart(true);
    try {
      const { data } = await axios.post(`/users/${user._id}/cart/${courseId}`);
      if (data.success) {
        setCart(data.cart);
        toast.success("Course added to cart");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add course to cart";
      toast.error(message);
    } finally {
      setAddingToCart(false);
    }
  };

  const addToWishlist = async (courseId) => {
    setAddingToWishlist(true);
    try {
      const { data } = await axios.post(`/users/${user._id}/wishlist/${courseId}`);
      if (data.success) {
        setWishlist(data.wishlist);
        toast.success("Course added to wishlist");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add course to wishlist";
      toast.error(message);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const removeFromWishlist = async (courseId) => {
    setRemovingFromWishlist(true);
    try {
      const { data } = await axios.delete(`/users/${user._id}/wishlist/${courseId}`);
      if (data.success) {
        setWishlist((prev) => prev.filter((item) => item._id !== courseId));
        toast.success("Course removed from wishlist");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to remove course from wishlist";
      toast.error(message);
    } finally {
      setRemovingFromWishlist(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
      <Link to={user?.role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`}>
        <img
          src={thumbnailImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4 space-y-2">
        <Link to={user?.role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`}>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">{title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{description}</p>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-semibold">₹ {price}</span>
          <StarRating size="sm" value={rating.averageRating} readonly />
          <span className="text-sm text-muted">{rating.ratingCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage src={instructor.profilePicture} alt={instructor.fullName} />
            <AvatarFallback>{instructor?.fullName[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{instructor.fullName}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {category.slice(0, 2).map((cat) => (
            <Badge key={cat._id} variant="outline">
              {cat.name}
            </Badge>
          ))}

          {category.length > 2 && (
            <Badge variant="outline">+{category.length - 2}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button className="flex-1">Buy</Button>
          {cart.find((item) => item._id === _id) ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpenSheet(true)}
            >
              Go to cart
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => addToCart(_id)}
              disabled={addingToCart}
            >
              {addingToCart ? <Loader className="size-5 animate-spin" /> : "Add to Cart"}
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger>
              {wishlist.find((item) => item._id === _id) ? (
                <PiHeartStraightFill
                  onClick={() => removeFromWishlist(_id)}
                  disabled={removingFromWishlist}
                  className="size-6 fill-primary cursor-pointer"
                />
              ) : (
                <PiHeartStraightLight
                  onClick={() => addToWishlist(_id)}
                  disabled={addingToWishlist}
                  className="size-6 text-primary hover:text-primary cursor-pointer"
                />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {wishlist.find((item) => item._id === _id)
                ? "Remove from wishlist"
                : "Add to wishlist"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
