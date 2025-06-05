import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CourseBasicInfo from "../courses/instructor/course-creator/add-basic-info"
import CourseFeaturesStep from "../courses/instructor/course-creator/course-features-step"
import CourseThumbnailStep from "../courses/instructor/course-creator/course-thumbnail-step"
import AddLessonsStep from "../courses/instructor/course-creator/add-lessons-step"
import ReviewStep from "../courses/instructor/course-creator/review-step"
import SuccessStep from "../courses/instructor/course-creator/success-step"
import StepIndicator from "../courses/instructor/course-creator/step-indicator"
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"

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
}

const CreateCoursePage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseId, setCourseId] = useState(null)
  const [courseCreated, setCourseCreated] = useState(false)
  const axios = useAxiosPrivate()

  // Form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    category: [],
    hashtags: [],
    features: [],
    thumbnailImage: "",
    lessons: [],
  })

  // Steps configuration
  const steps = [
    { title: "Basic Info", component: CourseBasicInfo },
    { title: "Features", component: CourseFeaturesStep },
    { title: "Thumbnail", component: CourseThumbnailStep },
    { title: "Add Lessons", component: AddLessonsStep },
    { title: "Review", component: ReviewStep },
    { title: "Success", component: SuccessStep },
  ]

  // Create initial course after basic info step
  const createInitialCourse = async () => {
    try {
      setIsSubmitting(true)

      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        price: Number.parseFloat(courseData.price),
        category: courseData.category,
        hashtags: courseData.hashtags,
      }

      const courseResponse = await axios.post("/courses", coursePayload)

      if (!courseResponse.data.success) {
        throw new Error(courseResponse.data.message || "Failed to create course")
      }

      const newCourseId = courseResponse.data.course._id
      setCourseId(newCourseId)
      setCourseCreated(true)

      toast.success("Course created successfully!", {
        description: "You can now add features and content to your course.",
      })

      return newCourseId
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Error creating course", {
        description: error.message || "Something went wrong. Please try again.",
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update course with new data
  const updateCourse = async (updateData) => {
    if (!courseId) return

    try {
      setIsSubmitting(true)

      const response = await axios.patch(`/courses/${courseId}`, updateData)

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update course")
      }

      toast.success("Course updated successfully!")
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("Error updating course", {
        description: error.message || "Something went wrong. Please try again.",
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step navigation
  const handleNext = async () => {
    try {
      // Create course after basic info step (step 0)
      if (currentStep === 0 && !courseCreated) {
        await createInitialCourse()
      }
      // Update course with features after features step (step 1)
      else if (currentStep === 1 && courseCreated) {
        await updateCourse({ features: courseData.features })
      }
      // Update course with thumbnail after thumbnail step (step 2)
      else if (currentStep === 2 && courseCreated && courseData.thumbnailImage) {
        await updateCourse({ thumbnailImage: courseData.thumbnailImage })
      }

      // Move to next step
      if (currentStep === steps.length - 2) {
        // Move to success step
        setDirection(1)
        setCurrentStep(steps.length - 1)
      } else {
        setDirection(1)
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      }
    } catch (error) {
      // Don't proceed to next step if there was an error
      console.error("Error in handleNext:", error)
    }
  }

  // Handle previous step navigation
  const handlePrevious = () => {
    if (currentStep === 0) return

    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Update course data from child components
  const updateCourseData = (data) => {
    setCourseData((prev) => ({ ...prev, ...data }))
  }

  // Render the current step component
  const CurrentStepComponent = steps[currentStep].component

  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    if (isSubmitting) return true

    // Basic validation for each step
    switch (currentStep) {
      case 0: // Basic Info
        return !courseData.title || !courseData.description || !courseData.price || !courseData.category.length
      case 1: // Features
        return !courseData.features.length
      case 2: // Thumbnail
        return !courseData.thumbnailImage
      case 3: // Lessons - Allow proceeding even without lessons
        return false
      default:
        return false
    }
  }

  // Get button text based on current step
  const getButtonText = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {currentStep === 0 && !courseCreated ? "Creating Course..." : "Saving..."}
        </>
      )
    }

    if (currentStep === 0 && !courseCreated) {
      return "Create Course"
    }

    if (currentStep === steps.length - 2) {
      return (
        <>
          <Check className="h-4 w-4" />
          Complete Course
        </>
      )
    }

    return (
      <>
        Next
        <ChevronRight className="h-4 w-4" />
      </>
    )
  }

  return (
    <section className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
      <p className="text-muted-foreground mb-8">Create your course and add lessons in a few simple steps</p>

      {/* Step indicators */}
      <div className="mb-8">
        <StepIndicator
          steps={steps.slice(0, steps.length - 1)}
          currentStep={currentStep}
          onStepClick={(index) => {
            // Only allow clicking on completed steps and only if course is created
            if (index < currentStep && (courseCreated || index === 0)) {
              setDirection(index > currentStep ? 1 : -1)
              setCurrentStep(index)
            }
          }}
        />
      </div>

      {/* Course ID indicator */}
      {courseId && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Course Created!</strong> ID: {courseId}
          </p>
        </div>
      )}

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
              courseCreated={courseCreated}
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

            <Button onClick={handleNext} disabled={isNextDisabled()} className="flex items-center gap-2">
              {getButtonText()}
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
    </section>
  )
}

export default CreateCoursePage
