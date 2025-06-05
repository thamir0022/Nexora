import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarRating } from "./ui/star-rating";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";

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
  const [isAdding, setIsAdding] = useState(false);
  const axios = useAxiosPrivate();
  const { cart, setCart, setOpenSheet } = useCart();
  const { user } = useAuth();

  const addToCart = async (courseId) => {
    setIsAdding(true);
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
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
      <Link to={`/courses/${_id}`}>
        <img
          src={thumbnailImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4 space-y-2">
        <Link to={`/courses/${_id}`}>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
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
          {category.map((cat) => (
            <Badge key={cat._id} variant="outline">
              {cat.name}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full">Buy</Button>
          {cart.find((item) => item._id === _id) ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpenSheet(true)}
            >
              Go to cart
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => addToCart(_id)}
              disabled={isAdding}
            >
              {isAdding ? <Loader className="size-5 animate-spin" /> : "Add to Cart"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
