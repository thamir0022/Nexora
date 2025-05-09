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
import { StarRating } from "./star-rating";
import { Button } from "./ui/button";

export default function Thumbnail({
  id,
  title,
  description,
  thumbnailImage,
  rating,
  category,
  features,
  instructor,
}) {
  return (
    <MorphingDialog
      key={id}
      transition={{
        type: "spring",
        bounce: 0.05,
        duration: 0.25,
      }}
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
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              <div className="flex gap-2 items-center">
                <StarRating
                  size="md"
                  defaultRating={rating.averageRating}
                  readonly
                />
                <span>{rating.ratingCount}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{instructor.fullName[0]}</AvatarFallback>
                </Avatar>
                <span className="">{instructor.fullName}</span>
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
            <MorphingDialogSubtitle className="text-zinc-700 dark:text-zinc-400">
              <div className="flex gap-2 items-center">
                <StarRating
                  size="md"
                  defaultRating={rating.averageRating}
                  readonly
                />
                <span>{rating.ratingCount}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{instructor.fullName[0]}</AvatarFallback>
                </Avatar>
                <span className="">{instructor.fullName}</span>
              </div>
            </MorphingDialogSubtitle>
            <MorphingDialogDescription
              className="space-y-2"
              disableLayoutAnimation
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
                  <li key={i} className="list-disc">{feature}</li>
                ))}
              </ul>
              <ul className="flex gap-2">
                {category.map((c, i) => (
                  <li key={i} className="text-sm link px-2 py-1 rounded-full bg-blue-500/10">
                    {c}
                  </li>
                ))}
              </ul>
              <Button className="w-full">Buy This Course</Button>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className="text-zinc-50" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
