import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PiHeartStraightFill, PiHeartStraightLight } from "react-icons/pi";
import { FaStar } from "react-icons/fa";
import useRazorpay from "@/hooks/useRazorpay";
import { CiUser } from "react-icons/ci";
import { Fragment } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
} from "./ui/alert-dialog";
import paymentProcessing from "@/assets/images/payment-processing.svg";
import paymantFailed from "@/assets/images/payment-failed.svg";
import paymentSuccess from "@/assets/images/payment-success.svg";
import { AlertTitle } from "./ui/alert";

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
  effectivePrice,
  offer,
  isInCart,
  isInWishlist,
  onAddToCart,
  onAddToWishlist,
  onRemoveFromWishlist,
  addingToCart,
  openCart,
  role,
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden">
      <Link
        to={
          role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`
        }
      >
        <img
          loading="lazy"
          src={thumbnailImage}
          alt={title}
          className="w-full h-48 object-cover"
        />
      </Link>

      <div className="p-4 space-y-2">
        <Link
          to={
            role === "student" ? `/courses/${_id}` : `/dashboard/courses/${_id}`
          }
        >
          <h2 className="text-lg font-semibold line-clamp-2" title={title}>
            {title}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {description}
          </p>
        </Link>

        <div className="flex items-center gap-2">
          <span className="line-through text-muted-foreground">
            {price.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-lg font-semibold text-primary">
            {effectivePrice.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            })}
          </span>
          <Badge className="rounded-full">{offer?.discountPercentage || 0}%</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center">
            <FaStar className="fill-yellow-500" />
            <span>{rating.averageRating}</span>
          </div>
          <div className="flex items-center">
            <CiUser className="text-muted-foreground" />
            <span>{rating.ratingCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage
              src={instructor.profilePicture}
              alt={instructor.fullName}
            />
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

        {isEnrolled ? (
          <Link to={`/courses/${_id}`}>
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/80 hover:to-primary/90">
              Go to Course
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <PaymentButton amount={effectivePrice} course={_id} />
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
                {addingToCart ? (
                  <Loader className="size-5 animate-spin" />
                ) : (
                  "Add to Cart"
                )}
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

function PaymentButton({ course, amount }) {
  const { isProcessing, initiatePayment, paymentState } = useRazorpay();

  const handlePurchase = async () => {
    const orderData = {
      amount,
      isCart: false,
      course,
    };

    // The hook handles all the payment flow internally
    await initiatePayment(orderData);
  };

  return (
    <Fragment>
      <Button
        className="flex-1"
        onClick={handlePurchase}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader className="size-4 animate-spin" /> : "Buy"}
      </Button>

      <AlertDialog open={!!paymentState}>
        <AlertDialogContent className="flex flex-col items-center justify-center gap-3">
          <img
            className="h-52 mx-auto"
            src={
              paymentState === "pending"
                ? paymentProcessing
                : paymentState === "success"
                ? paymentSuccess
                : paymantFailed
            }
            alt={paymentState}
          />
          <AlertTitle className="text-muted-foreground text-lg text-center">
            Payment {paymentState}
          </AlertTitle>
          <AlertDialogCancel>
            Close
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
