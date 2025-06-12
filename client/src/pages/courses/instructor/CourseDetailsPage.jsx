"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { Reorder, motion } from "framer-motion";
import {
  ArrowLeft,
  Trash,
  Plus,
  Edit,
  Save,
  X,
  AlertTriangle,
  BookOpen,
  Loader2,
  GripVertical,
  Play,
  Check,
  ChevronsUpDown,
  MoreVertical,
  Clock,
} from "lucide-react";
import uploadImageSvg from "@/assets/images/image.svg";
import uploadVideoSvg from "@/assets/images/video.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/video-player";
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget";
import { CardFooter } from "@/components/ui/card";
import CustomInput from "@/components/CustomInput";
import { lessonFields } from "@/constants/inputFields";

const InstructorSingleCoursePage = () => {
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mode, setMode] = useState("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [editedCourse, setEditedCourse] = useState({});
  const [open, setOpen] = useState(false);

  // Lesson management states
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isLessonDeleteDialogOpen, setIsLessonDeleteDialogOpen] =
    useState(false);
  const [isLessonEditDialogOpen, setIsLessonEditDialogOpen] = useState(false);
  const [editedLesson, setEditedLesson] = useState({});
  const [isLessonSaving, setIsLessonSaving] = useState(false);
  const [isLessonDeleting, setIsLessonDeleting] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: "",
    description: "",
    thumbnailImage: "",
    videoUrl: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLessonData((prev) => ({ ...prev, [name]: value }));
  };

  const { courseId } = useParams();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const fetchAllCategories = async () => {
    try {
      setCategoriesLoading(true);
      const { data } = await axios.get("/categories");

      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCourse = async (courseId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/courses/${courseId}`);

      if (!data?.success) {
        const message = data?.message || "Failed to fetch course";
        return toast.error(message);
      }

      setCourse(data.course);
      const formattedCourse = {
        ...data.course,
        lessons: data.course?.lessons.map((lesson) => lesson._id),
      };
      setEditedCourse(formattedCourse);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      setError(message);
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      await Promise.all([fetchCourse(courseId), fetchAllCategories()]);
    };

    fetchData();
  }, [courseId]);

  // Handle course deletion
  const handleDeleteCourse = async () => {
    try {
      const res = await axios.delete(`/courses/${courseId}`);
      if (res.data.success) toast.success("Course deleted successfully");
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const res = await axios.patch(`/courses/${courseId}`, editedCourse);
      if (res.data.success) {
        const updatedCourse = res.data.updatedCourse;
        setCourse({
          ...updatedCourse,
        });
        setMode("preview");
        toast.success("Course updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedCourse(course);
    setMode("preview");
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditedCourse((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    if (category) {
      const isSelected = editedCourse.category.some(
        (cat) => cat._id === categoryId
      );

      if (isSelected) {
        setEditedCourse((prev) => ({
          ...prev,
          category: prev.category.filter((cat) => cat._id !== categoryId),
        }));
      } else {
        setEditedCourse((prev) => ({
          ...prev,
          category: [...prev.category, category],
        }));
      }
    }
  };

  // Remove category
  const removeCategory = (categoryId) => {
    setEditedCourse((prev) => ({
      ...prev,
      category: prev.category.filter((cat) => cat._id !== categoryId),
    }));
  };

  // Handle features reorder
  const updateFeatures = (newFeatures) => {
    setEditedCourse((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  // Handle lessons reorder
  const updateLessons = (newLessons) => {
    setEditedCourse((prev) => ({
      ...prev,
      lessons: newLessons,
    }));
  };

  // Add new feature
  const addFeature = () => {
    setEditedCourse((prev) => ({
      ...prev,
      features: [...(prev.features || []), ""],
    }));
  };

  // Remove feature
  const removeFeature = (index) => {
    const newFeatures = editedCourse.features.filter((_, i) => i !== index);
    setEditedCourse((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  // Handle feature text change
  const handleFeatureChange = (index, value) => {
    const newFeatures = [...(editedCourse.features || [])];
    newFeatures[index] = value;
    setEditedCourse((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  // Lesson management functions
  const handleLessonEdit = (lesson) => {
    setSelectedLesson(lesson);
    setEditedLesson({ ...lesson });
    setIsLessonEditDialogOpen(true);
  };

  const handleLessonDelete = (lesson) => {
    setSelectedLesson(lesson);
    setIsLessonDeleteDialogOpen(true);
  };

  const handleLessonInputChange = (field, value) => {
    setEditedLesson((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveLesson = async () => {
    try {
      setIsLessonSaving(true);
      const res = await axios.patch(
        `courses/${courseId}/lessons/${selectedLesson._id}`,
        editedLesson
      );

      if (res.data.success) {
        // Update the lesson in the course
        const updatedLessons = editedCourse.lessons.map((lesson) =>
          lesson._id === selectedLesson._id
            ? { ...lesson, ...editedLesson }
            : lesson
        );
        setEditedCourse((prev) => ({
          ...prev,
          lessons: updatedLessons,
        }));

        toast.success("Lesson updated successfully");
        setIsLessonEditDialogOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lesson");
    } finally {
      setIsLessonSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    try {
      setIsLessonDeleting(true);
      await axios.delete(`courses/${courseId}/lessons/${selectedLesson._id}`);

      // Remove the lesson from the course
      const updatedLessons = editedCourse.lessons.filter(
        (lesson) => lesson._id !== selectedLesson._id
      );
      setEditedCourse((prev) => ({
        ...prev,
        lessons: updatedLessons,
      }));

      toast.success("Lesson deleted successfully");
      setIsLessonDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lesson");
    } finally {
      setIsLessonDeleting(false);
    }
  };

  const handleAddNewLesson = async () => {
    try {
      const res = await axios.post(
        `/courses/${courseId}/lessons`,
        newLessonData
      );

      if (res.data.success) {
        setEditedCourse((prev) => ({
          prev,
          lessons: [...prev.lessons, res.data.lesson],
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="aspect-video w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Course</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const displayCourse = mode === "edit" ? editedCourse : course;

  const handleThumbnailUploadSuccess = (result) => {
    setNewLessonData({ thumbnailImage: result.secure_url });
    toast.success("Thumbnail uploaded successfully!");
  };

  const handleVideoUploadSuccess = (result) => {
    setNewLessonData({ videoUrl: result.secure_url });
    toast.success("Video uploaded successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Course Management</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode Toggle Group */}
              <ToggleGroup
                value={mode}
                onValueChange={(value) => value && setMode(value)}
                type="single"
                variant="outline"
                className="border-2 bg-muted rounded-lg"
              >
                <ToggleGroupItem
                  value="preview"
                  className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                >
                  Preview
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="edit"
                  className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                >
                  Edit
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Action Buttons */}
              {mode === "edit" ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Course</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete the course and all associated lessons.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteCourse}
                      >
                        Delete Course
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video/Thumbnail Section */}
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {displayCourse.videoUrl ? (
                  <VideoPlayer
                    src={displayCourse.videoUrl}
                    poster={displayCourse}
                  /> // Here to fix
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <img
                      src={displayCourse?.thumbnailImage || "/placeholder.svg"}
                      alt={displayCourse.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Edit Mode Overlay */}
                {mode === "edit" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <CloudinaryUploadWidget></CloudinaryUploadWidget>
                  </div>
                )}
              </div>
            </div>

            {/* Course Title */}
            <div className="mt-6">
              {mode === "edit" ? (
                <Input
                  value={displayCourse.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="p-2 text-2xl font-semibold"
                  placeholder="Course title"
                />
              ) : (
                <h1 className="text-2xl font-bold">{displayCourse.title}</h1>
              )}
            </div>

            {/* Course Description */}
            <div className="mt-4">
              {mode === "edit" ? (
                <Textarea
                  value={displayCourse.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Course description"
                  className="min-h-[100px] p-2"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {displayCourse.description}
                </p>
              )}
            </div>

            {/* Categories */}
            <div className="mt-4">
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} categories selected`
                          : "Select categories..."}
                        {categoriesLoading ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {categories.map((category) => (
                              <CommandItem
                                key={category._id}
                                value={category._id}
                                onSelect={() =>
                                  handleCategorySelect(category._id)
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editedCourse.category.some(
                                      (cat) => cat._id === category._id
                                    )
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {/* Display selected categories */}
              <div className="flex flex-wrap gap-2 mt-3">
                {editedCourse.category.map((category) => (
                  <Badge
                    key={category._id}
                    variant="secondary"
                    className="px-3 py-1.5"
                  >
                    {category.name}
                    {mode === "edit" && (
                      <button
                        type="button"
                        onClick={() => removeCategory(category._id)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${category.name} category`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div>
              <h3 className="font-semibold mb-3">Instructor</h3>
              {displayCourse.instructor ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        displayCourse?.instructor?.profilePicture ||
                        "/placeholder.svg"
                      }
                    />
                    <AvatarFallback>
                      {displayCourse.instructor?.fullName
                        ?.charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {displayCourse.instructor.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Course Instructor
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">No instructor assigned</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Course Features */}
            <div>
              <h3 className="font-semibold mb-3">What you'll learn</h3>
              {mode === "edit" ? (
                <div className="space-y-3">
                  {editedCourse.features && editedCourse.features.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={editedCourse.features}
                      onReorder={updateFeatures}
                      className="space-y-2"
                    >
                      {editedCourse.features.map((feature, index) => (
                        <Reorder.Item
                          key={`${feature}-${index}`}
                          value={feature}
                          className="group"
                          whileDrag={{
                            scale: 1.02,
                            rotate: 1,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                            zIndex: 10,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          <motion.div
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-move group-hover:bg-muted/70 transition-colors"
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <Input
                              value={feature}
                              onChange={(e) =>
                                handleFeatureChange(index, e.target.value)
                              }
                              className="flex-1 border-none bg-transparent px-0 focus-visible:ring-0"
                              placeholder="Feature description"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={addFeature}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {displayCourse.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Course Stats */}
            <div>
              <h3 className="font-semibold mb-3">Course Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lessons:</span>
                  <span>{displayCourse.lessons?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students:</span>
                  <span>
                    {displayCourse.enrolledCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span>{displayCourse.rating?.averageRating || "0.0"} ⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Course Content ({displayCourse.lessons?.length || 0} lessons)
            </h2>
            {mode === "edit" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Lesson
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-center">
                      Add New Lesson
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {lessonFields.map(
                      ({ id, label, name, placeHolder, type }) => (
                        <CustomInput
                          key={id}
                          label={label}
                          name={name}
                          value={newLessonData[name] || ""}
                          onChange={handleChange}
                          placeHolder={placeHolder}
                          type={type}
                        />
                      )
                    )}
                  </div>
                  <div className="h-32 grid grid-cols-2 gap-x-4">
                    <CloudinaryUploadWidget
                      folder={`courses/${courseId}/lessons/thumbnails`}
                      resourceType="image"
                      maxFileSize={5000000} // 5MB
                      allowedFormats={["jpg", "jpeg", "png", "webp"]}
                      className="cursor-pointer flex items-center justify-center rounded-md border-2 border-dashed hover:border-primary transition-all"
                      onSuccess={handleThumbnailUploadSuccess}
                    >
                      <img
                        className="h-20  m-auto"
                        src={uploadImageSvg}
                        alt="Upload Thumbnail"
                      />
                    </CloudinaryUploadWidget>
                    <CloudinaryUploadWidget
                      onSuccess={handleVideoUploadSuccess}
                      folder={`courses/${courseId}/lessons/`}
                      resourceType="video"
                      maxFileSize={500000000}
                      allowedFormats={["mp4", "webm", "mov"]}
                      className="cursor-pointer flex items-center justify-center rounded-md border-2 border-dashed hover:border-primary transition-all"
                    >
                      <img
                        className="h-20  m-auto"
                        src={uploadVideoSvg}
                        alt="Upload Video"
                      />
                    </CloudinaryUploadWidget>
                  </div>
                  <CardFooter className="flex justify-around gap-4">
                    <DialogClose>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button onClick={() => handleAddNewLesson()}>Submit</Button>
                  </CardFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {displayCourse.lessons && displayCourse.lessons.length > 0 ? (
            mode === "edit" ? (
              // Draggable lessons in edit mode
              <Reorder.Group
                axis="y"
                values={displayCourse.lessons}
                onReorder={updateLessons}
                className="space-y-3"
              >
                {displayCourse.lessons.map((lesson, index) => (
                  <Reorder.Item
                    key={lesson._id}
                    value={lesson}
                    className="group"
                    whileDrag={{
                      scale: 1.02,
                      rotate: 0.5,
                      boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
                      zIndex: 10,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <motion.div
                      className="flex items-center gap-4 p-4 border rounded-lg bg-background cursor-move group-hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.005 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />

                      <div className="relative">
                        <img
                          className="w-24 h-16 rounded object-cover"
                          src={lesson.thumbnailImage || "/placeholder.svg"}
                          alt={lesson.title}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">
                          {index + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{lesson.duration || 0} minutes</span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleLessonEdit(lesson)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLessonDelete(lesson)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Lesson
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              // Regular accordion in preview mode
              <div className="space-y-3">
                {displayCourse.lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-background"
                  >
                    <div className="relative">
                      <img
                        className="w-24 h-16 rounded object-cover"
                        src={lesson.thumbnailImage || "/placeholder.svg"}
                        alt={lesson.title}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {lesson.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{lesson.duration || 0} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your course by adding lessons
              </p>
              {mode !== "edit" && (
                <Button
                  onClick={() =>
                    navigate(`/admin/courses/${courseId}/lessons/add`)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Lesson
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lesson Edit Dialog */}
      <Dialog
        open={isLessonEditDialogOpen}
        onOpenChange={setIsLessonEditDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Update the lesson details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Title</Label>
              <Input
                id="lesson-title"
                value={editedLesson.title || ""}
                onChange={(e) =>
                  handleLessonInputChange("title", e.target.value)
                }
                placeholder="Lesson title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                value={editedLesson.description || ""}
                onChange={(e) =>
                  handleLessonInputChange("description", e.target.value)
                }
                placeholder="Lesson description"
                rows={3}
              />
            </div>

            <div className="h-32 grid grid-cols-2 gap-x-4">
              <CloudinaryUploadWidget className="cursor-pointer flex items-center justify-center rounded-md border-2 border-dashed hover:border-primary transition-all">
                <img
                  className="h-20  m-auto"
                  src={uploadImageSvg}
                  alt="Upload Thumbnail"
                />
              </CloudinaryUploadWidget>
              <CloudinaryUploadWidget className="cursor-pointer flex items-center justify-center rounded-md border-2 border-dashed hover:border-primary transition-all">
                <img
                  className="h-20  m-auto"
                  src={uploadVideoSvg}
                  alt="Upload Video"
                />
              </CloudinaryUploadWidget>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLessonEditDialogOpen(false)}
              disabled={isLessonSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} disabled={isLessonSaving}>
              {isLessonSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Delete Dialog */}
      <Dialog
        open={isLessonDeleteDialogOpen}
        onOpenChange={setIsLessonDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {selectedLesson && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img
                  className="w-16 h-12 rounded object-cover"
                  src={selectedLesson.thumbnailImage || "/placeholder.svg"}
                  alt={selectedLesson.title}
                />
                <div>
                  <p className="font-medium">{selectedLesson.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLesson.duration || 0} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLessonDeleteDialogOpen(false)}
              disabled={isLessonDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLesson}
              disabled={isLessonDeleting}
            >
              {isLessonDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Lesson
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorSingleCoursePage;
