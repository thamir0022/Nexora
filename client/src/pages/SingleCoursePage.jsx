"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { format } from "date-fns";
import {
  Clock,
  BookOpen,
  Users,
  Star,
  CheckCircle,
  Play,
  Edit,
  Trash,
  Eye,
  BarChart3,
  Plus,
  AlertTriangle,
  ArrowLeft,
  MoreHorizontal,
  Calendar,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminSingleCoursePage = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const { courseId } = useParams();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/courses/${courseId}`);

        if (!res.data?.success) {
          const message = res.data?.message || "Something went wrong";
          toast.error(message);
          setError(message);
          return;
        }

        setCourse(res.data.data);
        // Assuming the course has a published field, otherwise you can add this logic
        setIsPublished(res.data.data.status === "published");
      } catch (error) {
        console.error(error);
        const message = error.response?.data?.message || "Something went wrong";
        toast.error(message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, axios]);

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  // Calculate total course duration
  const getTotalDuration = () => {
    if (!course?.lessons) return 0;
    return course.lessons.reduce(
      (total, lesson) => total + (lesson.duration || 0),
      0
    );
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async () => {
    try {
      await axios.delete(`/courses/${courseId}`);
      toast.success("Course deleted successfully");
      navigate("/admin/courses");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle course publish status change
  const handlePublishStatusChange = async (status) => {
    try {
      await axios.patch(`/courses/${courseId}`, {
        status: status ? "published" : "draft",
      });
      setIsPublished(status);
      toast.success(
        `Course ${status ? "published" : "unpublished"} successfully`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update course status"
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Course</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Admin Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Course Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="publish-status"
              checked={isPublished}
              onCheckedChange={handlePublishStatusChange}
            />
            <Label htmlFor="publish-status">
              {isPublished ? (
                <Badge variant="success" className="bg-green-500">
                  Published
                </Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/courses/edit/${courseId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/courses/${courseId}`, "_blank")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Are you sure you want to delete this course?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the
                  course and all associated lessons.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteCourse}>
                  Delete Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Course Overview Card */}
      <Card className="mb-8">
        {/* <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {course.category?.map((cat) => (
                  <Badge key={cat._id} variant="secondary">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDate(course.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>Updated: {formatDate(course.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader> */}

        <CardContent className="space-y-2">
          <div className="rounded-xl overflow-hidden aspect-video">
            <img
              src={
                course.thumbnailImage || "/placeholder.svg?height=200&width=400"
              }
              alt={course.title}
              className="w-full h-auto object-cover aspect-video"
            />
          </div>
          <h2 className="text-2xl line-clamp-2">{course.title}</h2>

          {course.instructor ? (
            <div className="flex items-center gap-4">
              <Avatar className="size-10">
                <AvatarImage src={course.instructor.profilePicture} />
                <AvatarFallback>
                  {course.instructor?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link to="#" className="font-semibold text-lg">
                {course.instructor.fullName}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <p>No instructor assigned to this course</p>
            </div>
          )}
          <Separator />
          <p className="text-muted-foreground">{course.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {course.category?.map((cat) => (
              <Link to="#">
                <Badge key={cat._id} variant="secondary">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Content Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Overview</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Duration</div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {formatDuration(getTotalDuration())}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Lessons</div>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {course.lessons?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Enrolled</div>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {course.enrolledCount?.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Rating</div>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {course.rating?.averageRating || "0.0"}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({course.rating?.ratingCount || 0})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {course.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Course Lessons</h2>
            <Button
              onClick={() => navigate(`/admin/courses/${courseId}/lessons/add`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {course.lessons && course.lessons.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {course.lessons.map((lesson, index) => (
                    <AccordionItem key={lesson._id} value={`lesson-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-start text-left">
                          <span className="font-medium">
                            {index + 1}. {lesson.title}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-6">
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDuration(lesson.duration)}
                              </span>
                            </div>
                            {lesson.videoUrl && (
                              <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Video available</span>
                              </div>
                            )}
                            {lesson.noteUrls && lesson.noteUrls.length > 0 && (
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-green-500" />
                                <span className="text-sm">
                                  {lesson.noteUrls.length} resources
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/admin/courses/${courseId}/lessons/${lesson._id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/admin/courses/${courseId}/lessons/${lesson._id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuItem>Move Up</DropdownMenuItem>
                                <DropdownMenuItem>Move Down</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                  <p className="text-muted-foreground mb-4">
                    This course doesn't have any lessons yet.
                  </p>
                  <Button
                    onClick={() =>
                      navigate(`/admin/courses/${courseId}/lessons/add`)
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lesson
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                {course.enrolledCount
                  ? `${course.enrolledCount} students enrolled in this course`
                  : "No students enrolled yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would typically be a table of enrolled students */}
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Student data not available in this view
                </h3>
                <p className="text-muted-foreground mb-4">
                  Visit the students section to see detailed enrollment
                  information.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/students")}
                >
                  Go to Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>
                Performance metrics and engagement statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Enrollment Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px] flex items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col items-center justify-center h-[200px]">
                      <div className="text-3xl font-bold mb-2">67%</div>
                      <Progress value={67} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground mt-4">
                        Average completion rate across all enrolled students
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Rating Distribution
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="w-8 text-sm font-medium">{rating} ★</div>
                      <Progress
                        value={Math.random() * 100}
                        className="h-2 flex-1"
                      />
                      <div className="w-12 text-sm text-right text-muted-foreground">
                        {Math.floor(Math.random() * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSingleCoursePage;
