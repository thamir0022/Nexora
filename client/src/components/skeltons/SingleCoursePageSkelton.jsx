import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Fragment } from "react";

const SingleCoursePageSkelton = () => {
    return (
        <div className="min-h-dvh p-5">
            <div className="grid lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Video Skeleton */}
                    <Skeleton className="w-full aspect-video rounded-xl shadow-md" />

                    {/* Title */}
                    <Skeleton className="h-6 w-3/4" />

                    {/* Instructor */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="w-full h-11 flex gap-2">
                        <Skeleton className="h-full flex-1 rounded-md" />
                        <Skeleton className="h-full flex-1 rounded-md lg:hidden" />
                        <Skeleton className="h-full flex-1 rounded-md" />
                    </div>

                    {/* Overview Content */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-10" />
                        </div>
                        <Skeleton className="h-20 w-full" />

                        <Skeleton className="h-6 w-40 mt-6 mb-3" />
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Skeleton className="size-5"/>
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sticky Lessons Card (Hidden on mobile) */}
                <div className="max-lg:hidden">
                    <Card className="sticky top-0 h-dvh">
                        <CardHeader>
                            <CardTitle className="text-lg text-center">
                                <Skeleton className="h-6 w-24 mx-auto" />
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="">
                            {[...Array(4)].map((_, i) => (
                                <Fragment key={i}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="w-24 h-16 rounded-sm" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                    </div>
                                    {i !== 3 && <Separator className="my-2" />}
                                </Fragment>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SingleCoursePageSkelton;
