import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { CiEdit, CiTrash, CiCircleCheck } from "react-icons/ci"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { StarRating } from "./ui/star-rating"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

// Validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5, "Rating cannot exceed 5 stars"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(500, "Comment cannot exceed 500 characters")
    .trim(),
})

// Write Review Component
export const WriteReview = ({ onSubmit, isSubmitting = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  })

  const watchedRating = watch("rating")

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data)
      reset()
      toast.success("Review submitted successfully!")
    } catch (error) {
      console.log(error)
      toast.error("Failed to submit review. Please try again.")
    }
  }

  return (
    <div className="space-y-4 p-4 border-b">
      <h3 className="font-semibold text-lg">Write a Review</h3>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Rating Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rating</Label>
          <div className="flex items-center gap-2">
            <StarRating size="sm" value={watchedRating} onChange={(rating) => setValue("rating", rating)} />
            <span className="text-sm text-muted-foreground">
              {watchedRating > 0 && `${watchedRating} star${watchedRating > 1 ? "s" : ""}`}
            </span>
          </div>
          {errors.rating && <p className="text-sm text-red-500">{errors.rating.message}</p>}
        </div>

        {/* Comment Section */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            Comment
          </Label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this course..."
            className="min-h-20 max-h-32 resize-none"
            {...register("comment")}
          />
          {errors.comment && <p className="text-sm text-red-500">{errors.comment.message}</p>}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum 10 characters</span>
            <span>{watch("comment")?.length || 0}/500</span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-10">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Individual Review Item Component
const ReviewItem = ({ review, currentUserId, onEdit, onDelete, isEditing, onEditToggle }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAuthor = currentUserId === review.user._id
  const isUpdated = review.updatedAt && review.updatedAt !== review.createdAt

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: review.rating,
      comment: review.comment,
    },
  })

  const watchedRating = watch("rating")

  const handleEdit = async (data) => {
    if (!onEdit) return

    try {
      setIsSubmitting(true)
      await onEdit(review._id, data)
      onEditToggle(null)
      toast.success("Review updated successfully!")
    } catch (error) {
      toast.error("Failed to update review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    try {
      setIsSubmitting(true)
      await onDelete(review._id)
      setShowDeleteDialog(false)
      toast.success("Review deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    reset({
      rating: review.rating,
      comment: review.comment,
    })
    onEditToggle(null)
  }

  return (
    <>
      <div className="space-y-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        {/* User Info Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.user.profilePicture || "/placeholder.svg"} alt={review.user.fullName} />
              <AvatarFallback className="text-xs">{review.user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-sm">{review.user.fullName}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                {isUpdated && <span>• edited</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isAuthor && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditToggle(review._id)}
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
              >
                <CiEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <CiTrash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="ml-11 space-y-2">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSubmit(handleEdit)} className="space-y-3">
              <div className="space-y-1">
                <StarRating size="sm" value={watchedRating} onChange={(rating) => setValue("rating", rating)} />
                {errors.rating && <p className="text-xs text-red-500">{errors.rating.message}</p>}
              </div>

              <div className="space-y-1">
                <Textarea
                  placeholder="Update your review..."
                  className="min-h-16 max-h-24 resize-none text-sm"
                  {...register("comment")}
                />
                {errors.comment && <p className="text-xs text-red-500">{errors.comment.message}</p>}
                <div className="text-xs text-muted-foreground text-right">{watch("comment")?.length || 0}/500</div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 px-3 text-xs">
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="h-7 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <>
              <StarRating size="sm" value={review.rating} readonly />
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Deleting..." : "Delete Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Main Reviews Component
const Reviews = ({ reviews, currentUserId, onEdit, onDelete, isLoading = false }) => {
  const [editingReviewId, setEditingReviewId] = useState(null)

  const handleEditToggle = (reviewId) => {
    setEditingReviewId(reviewId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-2 p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="ml-11 space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet. Be the first to share your experience!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Reviews ({reviews.length})</h3>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <React.Fragment key={review._id}>
              <ReviewItem
                review={review}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                isEditing={editingReviewId === review._id}
                onEditToggle={handleEditToggle}
              />
              {index < reviews.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Reviews
