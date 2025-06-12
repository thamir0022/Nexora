import { useMemo, useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import VideoPlayer from "@/components/video-player"
import { Link, useNavigate, useParams } from "react-router-dom"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const FullCoursePage = ({ course }) => {
  const params = useParams()
  const { courseId, lessonId } = params || {}
  const [currentLesson, setCurrentLesson] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(true)
  const axios = useAxiosPrivate()
  const navigate = useNavigate()

  // Fetch course progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!courseId) return

      try {
        setProgressLoading(true)
        const response = await axios.get(`/courses/${courseId}/progress`)
        setProgress(response.data.progress)

        // Set completed lessons from progress data
        if (response.data.progress.completedLessons) {
          const completedIndices = new Set()
          response.data.progress.completedLessons.forEach((lessonId) => {
            const index = course.lessons.findIndex((l) => l._id === lessonId)
            if (index !== -1) completedIndices.add(index)
          })
          setCompletedLessons(completedIndices)
        }

        setProgressLoading(false)
      } catch (err) {
        console.error("Failed to fetch progress:", err)
        setProgressLoading(false)
      }
    }

    if (courseId && course?.lessons) {
      fetchProgress()
    }
  }, [courseId, course?.lessons, axios])

  // Find current lesson index based on the lessonId in the route
  const currentLessonIndex = useMemo(() => {
    if (!lessonId || !course?.lessons) return 0
    return course.lessons.findIndex((l) => l._id === lessonId)
  }, [lessonId, course?.lessons])

  // If no lessonId in URL, redirect to the first lesson
  useEffect(() => {
    if (!lessonId && course?.lessons?.length > 0) {
      const firstLessonId = course.lessons[0]._id
      navigate(`/courses/${courseId}/${firstLessonId}`, { replace: true })
    }
  }, [course, lessonId, courseId, navigate])

  // Fetch specific lesson data when lessonId changes
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId || !courseId) return

      try {
        setLessonLoading(true)
        const response = await axios.get(`/courses/${courseId}/lessons/${lessonId}`)
        setCurrentLesson(response.data.lesson)
        setLessonLoading(false)
      } catch (err) {
        console.error("Failed to fetch lesson data:", err)
        setLessonLoading(false)
      }
    }

    fetchLessonData()
  }, [lessonId, courseId, axios])

  // Navigate to next lesson
  const handleNext = () => {
    if (!course || currentLessonIndex < 0 || currentLessonIndex >= course.lessons.length - 1) return

    const nextLessonId = course.lessons[currentLessonIndex + 1]._id
    navigate(`/courses/${courseId}/${nextLessonId}`)
  }

  // Navigate to previous lesson
  const handlePrevious = () => {
    if (!course || currentLessonIndex <= 0) return

    const prevLessonId = course.lessons[currentLessonIndex - 1]._id
    navigate(`/courses/${courseId}/${prevLessonId}`)
  }

  // Handle lesson completion - placeholder for now
  const handleLessonComplete = async (lessonIndex, checked) => {
    const lessonId = course.lessons[lessonIndex]._id

    try {
      // Make API call to update lesson completion status
      const response = await axios.put(`/courses/${courseId}/lessons/${lessonId}`, {
        status: checked ? "completed" : "uncompleted",
      })

      if (response.data.success) {
        // Update local state with new progress data
        const newProgress = response.data.progress
        setProgress(newProgress)

        // Update completed lessons set
        const completedIndices = new Set()
        if (newProgress.completedLessons) {
          newProgress.completedLessons.forEach((lessonId) => {
            const index = course.lessons.findIndex((l) => l._id === lessonId)
            if (index !== -1) completedIndices.add(index)
          })
        }
        setCompletedLessons(completedIndices)
      }
    } catch (err) {
      console.error("Failed to update lesson completion:", err)
      // Optionally show error message to user
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price / 100)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Handle lesson click - navigate to the lesson
  const handleLessonClick = (lessonId) => {
    navigate(`/courses/${courseId}/${lessonId}`)
  }

  // Lesson skeleton component
  const LessonSkeleton = () => (
    <div className="animate-pulse flex items-start gap-3 p-3">
      <div className="flex flex-col items-center gap-2 mt-1 flex-shrink-0">
        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-24 sm:w-28 aspect-video bg-gray-200 rounded-md flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )

  const LessonsContent = () => {
    return (
      <div className="space-y-2">
        {course?.lessons?.length > 0 ? (
          <Accordion type="single" collapsible>
            {course.lessons.map((lesson, i) => {
              const isCurrentOrPrevious = i <= currentLessonIndex
              const isCompleted = completedLessons.has(i)

              return (
                <AccordionItem key={lesson._id} value={`lesson-${i}`} className="border! rounded-lg mb-2 last:mb-0">
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600 min-w-[20px]">{i + 1}</span>
                        <Checkbox
                          className="size-5"
                          checked={isCompleted}
                          disabled={!isCurrentOrPrevious}
                          onCheckedChange={(checked) => handleLessonComplete(i, checked)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <AccordionTrigger className="flex items-center gap-3 hover:no-underline p-0 text-left">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                              src={lesson.thumbnailImage || "/placeholder.svg"}
                              alt={lesson.title}
                              className="w-24 sm:w-28 aspect-video rounded-md object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base leading-tight">{lesson.title}</p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500 mt-1">Duration: {lesson.duration} min</p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-3 pb-0">
                          <p className="text-sm text-gray-600 leading-relaxed">{lesson.description}</p>
                        </AccordionContent>
                      </div>
                    </div>
                  </div>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <p className="text-center text-gray-500">No lessons available</p>
        )}
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
        {/* Video and Tabs Section */}
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer
            src={course.lessons[currentLessonIndex]?.videoUrl}
            poster={course.lessons[currentLessonIndex]?.thumbnailImage}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />

					<h2 className="text-xl font-semibold">{currentLesson?.title}</h2>
					<Link to={"#"} className="flex items-center gap-2 size-fit">
						<Avatar>
							<AvatarImage src={course.instructor.profilePicture}/>
							<AvatarFallback>{course.instructor.fullName.charAt(0)}</AvatarFallback>
						</Avatar>
						<p className="font-medium">{course.instructor.fullName}</p>
					</Link>

          {/* Tabs below the video */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex-1 lg:hidden">
                Lessons
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">
                Resources
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex-1">
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{course.description}</p>
                  </div>

                  {/* <div>
                    <h3 className="font-semibold mb-2">Course Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium text-lg text-green-600">{formatPrice(course.price)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Enrolled Students</p>
                        <p className="font-medium">{course.enrolledCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rating</p>
                        <p className="font-medium">
                          {course.rating.averageRating > 0
                            ? `${course.rating.averageRating}/5 (${course.rating.ratingCount} reviews)`
                            : "No ratings yet"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
                      </div>
                    </div>
                  </div> */}


                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {course.features.map((feature, index) => (
                        <li key={index} className="text-gray-600">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.category.map((cat) => (
                        <Badge key={cat._id} variant="outline">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
									
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Course Information</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Created: {formatDate(course.createdAt)}</p>
                      <p>Last Updated: {formatDate(course.updatedAt)}</p>
                      <p>Total Lessons: {course.lessons.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lessons" className="mt-4 lg:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Course Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <LessonsContent />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  {lessonLoading ? (
                    <LessonSkeleton />
                  ) : currentLesson ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Current Lesson: {currentLesson.title}</h4>
                        {currentLesson.noteUrls && currentLesson.noteUrls.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            {currentLesson.noteUrls.map((url, urlIndex) => (
                              <li key={urlIndex}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Resource {urlIndex + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 ml-4">No resources available for this lesson</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">Select a lesson to view resources</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">What You'll Learn</h3>
                      <p className="text-gray-600 mb-4">{course.description}</p>

                      <h4 className="font-medium mb-2">Course Highlights:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {course.features.map((feature, index) => (
                          <li key={index} className="text-gray-600">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Course Structure</h3>
                      <div className="space-y-2">
                        {course.lessons.map((lesson, index) => (
                          <div
                            key={lesson._id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                              lesson._id === lessonId ? "bg-primary/10 border border-primary/30" : "bg-gray-50"
                            }`}
                            onClick={() => handleLessonClick(lesson._id)}
                          >
                            <span className="font-medium text-sm">{index + 1}.</span>
                            <span className="text-sm">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-gray-500 ml-auto">{lesson.duration} min</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Prerequisites</h3>
                      <p className="text-gray-600">
                        This course is designed for beginners. No prior knowledge of calculus is required. Basic
                        understanding of algebra and functions would be helpful.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Lessons Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Card className="sticky top-4 h-[calc(100vh-2rem)] overflow-auto">
            <CardHeader>
              <CardTitle>Course Lessons</CardTitle>
              {/* <p className="text-sm text-gray-500">
                {progressLoading
                  ? "Loading progress..."
                  : `${completedLessons.size} of ${course.lessons.length} completed (${progress?.progressPercentage || 0}%)`}
              </p> */}
            </CardHeader>
            <CardContent>
              <LessonsContent />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FullCoursePage
