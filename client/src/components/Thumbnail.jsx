import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarRating } from "./ui/star-rating";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PiHeartStraightFill, PiHeartStraightLight } from "react-icons/pi";
import PaymentButton from "./PaymentButton";

export default function Thumbnail({
  _id,
  title,
  description,
  isEnrolled,
  thumbnailImage,
  rating,
  category,
  instructor,
  price,
  isInCart,
  isInWishlist,
  onAddToCart,
  onAddToWishlist,
  onRemoveFromWishlist,
  addingToCart,
  modifyingWishlist,
  openCart,
  role,
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden">
      <Link to={role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`}>
        <img loading="lazy" src={thumbnailImage} alt={title} className="w-full h-48 object-cover" />
      </Link>

      <div className="p-4 space-y-2">
        <Link to={role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`}>
          <h2 className="text-lg font-semibold line-clamp-2" title={title}>{title}</h2>
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
          {category.length > 2 && <Badge variant="outline">+{category.length - 2}</Badge>}
        </div>

        {isEnrolled ? (
          <Link to={`/courses/${_id}`}><Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90">Go to Course</Button></Link>
        ) : (
          <div className="flex items-center gap-2">
            <PaymentButton className="flex-1" amount={price} course={[_id]} text="Buy" />
            {isInCart ? (
              <Button variant="outline" className="flex-1" onClick={openCart}>
                Go to cart
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onAddToCart(_id)}
                disabled={addingToCart}
              >
                {addingToCart ? <Loader className="size-5 animate-spin" /> : "Add to Cart"}
              </Button>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                {isInWishlist ? (
                  <PiHeartStraightFill
                    onClick={() => onRemoveFromWishlist(_id)}
                    className="size-6 fill-primary cursor-pointer"
                  />
                ) : (
                  <PiHeartStraightLight
                    onClick={() => onAddToWishlist(_id)}
                    className="size-6 text-primary hover:text-primary cursor-pointer"
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
