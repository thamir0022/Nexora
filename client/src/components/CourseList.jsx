"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { StarRating } from "./ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios("/courses");

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch courses");
        }

        setCourses(response.data.result.courses);
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

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Handle row click to navigate to course details
  const handleRowClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}`);
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor?.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (course.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 border-b px-4">
            <Skeleton className="h-6 w-full mt-3" />
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 border-b px-4 py-2">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
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

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Courses table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Course</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-muted-foreground"
                >
                  No courses match your search criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow
                  key={course._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(course._id)}
                >
                  <TableCell className="max-w-sm">
                    <div className="max-w-sm flex items-start gap-3">
                      <div className="h-12 w-16 rounded bg-muted flex-shrink-0">
                        <img
                          src={
                            course.thumbnailImage ||
                            "/placeholder.svg?height=48&width=64"
                          }
                          alt={course.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/placeholder.svg?height=48&width=64";
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="w-full text-muted-foreground break-words line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            course.instructor?.profilePicture ||
                            "/placeholder.svg"
                          }
                          alt={course.instructor?.fullName || "Instructor"}
                        />
                        <AvatarFallback className="text-xs">
                          {course.instructor?.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {course.instructor?.fullName || "Unknown Instructor"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {course.category?.slice(0, 2).map((cat, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="font-normal"
                        >
                          {cat}
                        </Badge>
                      ))}
                      {course.category?.length > 2 && (
                        <Badge variant="outline" className="font-normal">
                          +{course.category.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-medium">
                        {course.rating?.averageRating || "N/A"}
                      </span>
                      <StarRating
                        value={course.rating?.averageRating || 0}
                        readonly
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({course.rating?.ratingCount || 0})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {course.enrolledCount || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {formatDate(course.updatedAt)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default CoursesList;
