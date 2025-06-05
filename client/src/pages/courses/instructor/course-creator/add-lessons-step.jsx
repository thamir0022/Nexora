import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Clock, Video, FileText, Edit, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Reorder } from "framer-motion"
import InlineLessonCreator from "./lesson-dialog"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"

const AddLessonsStep = ({ courseData, updateCourseData, courseId }) => {
  const [lessons, setLessons] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const axios = useAxiosPrivate()

  useEffect(() => {
    if (courseId) loadLessons()
  }, [courseId])

  /**
   * Load lessons from API
   */
  const loadLessons = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/courses/${courseId}/lessons`)

      if (response.data.success) {
        setLessons(response.data.lessons || [])
        updateCourseData({ lessons: response.data.lessons || [] })
      }
    } catch (error) {
      console.error("Error loading lessons:", error)
      setLessons([])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle lesson creation/update
   */
  const handleLessonCreated = async (savedLesson, isEditing) => {
    // Ensure savedLesson has proper structure
    if (!savedLesson || !savedLesson._id) {
      console.error("Invalid lesson data received:", savedLesson)
      toast.error("Error: Invalid lesson data")
      return
    }

    if (isEditing) {
      const updatedLessons = lessons.map((lesson) => (lesson._id === savedLesson._id ? savedLesson : lesson))
      setLessons(updatedLessons)
      updateCourseData({ lessons: updatedLessons })
    } else {
      const updatedLessons = [...lessons, savedLesson]
      setLessons(updatedLessons)
      updateCourseData({ lessons: updatedLessons })
    }

    // Update course with lesson IDs in the correct order
    try {
      const lessonIds = isEditing
        ? lessons.map((l) => (l._id === savedLesson._id ? savedLesson._id : l._id))
        : [...lessons.map((l) => l._id), savedLesson._id]

      await axios.patch(`/courses/${courseId}`, { lessons: lessonIds })
    } catch (error) {
      console.error("Error updating course with lesson IDs:", error)
    }
  }

  /**
   * Handle lesson reordering
   */
  const handleLessonsReorder = async (newOrder) => {
    setLessons(newOrder)
    updateCourseData({ lessons: newOrder })

    // Update course with new lesson order
    try {
      const lessonIds = newOrder.map((lesson) => lesson._id)
      await axios.patch(`/courses/${courseId}`, { lessons: lessonIds })
      toast.success("Lesson order updated!")
    } catch (error) {
      console.error("Error updating lesson order:", error)
      toast.error("Failed to update lesson order")
    }
  }

  /**
   * Delete lesson
   */
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const response = await axios.delete(`/courses/${courseId}/lessons/${lessonId}`)

      if (response.data.success) {
        const updatedLessons = lessons.filter((lesson) => lesson._id !== lessonId)
        setLessons(updatedLessons)
        updateCourseData({ lessons: updatedLessons })

        await axios.patch(`/courses/${courseId}`, { lessons: updatedLessons.map((l) => l._id) })
        toast.success("Lesson deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting lesson:", error)
      toast.error("Failed to delete lesson")
    }
  }

  /**
   * Format duration safely
   */
  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return "No duration"
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  // Calculate total duration safely
  const totalDuration = lessons.reduce((total, lesson) => {
    const duration = lesson?.duration ? Number.parseInt(lesson.duration) : 0
    return total + (isNaN(duration) ? 0 : duration)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Course Lessons</h2>
        <p className="text-gray-600 mt-1">Create and manage lessons for your course</p>

        {/* Duration Summary */}
        {lessons.length > 0 && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Total Course Duration</p>
              <p className="text-sm text-blue-700">
                {formatDuration(totalDuration)} across {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Creator */}
      <InlineLessonCreator courseId={courseId} onLessonCreated={handleLessonCreated} />

      {/* Lessons List */}
      {isLoading ? (
        <Card className="p-6">
          <p className="text-center text-gray-500">Loading lessons...</p>
        </Card>
      ) : lessons.length > 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              Created Lessons ({lessons.length})
            </h3>
            <p className="text-sm text-gray-500">Drag to reorder lessons</p>
          </div>

          <Reorder.Group axis="y" values={lessons} onReorder={handleLessonsReorder} className="space-y-4">
            {lessons.map((lesson, index) => (
              <Reorder.Item
                key={lesson._id}
                value={lesson}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-move group transition-colors"
              >
                {/* Drag Handle */}
                <div className="flex items-center gap-2 pt-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500 min-w-[2rem]">{index + 1}.</span>
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {lesson?.thumbnailImage ? (
                    <img
                      src={lesson.thumbnailImage || "/placeholder.svg"}
                      alt={lesson?.title || "Lesson thumbnail"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{lesson?.title || "Untitled Lesson"}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lesson?.description || "No description"}</p>

                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(lesson?.duration)}
                    </Badge>
                    {lesson?.videoUrl && (
                      <Badge variant="secondary">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                    {lesson?.noteUrls?.length > 0 && (
                      <Badge variant="secondary">
                        <FileText className="w-3 h-3 mr-1" />
                        {lesson.noteUrls.length} Notes
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteLesson(lesson._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </Card>
      ) : null}
    </div>
  )
}

export default AddLessonsStep
