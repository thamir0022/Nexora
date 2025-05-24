"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Video, FileText, Clock, GripVertical } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import LessonForm from "@/components/course-creator/lesson-form"
import { AnimatePresence, Reorder } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"

const AddLessonsStep = ({ courseData, updateCourseData, courseSlug }) => {
  const [lessons, setLessons] = useState(courseData.lessons || [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)

  // Update parent component when lessons change
  const updateLessons = (newLessons) => {
    setLessons(newLessons)
    updateCourseData({ lessons: newLessons })
  }

  // Add or update a lesson
  const handleSaveLesson = (lesson) => {
    let updatedLessons

    if (editingIndex !== null) {
      // Update existing lesson
      updatedLessons = [...lessons]
      updatedLessons[editingIndex] = lesson
    } else {
      // Add new lesson
      updatedLessons = [...lessons, lesson]
    }

    updateLessons(updatedLessons)
    setIsDialogOpen(false)
    setEditingLesson(null)
    setEditingIndex(null)
  }

  // Edit a lesson
  const handleEditLesson = (lesson, index) => {
    setEditingLesson(lesson)
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  // Delete a lesson
  const handleDeleteLesson = (index) => {
    const updatedLessons = [...lessons]
    updatedLessons.splice(index, 1)
    updateLessons(updatedLessons)
  }

  // Open dialog to add a new lesson
  const handleAddLesson = () => {
    setEditingLesson(null)
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Add Lessons</h2>
        <p className="text-muted-foreground">Create and organize lessons for your course</p>
      </div>

      {/* Lesson list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Lessons ({lessons.length})</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddLesson} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
              </DialogHeader>
              <LessonForm lesson={editingLesson} onSave={handleSaveLesson} courseSlug={courseSlug} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-md">
          {lessons.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No lessons added yet. Click "Add Lesson" to create your first lesson.
              </p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={lessons} onReorder={updateLessons} className="divide-y">
              <AnimatePresence>
                {lessons.map((lesson, index) => (
                  <Reorder.Item
                    key={index}
                    value={lesson}
                    as="div"
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-move"
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-start gap-3">
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

                        <div className="flex-grow">
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {lesson.videoUrl ? "Video added" : "No video"}
                            </Badge>

                            <Badge variant="outline" className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {lesson.noteUrls?.length || 0} notes
                            </Badge>

                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(lesson.duration)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditLesson(lesson, index)}
                        aria-label={`Edit lesson: ${lesson.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLesson(index)}
                        aria-label={`Delete lesson: ${lesson.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>

        <p className="text-sm text-muted-foreground">Drag and drop to reorder lessons</p>
      </div>
    </div>
  )
}

export default AddLessonsStep
