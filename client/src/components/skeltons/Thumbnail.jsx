import { Skeleton } from "@/components/ui/skeleton";

export default function ThumbnailSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden animate-pulse">
            {/* Thumbnail Image Skeleton */}
            <Skeleton className="w-full h-48 rounded-none" />

            <div className="p-4 space-y-3">
                {/* Title */}
                <Skeleton className="h-5 w-3/4 rounded-md" />

                {/* Description */}
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />

                {/* Price & Rating */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                </div>

                {/* Instructor Info */}
                <div className="flex items-center gap-3">
                    <Skeleton className="size-7 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                {/* Buttons */}
                <div className="mt-3 flex gap-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                </div>
            </div>
        </div>
    );
}
