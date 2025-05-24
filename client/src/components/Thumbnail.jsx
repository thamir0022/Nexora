import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogDescription,
  MorphingDialogContainer,
} from "@/components/ui/morphing-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { StarRating } from "./ui/star-rating";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";
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
  features,
  instructor,
  price,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const axios = useAxiosPrivate();
  const { cart, setCart, setOpenSheet } = useCart();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = async (courseId) => {
    setIsAdding(true);
    try {
      const { data } = await axios.post(`/users/${user._id}/cart/${courseId}`);
      if (data.success) {
        const newCart = data.cart;
        setCart(newCart);
        toast.success("Course added to cart");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to add course to cart";
      toast.error(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <MorphingDialog
      transition={{
        type: "spring",
        bounce: 0.05,
        duration: 0.25,
      }}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <MorphingDialogTrigger
        style={{
          borderRadius: "12px",
        }}
        className="flex w-full flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900"
      >
        <MorphingDialogImage
          src={thumbnailImage}
          alt={title}
          className="h-48 w-full object-cover"
        />
        <div className="flex grow flex-row items-end justify-between px-3 py-2 bg-zinc-50">
          <div className="mx-auto">
            <MorphingDialogTitle className="text-zinc-950 dark:text-zinc-50">
              {title}
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400 space-y-1">
              <div className="line-clamp-2">{description}</div>
              <div className="flex gap-2 items-center">
                <span className="font-semibold">₹ {price}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm font-semibold">
                  {rating.averageRating}
                </span>
                <StarRating size="sm" value={rating.averageRating} readonly />
                <span className="text-sm">{rating.ratingCount}</span>
              </div>
            </MorphingDialogSubtitle>
          </div>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{
            borderRadius: "24px",
          }}
          className="pointer-events-auto relative flex h-auto w-full flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900 sm:w-[500px]"
        >
          <MorphingDialogImage
            src={thumbnailImage}
            alt={title}
            className="h-full w-full"
          />
          <div className="p-6 space-y-2">
            <MorphingDialogTitle className="text-2xl text-zinc-950 dark:text-zinc-50">
              {title}
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400 space-y-2">
              <div className="flex gap-2 items-center">
                <span className="font-semibold">{rating.averageRating}</span>
                <StarRating size="md" value={rating.averageRating} readonly />
                <span>{rating.ratingCount}</span>
              </div>
              <Link
                to="#"
                className="flex gap-2 items-center w-fit cursor-pointer"
              >
                <Avatar>
                  <AvatarImage
                    className="object-cover"
                    src={instructor.profilePicture}
                  />
                  <AvatarFallback>{instructor?.fullName[0]}</AvatarFallback>
                </Avatar>
                <span className="">{instructor?.fullName}</span>
              </Link>
            </MorphingDialogSubtitle>
            <MorphingDialogDescription
              className="space-y-2"
              variants={{
                initial: { opacity: 0, scale: 0.8, y: 100 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.8, y: 100 },
              }}
            >
              <p className="mt-2 text-zinc-500 dark:text-zinc-500">
                {description}
              </p>
              <ul className="text-zinc-500">
                {features.map((feature, i) => (
                  <li key={i} className="list-disc">
                    {feature}
                  </li>
                ))}
              </ul>
              <ul className="flex gap-2">
                {category.map((c, i) => (
                  <Badge key={i} variant="outline" className="cursor-pointer">
                    {c}
                  </Badge>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <Button className="py-5">Buy</Button>
                {cart.find((item) => item._id === _id) ? (
                  <Button
                    variant="outline"
                    className="py-5"
                    onClick={() => {
                      setIsOpen(false);
                      setOpenSheet(true);
                    }}
                  >
                    Go to cart
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="py-5"
                    onClick={() => addToCart(_id)}
                  >
                    {isAdding ? (
                      <Loader className="size-6 animate-spin" />
                    ) : (
                      "Add to Cart"
                    )}
                  </Button>
                )}
              </div>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className="text-zinc-50" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
