import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CourseBasicInfo from "@/components/course-creator/add-basic-info";
import CourseFeaturesStep from "@/components/course-creator/course-features-step";
import CourseThumbnailStep from "@/components/course-creator/course-thumbnail-step";
import AddLessonsStep from "@/components/course-creator/add-lessons-step";
import ReviewStep from "@/components/course-creator/review-step";
import SuccessStep from "@/components/course-creator/success-step";
import StepIndicator from "@/components/course-creator/step-indicator";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

// Animation variants for step transitions
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseId, setCourseId] = useState(null);
  const [courseSlug, setCourseSlug] = useState("");
  const axios = useAxiosPrivate();

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    category: [],
    features: [],
    thumbnailImage: "",
    lessons: [],
  });

  // Steps configuration
  const steps = [
    { title: "Basic Info", component: CourseBasicInfo },
    { title: "Features", component: CourseFeaturesStep },
    { title: "Thumbnail", component: CourseThumbnailStep },
    { title: "Add Lessons", component: AddLessonsStep },
    { title: "Review", component: ReviewStep },
    { title: "Success", component: SuccessStep },
  ];

  // Handle next step navigation
  const handleNext = async () => {
    // If we're on the last step before success, submit the course
    if (currentStep === steps.length - 2) {
      await handleSubmitCourse();
      return;
    }

    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // Handle previous step navigation
  const handlePrevious = () => {
    if (currentStep === 0) return;

    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Update course data from child components
  const updateCourseData = (data) => {
    setCourseData((prev) => ({ ...prev, ...data }));
  };

  // Generate a slug from the title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  // Submit the course to the API
  const handleSubmitCourse = async () => {
    try {
      setIsSubmitting(true);

      // Create the course first
      const slug = generateSlug(courseData.title);
      setCourseSlug(slug);

      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        price: Number.parseFloat(courseData.price),
        category: courseData.category,
        features: courseData.features,
        thumbnailImage: courseData.thumbnailImage,
      };

      // Create the course
      const courseResponse = await axios.post("/courses", coursePayload);

      if (!courseResponse.data.success) {
        throw new Error(
          courseResponse.data.message || "Failed to create course"
        );
      }

      const newCourseId = courseResponse.data.course._id;
      setCourseId(newCourseId);

      // Add lessons one by one
      const lessonIds = [];

      for (const lesson of courseData.lessons) {
        const lessonPayload = {
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          thumbnailImage: lesson.thumbnailImage,
          videoUrl: lesson.videoUrl,
          noteUrls: lesson.noteUrls || [],
        };

        const lessonResponse = await axios.post(
          `/courses/${newCourseId}/lessons`,
          lessonPayload
        );

        if (!lessonResponse.data.success) {
          throw new Error(
            lessonResponse.data.message || "Failed to add lesson"
          );
        }

        lessonIds.push(lessonResponse.data.lesson._id);
      }

      // Update the course with lesson IDs
      await axios.patch(`/courses/${newCourseId}`, {
        lessons: lessonIds,
      });

      // Move to success step
      setDirection(1);
      setCurrentStep(steps.length - 1);

      toast("Course created successfully!", {
        description: "Your course has been created with all lessons.",
      });
    } catch (error) {
      console.error("Error creating course:", error);
      toast("Error creating course", {
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the current step component
  const CurrentStepComponent = steps[currentStep].component;

  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    if (isSubmitting) return true;

    // Basic validation for each step
    switch (currentStep) {
      case 0: // Basic Info
        return (
          !courseData.title ||
          !courseData.description ||
          !courseData.price ||
          !courseData.category.length
        );
      case 1: // Features
        return !courseData.features.length;
      case 2: // Thumbnail
        return !courseData.thumbnailImage;
      case 3: // Lessons
        return !courseData.lessons.length;
      default:
        return false;
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
      <p className="text-muted-foreground mb-8">
        Create your course and add lessons in a few simple steps
      </p>

      {/* Step indicators */}
      <div className="mb-8">
        <StepIndicator
          steps={steps.slice(0, steps.length - 1)}
          currentStep={currentStep}
          onStepClick={(index) => {
            // Only allow clicking on completed steps
            if (index < currentStep) {
              setDirection(index > currentStep ? 1 : -1);
              setCurrentStep(index);
            }
          }}
        />
      </div>

      {/* Main content area */}
      <Card className="p-6 relative overflow-hidden min-h-[500px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            <CurrentStepComponent
              courseData={courseData}
              updateCourseData={updateCourseData}
              courseId={courseId}
              courseSlug={courseSlug || generateSlug(courseData.title)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === steps.length - 2 ? (
                <>
                  <Check className="h-4 w-4" />
                  Create Course
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {currentStep === steps.length - 1 && (
          <div className="flex justify-center mt-8">
            <Button onClick={() => navigate("/courses")} className="px-8">
              View All Courses
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreateCoursePage;
