import React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Reorder } from "framer-motion"
import {
  X,
  Video,
  ImageIcon,
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  Edit3,
  GripVertical,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"

/**
 * Modern Inline Lesson Creator - 4 steps with separate thumbnail and video steps
 */
const InlineLessonCreator = ({ courseId, onLessonCreated, isEditing = false, existingLesson = null }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lessonId, setLessonId] = useState(null)
  const [lessonCreated, setLessonCreated] = useState(false)
  const [isUploadingNote, setIsUploadingNote] = useState(false)

  const axios = useAxiosPrivate()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    thumbnailImage: "",
    videoUrl: "",
    noteUrls: [], // This will store note objects for UI
  })

  // Maximum notes allowed
  const MAX_NOTES = 5

  // Updated steps with separate thumbnail and video steps
  const steps = [
    { title: "Basic Info", icon: Edit3, description: "Add lesson title and description" },
    { title: "Thumbnail", icon: ImageIcon, description: "Upload lesson thumbnail image" },
    { title: "Video", icon: Video, description: "Upload lesson video content" },
    { title: "Notes", icon: FileText, description: "Add supplementary materials" },
  ]

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0 }),
  }

  const containerVariants = {
    hidden: { height: 0, opacity: 0, transition: { duration: 0.3 } },
    visible: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
  }

  // Helper function to convert note objects to URL array for server
  const convertNotesToUrls = (notes) => {
    return notes.map((note) => (typeof note === "string" ? note : note.url))
  }

  // Helper function to convert URL array to note objects for UI
  const convertUrlsToNotes = (urls) => {
    if (!Array.isArray(urls)) return []
    return urls.map((url, index) => {
      if (typeof url === "string") {
        // Extract filename from URL
        const urlParts = url.split("/")
        const filename = urlParts[urlParts.length - 1] || `Note ${index + 1}.pdf`
        return {
          id: Date.now() + Math.random() + index,
          url: url,
          filename: filename,
          size: null,
          uploadedAt: new Date().toISOString(),
        }
      }
      return url // Already an object
    })
  }

  // Initialize form for editing
  useEffect(() => {
    if (isEditing && existingLesson) {
      setFormData({
        title: existingLesson.title || "",
        description: existingLesson.description || "",
        duration: existingLesson.duration || "",
        thumbnailImage: existingLesson.thumbnailImage || "",
        videoUrl: existingLesson.videoUrl || "",
        noteUrls: convertUrlsToNotes(existingLesson.noteUrls || []),
      })
      setLessonId(existingLesson._id)
      setLessonCreated(true)
      setIsOpen(true)
    }
  }, [isEditing, existingLesson])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Create lesson
  const createLesson = async () => {
    try {
      setIsSubmitting(true)
      const response = await axios.post(`/courses/${courseId}/lessons`, {
        title: formData.title,
        description: formData.description,
      })

      if (!response.data.success) throw new Error(response.data.message)

      const newLessonId = response.data.lesson._id
      setLessonId(newLessonId)
      setLessonCreated(true)

      // Update course
      await updateCourseWithLesson(newLessonId)
      toast.success("Lesson created successfully!")
      return newLessonId
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast.error("Failed to create lesson")
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update course with lesson
  const updateCourseWithLesson = async (newLessonId) => {
    try {
      const courseResponse = await axios.get(`/courses/${courseId}`)
      const currentLessons = courseResponse.data.course.lessons || []
      const updatedLessons = currentLessons.includes(newLessonId) ? currentLessons : [...currentLessons, newLessonId]

      await axios.patch(`/courses/${courseId}`, { lessons: updatedLessons })
    } catch (error) {
      console.error("Error updating course:", error)
    }
  }

  // Update lesson
  const updateLesson = async (updateData) => {
    if (!lessonId) return

    try {
      // Convert note objects to URLs before sending to server
      const serverData = { ...updateData }
      if (serverData.noteUrls) {
        serverData.noteUrls = convertNotesToUrls(serverData.noteUrls)
      }

      const response = await axios.patch(`/courses/${courseId}/lessons/${lessonId}`, serverData)
      if (!response.data.success) throw new Error(response.data.message)
      toast.success("Lesson updated!")
      return response.data.lesson
    } catch (error) {
      console.error("Error updating lesson:", error)
      toast.error("Failed to update lesson")
      throw error
    }
  }

  // Upload handlers
  const handleThumbnailSuccess = async (result) => {
    const thumbnailUrl = result.secure_url
    setFormData((prev) => ({ ...prev, thumbnailImage: thumbnailUrl }))
    if (lessonId) await updateLesson({ thumbnailImage: thumbnailUrl })
    toast.success("Thumbnail uploaded!")
  }

  const handleVideoSuccess = async (result) => {
    const durationInMinutes = Math.ceil((result.duration || 0) / 60)
    const videoUrl = result.secure_url

    setFormData((prev) => ({ ...prev, videoUrl, duration: durationInMinutes.toString() }))
    if (lessonId) await updateLesson({ videoUrl, duration: durationInMinutes.toString() })
    toast.success(`Video uploaded! Duration: ${formatDuration(durationInMinutes)}`)
  }

  const handleNoteSuccess = async (result) => {
    try {
      setIsUploadingNote(false)

      // Check if we've reached the maximum notes limit
      if (formData.noteUrls.length >= MAX_NOTES) {
        toast.error(`Maximum ${MAX_NOTES} notes allowed per lesson`)
        return
      }

      // Extract filename from the URL or use the original filename
      const filename =
        result.original_filename || result.public_id?.split("/").pop() || `Note ${formData.noteUrls.length + 1}`
      const fileExtension = result.format || "pdf"

      const noteObject = {
        id: Date.now() + Math.random(), // Unique ID for reordering
        url: result.secure_url,
        filename: `${filename}.${fileExtension}`,
        size: result.bytes,
        uploadedAt: new Date().toISOString(),
      }

      // Add to existing notes array (stack them)
      const newNoteUrls = [...formData.noteUrls, noteObject]
      setFormData((prev) => ({ ...prev, noteUrls: newNoteUrls }))

      // Update lesson with the complete noteUrls array (converted to URLs)
      if (lessonId) {
        await updateLesson({ noteUrls: newNoteUrls })
      }

      toast.success(`Note ${newNoteUrls.length} uploaded successfully!`)
    } catch (error) {
      console.error("Error handling note upload:", error)
      setIsUploadingNote(false)
      toast.error("Failed to process uploaded note")
    }
  }

  const handleUploadError = (error) => {
    console.error("Upload error:", error)
    setIsUploadingNote(false)
    toast.error("Upload failed. Please try again.")
  }

  const handleNoteUploadStart = () => {
    setIsUploadingNote(true)
  }

  const removeNote = async (noteId) => {
    const newNoteUrls = formData.noteUrls.filter((note) => note.id !== noteId)
    setFormData((prev) => ({ ...prev, noteUrls: newNoteUrls }))

    // Update lesson with the updated noteUrls array (converted to URLs)
    if (lessonId) {
      await updateLesson({ noteUrls: newNoteUrls })
    }

    toast.success("Note removed successfully!")
  }

  const handleNotesReorder = async (newOrder) => {
    setFormData((prev) => ({ ...prev, noteUrls: newOrder }))

    // Update lesson with reordered notes (converted to URLs)
    if (lessonId) {
      await updateLesson({ noteUrls: newOrder })
    }
  }

  // Navigation
  const handleNext = async () => {
    try {
      if (currentStep === 0 && !lessonCreated) await createLesson()

      if (currentStep < steps.length - 1) {
        setDirection(1)
        setCurrentStep((prev) => prev + 1)
      } else {
        // Complete lesson - ensure noteUrls is sent as array of URLs
        try {
          const finalUpdateData = {
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            thumbnailImage: formData.thumbnailImage,
            videoUrl: formData.videoUrl,
            noteUrls: formData.noteUrls, // This will be converted to URLs in updateLesson
          }

          // Final update to ensure all data is saved
          const updatedLesson = await updateLesson(finalUpdateData)

          // Create complete lesson object with proper structure for UI
          const completedLesson = {
            _id: lessonId,
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            thumbnailImage: formData.thumbnailImage,
            videoUrl: formData.videoUrl,
            noteUrls: convertNotesToUrls(formData.noteUrls), // Convert to URLs for consistency
            ...updatedLesson,
          }

          onLessonCreated(completedLesson, isEditing)
        } catch (error) {
          // Fallback with proper lesson structure
          const fallbackLesson = {
            _id: lessonId,
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            thumbnailImage: formData.thumbnailImage,
            videoUrl: formData.videoUrl,
            noteUrls: convertNotesToUrls(formData.noteUrls), // Convert to URLs for consistency
          }
          onLessonCreated(fallbackLesson, isEditing)
        }
        resetCreator()
        toast.success("Lesson completed!")
      }
    } catch (error) {
      console.error("Error in handleNext:", error)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  const resetCreator = () => {
    setIsOpen(false)
    setCurrentStep(0)
    setDirection(0)
    setLessonId(null)
    setLessonCreated(false)
    setIsUploadingNote(false)
    setFormData({ title: "", description: "", duration: "", thumbnailImage: "", videoUrl: "", noteUrls: [] })
  }

  const handleCancel = () => {
    if (lessonCreated && !isEditing) {
      const lessonData = {
        _id: lessonId,
        ...formData,
        noteUrls: convertNotesToUrls(formData.noteUrls), // Convert to URLs for consistency
      }
      onLessonCreated(lessonData, false)
    }
    resetCreator()
  }

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  const isNextDisabled = () => isSubmitting || (currentStep === 0 && !formData.title.trim())

  const getButtonText = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {currentStep === 0 && !lessonCreated ? "Creating..." : "Saving..."}
        </>
      )
    }
    return currentStep === steps.length - 1 ? (
      <>
        <Save className="w-4 h-4 mr-2" />
        Complete
      </>
    ) : (
      "Next"
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Lesson Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Introduction to React Hooks"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what students will learn..."
                rows={4}
                className="resize-none"
              />
            </div>

            {formData.duration && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Duration Auto-Detected</p>
                  <p className="text-sm text-green-700">{formatDuration(Number.parseInt(formData.duration))}</p>
                </div>
              </div>
            )}
          </div>
        )

      case 1: // Thumbnail Upload
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Upload Lesson Thumbnail</h3>
              <p className="text-gray-600">Add an engaging thumbnail image for your lesson</p>
            </div>

            {formData.thumbnailImage ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-gray-100">
                  <img
                    src={formData.thumbnailImage || "/placeholder.svg"}
                    alt="Lesson Thumbnail"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, thumbnailImage: "" }))}
                    className="absolute top-2 right-2 shadow-lg z-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Thumbnail uploaded successfully
                  </Badge>
                </div>
              </div>
            ) : (
              <CloudinaryUploadWidget
                onSuccess={handleThumbnailSuccess}
                onError={handleUploadError}
                folder={`courses/${courseId}/lessons/${lessonId}`}
                resourceType="image"
                maxFileSize={5000000}
                allowedFormats={["jpg", "jpeg", "png", "webp"]}
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer aspect-video flex flex-col items-center justify-center">
                  <ImageIcon className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="font-medium text-gray-900 text-lg mb-2">Upload Thumbnail</p>
                  <p className="text-gray-500 mb-4">Recommended: 1280x720 pixels (16:9 ratio)</p>
                  <Badge variant="outline">JPG, PNG, WebP up to 5MB</Badge>
                </div>
              </CloudinaryUploadWidget>
            )}
          </div>
        )

      case 2: // Video Upload
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Video className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Upload Lesson Video</h3>
              <p className="text-gray-600">Upload the main video content for your lesson</p>
            </div>

            {formData.videoUrl ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-black">
                  <video src={formData.videoUrl} controls className="w-full h-full object-contain" preload="metadata">
                    Your browser does not support the video tag.
                  </video>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, videoUrl: "", duration: "" }))}
                    className="absolute top-2 right-2 shadow-lg z-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-center space-y-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Video uploaded successfully
                  </Badge>
                  {formData.duration && (
                    <div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Duration: {formatDuration(Number.parseInt(formData.duration))}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <CloudinaryUploadWidget
                onSuccess={handleVideoSuccess}
                onError={handleUploadError}
                folder={`courses/${courseId}/lessons/${lessonId}`}
                resourceType="video"
                maxFileSize={500000000}
                allowedFormats={["mp4", "webm", "mov"]}
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer aspect-video flex flex-col items-center justify-center">
                  <Video className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="font-medium text-gray-900 text-lg mb-2">Upload Video</p>
                  <p className="text-gray-500 mb-4">Main lesson content for students</p>
                  <div className="flex gap-2 justify-center mb-4">
                    <Badge variant="outline">MP4, WebM, MOV</Badge>
                    <Badge variant="outline">Up to 500MB</Badge>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">✨ Duration will be automatically detected</p>
                </div>
              </CloudinaryUploadWidget>
            )}
          </div>
        )

      case 3: // Notes Upload
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Add Lesson Notes</h3>
              <p className="text-gray-600">Upload supplementary materials and documents (max {MAX_NOTES})</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Lesson Notes & Materials</Label>
                <Badge variant="outline" className="text-xs">
                  {formData.noteUrls.length}/{MAX_NOTES}
                </Badge>
              </div>
              <CloudinaryUploadWidget
                onSuccess={handleNoteSuccess}
                onError={handleUploadError}
                onOpen={handleNoteUploadStart}
                folder={`courses/${courseId}/lessons/${lessonId}/notes`}
                resourceType="raw"
                maxFileSize={50000000}
                allowedFormats={["pdf", "doc", "docx", "ppt", "pptx"]}
              >
                <Button variant="outline" size="sm" disabled={formData.noteUrls.length >= MAX_NOTES || isUploadingNote}>
                  {isUploadingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </>
                  )}
                </Button>
              </CloudinaryUploadWidget>
            </div>

            {/* Notes limit warning */}
            {formData.noteUrls.length >= MAX_NOTES && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-800">Maximum {MAX_NOTES} notes reached. Remove a note to add more.</p>
              </div>
            )}

            {formData.noteUrls.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  {formData.noteUrls.length} note{formData.noteUrls.length !== 1 ? "s" : ""} uploaded
                </p>

                <Reorder.Group axis="y" values={formData.noteUrls} onReorder={handleNotesReorder} className="space-y-3">
                  {formData.noteUrls.map((note, index) => (
                    <Reorder.Item
                      key={note.id}
                      value={note}
                      className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 cursor-move hover:bg-gray-100 transition-colors group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{note.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>Note {index + 1}</span>
                          {note.size && (
                            <>
                              <span>•</span>
                              <span>{(note.size / 1024 / 1024).toFixed(1)} MB</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(note.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="font-medium text-gray-900 text-lg mb-2">No notes added yet</p>
                <p className="text-gray-500 mb-4">Add PDFs, documents, or presentations to supplement your lesson</p>
                <Badge variant="outline">PDF, DOC, DOCX, PPT, PPTX up to 50MB</Badge>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full">
      {/* Add Lesson Button */}
      {!isOpen && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <div className="p-8 text-center">
            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Add New Lesson</h3>
            <p className="text-gray-600 mb-4">Create engaging content for your students</p>
            <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Lesson
            </Button>
          </div>
        </Card>
      )}

      {/* Lesson Creator */}
      <AnimatePresence>
        {isOpen && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
            <Card className="border shadow-sm">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 text-blue-600" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{isEditing ? "Edit Lesson" : "Create Lesson"}</h3>
                      <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentStep + 1} of {steps.length}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-center mb-8">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-2 ${index < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Success Indicator */}
                {lessonCreated && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Lesson Created!</p>
                      <p className="text-sm text-green-700">ID: {lessonId}</p>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                <div className="relative min-h-[400px] mb-6">
                  <AnimatePresence mode="wait" custom={direction}>
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
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isSubmitting}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                  <Button onClick={handleNext} disabled={isNextDisabled()} className="bg-blue-600 hover:bg-blue-700">
                    {getButtonText()}
                    {currentStep < steps.length - 1 && !isSubmitting && <ChevronRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InlineLessonCreator
