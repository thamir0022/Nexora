import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget"

const CourseThumbnailStep = ({ courseData, updateCourseData, courseId }) => {
  const handleUploadSuccess = (result) => {
    const { secure_url } = result;
    updateCourseData({ thumbnailImage: secure_url })
    toast.success("Thumbnail uploaded successfully!")
  }

  const handleUploadError = (error) => {
    console.error("Upload error:", error)
    toast.error("Failed to upload thumbnail")
  }

  const removeImage = () => {
    updateCourseData({ thumbnailImage: "" })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Thumbnail</h2>
        <p className="text-muted-foreground">Upload an eye-catching thumbnail for your course</p>
      </div>

      <Card className="p-6">
        <Label className="text-base font-medium">Course Thumbnail</Label>

        {courseData.thumbnailImage ? (
          <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
            <img
              src={courseData.thumbnailImage || "/placeholder.svg"}
              alt="Course thumbnail"
              className="w-full h-full object-cover"
            />
            <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <CloudinaryUploadWidget
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
              folder={`courses/${courseId}/thumbnails`}
              resourceType="image"
              maxFileSize={5000000} // 5MB
              allowedFormats={["jpg", "jpeg", "png", "webp"]}
            >
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Upload Course Thumbnail</h3>
                    <p className="text-sm text-muted-foreground">Recommended: 1280x720 pixels (16:9 ratio)</p>
                  </div>

                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            </CloudinaryUploadWidget>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CourseThumbnailStep
