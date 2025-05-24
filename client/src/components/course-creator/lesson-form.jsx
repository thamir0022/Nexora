import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Video, ImageIcon, FileText, Loader2, Plus } from "lucide-react"
import { uploadToCloudinary } from "@/utils/cloudinaryUploader"
import { toast } from "sonner"
import { generateSlug } from "@/lib/utils"

const LessonForm = ({ lesson = {}, onSave, courseSlug }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    description: lesson?.description || "",
    duration: lesson?.duration || "",
    thumbnailImage: lesson?.thumbnailImage || "",
    videoUrl: lesson?.videoUrl || "",
    noteUrls: lesson?.noteUrls || [],
  })

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Refs for file inputs
  const thumbnailInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const noteInputRef = useRef(null)

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file upload
  const handleFileUpload = async (file, type, noteIndex = null) => {
    if (!file) return

    try {
      setIsUploading(true)
      setUploadType(type)

      // Generate lesson slug
      const lessonSlug = generateSlug(formData.title || "lesson")

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Prepare identifiers based on upload type
      const identifiers = { courseSlug, lessonSlug }
      if (type === "lessonNote") {
        identifiers.noteId = noteIndex !== null ? noteIndex + 1 : formData.noteUrls.length + 1
      }

      // Upload to Cloudinary
      const fileUrl = await uploadToCloudinary(file, type, identifiers)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Update form data based on upload type
      if (type === "lessonThumbnail") {
        setFormData((prev) => ({ ...prev, thumbnailImage: fileUrl }))
      } else if (type === "lessonVideo") {
        setFormData((prev) => ({ ...prev, videoUrl: fileUrl }))
      } else if (type === "lessonNote") {
        if (noteIndex !== null) {
          // Replace existing note
          const newNotes = [...formData.noteUrls]
          newNotes[noteIndex] = fileUrl
          setFormData((prev) => ({ ...prev, noteUrls: newNotes }))
        } else {
          // Add new note
          setFormData((prev) => ({
            ...prev,
            noteUrls: [...prev.noteUrls, fileUrl],
          }))
        }
      }

      toast("File uploaded", {
        description: "Your file has been uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast("Upload failed", {
        description: error.message || "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
      setUploadType(null)
      setUploadProgress(0)
    }
  }

  // Handle file input change
  const handleFileChange = (e, type, noteIndex = null) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file, type, noteIndex)
    }
  }

  // Remove note
  const handleRemoveNote = (index) => {
    const newNotes = [...formData.noteUrls]
    newNotes.splice(index, 1)
    setFormData((prev) => ({ ...prev, noteUrls: newNotes }))
  }

  // Save lesson
  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.title) {
      toast("Missing information", {
        description: "Please provide a title for the lesson",
      })
      return
    }

    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          {/* Lesson Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to React Hooks"
              required
            />
          </div>

          {/* Lesson Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Lesson Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this lesson..."
              rows={4}
            />
          </div>

          {/* Lesson Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 45"
            />
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6 pt-4">
          {/* Lesson Thumbnail */}
          <div className="space-y-2">
            <Label>Lesson Thumbnail</Label>

            {formData.thumbnailImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <img
                  src={formData.thumbnailImage || "/placeholder.svg"}
                  alt="Lesson thumbnail"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, thumbnailImage: "" }))}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Remove thumbnail"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "lessonThumbnail")}
                  className="sr-only"
                />

                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {isUploading && uploadType === "lessonThumbnail" ? (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Thumbnail
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Video */}
          <div className="space-y-2">
            <Label>Lesson Video</Label>

            {formData.videoUrl ? (
              <div className="relative rounded-lg overflow-hidden border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">Video uploaded successfully</p>
                    <p className="text-sm text-muted-foreground truncate">{formData.videoUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, videoUrl: "" }))}
                    className="p-1.5 rounded-full hover:bg-muted"
                    aria-label="Remove video"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, "lessonVideo")}
                  className="sr-only"
                />

                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {isUploading && uploadType === "lessonVideo" ? (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">Supported formats: MP4, WebM. Max size: 500MB</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Lesson Notes</Label>
              <input
                ref={noteInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => handleFileChange(e, "lessonNote")}
                className="sr-only"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => noteInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {isUploading && uploadType === "lessonNote" && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">Uploading note...</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.noteUrls.length > 0 ? (
              <div className="space-y-2">
                {formData.noteUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 border rounded-lg p-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">Note {index + 1}</p>
                      <p className="text-xs text-muted-foreground truncate">{url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNote(index)}
                      className="p-1.5 rounded-full hover:bg-muted"
                      aria-label={`Remove note ${index + 1}`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No notes added yet. Click "Add Note" to upload lesson materials.
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, PPT, PPTX. Max size: 50MB
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" className="flex items-center gap-2">
          Save Lesson
        </Button>
      </div>
    </form>
  )
}

export default LessonForm
