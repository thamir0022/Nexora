import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Video, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react"
import LessonForm from "./lesson-form"

const AddLessonsStep = ({ courseData, updateCourseData, courseId, lessonsCreated, createdLessonIds = [] }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const lessons = courseData?.lessons || []

  const handleSaveLesson = (lessonData) => {
    let updatedLessons

    if (editingIndex !== null) {
      // Edit existing lesson
      updatedLessons = [...lessons]
      updatedLessons[editingIndex] = lessonData
    } else {
      // Add new lesson
      updatedLessons = [...lessons, lessonData]
    }

    updateCourseData({ lessons: updatedLessons })
    setShowForm(false)
    setEditingIndex(null)
  }

  const handleEditLesson = (index) => {
    if (lessonsCreated) {
      // Don't allow editing if lessons are already created
      return
    }
    setEditingIndex(index)
    setShowForm(true)
  }

  const handleDeleteLesson = (index) => {
    if (lessonsCreated) {
      // Don't allow deleting if lessons are already created
      return
    }
    const updatedLessons = lessons.filter((_, i) => i !== index)
    updateCourseData({ lessons: updatedLessons })
  }

  const formatDuration = (minutes) => {
    if (!minutes) return "No duration"
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  // Calculate total course duration
  const totalDuration = lessons.reduce((total, lesson) => {
    return total + (Number.parseInt(lesson.duration) || 0)
  }, 0)

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{editingIndex !== null ? "Edit Lesson" : "Add New Lesson"}</h2>
            <p className="text-muted-foreground">
              {editingIndex !== null ? "Update lesson details" : "Create a new lesson for your course"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setEditingIndex(null)
            }}
          >
            Cancel
          </Button>
        </div>

        <LessonForm
          lesson={editingIndex !== null ? lessons[editingIndex] : null}
          onSave={handleSaveLesson}
          courseId={courseId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Lessons</h2>
        <p className="text-muted-foreground">Add lessons to your course</p>

        {/* Course Duration Summary */}
        {lessons.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Total Course Duration: {formatDuration(totalDuration)} ({lessons.length} lesson
                {lessons.length !== 1 ? "s" : ""})
              </span>
            </div>
          </div>
        )}

        {/* Lessons Creation Status */}
        {lessonsCreated && createdLessonIds.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {createdLessonIds.length} lesson{createdLessonIds.length !== 1 ? "s" : ""} successfully created and
                added to your course!
              </span>
            </div>
          </div>
        )}

        {/* Warning if lessons exist but not created */}
        {!lessonsCreated && lessons.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""} ready to be created. Click "Next" to create
                them.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Lesson Button */}
      {!lessonsCreated && (
        <Card className="p-6">
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Lesson
          </Button>
        </Card>
      )}

      {/* Lessons List */}
      {lessons.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">
            Lessons ({lessons.length}){lessonsCreated && <span className="text-green-600 ml-2">✓ Created</span>}
          </h3>
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                  {lesson.thumbnailImage ? (
                    <img
                      src={lesson.thumbnailImage || "/placeholder.svg"}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium">
                    {index + 1}. {lesson.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>

                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.duration ? (
                        <span className="text-green-600 font-medium">
                          {formatDuration(Number.parseInt(lesson.duration))} {lesson.videoUrl && "(auto-detected)"}
                        </span>
                      ) : (
                        <span>No duration</span>
                      )}
                    </div>
                    {lesson.videoUrl && (
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Video
                      </div>
                    )}
                    {lesson.noteUrls?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {lesson.noteUrls.length} notes
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!lessonsCreated && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditLesson(index)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLesson(index)}>
                        Delete
                      </Button>
                    </div>
                  )}

                  {lessonsCreated && createdLessonIds[index] && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs ml-1">Created</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default AddLessonsStep
