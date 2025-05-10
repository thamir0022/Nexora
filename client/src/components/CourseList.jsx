import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Star, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { StarRating } from "./star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axios = useAxiosPrivate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios("/courses");

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch courses");
        }

        setCourses(response.data.courses);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-48 bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No courses found</AlertTitle>
        <AlertDescription>
          There are no courses available at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course._id} className="overflow-hidden flex flex-col h-full">
          <div className="relative h-48 bg-muted">
            <img
              src={
                course.thumbnailImage || "/placeholder.svg?height=192&width=384"
              }
              alt={course.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=192&width=384";
              }}
            />
          </div>

          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg line-clamp-2">
                {course.title}
              </CardTitle>
            </div>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Avatar>
                <AvatarImage src={course.instructor?.profilePicture} alt={course.instructor?.fullName || "Instructor"}/>
                <AvatarFallback>
                  {course.instructor?.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {course.instructor?.fullName || "Unknown Instructor"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {course.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {course.category?.map((cat, index) => (
                <Badge key={index} variant="secondary" className="font-normal">
                  {cat}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{course.rating?.averageRating}</span>
                <StarRating value={course.rating?.averageRating} readonly />
                <span className="text-muted-foreground ml-1">
                  ({course.rating?.ratingCount || 0})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrolledCount || 0}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 text-xs text-muted-foreground border-t">
            <div className="flex justify-between w-full">
              <span>Created: {formatDate(course.createdAt)}</span>
              <span>Updated: {formatDate(course.updatedAt)}</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default CoursesList;
