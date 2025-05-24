import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinaryUploader";
import { toast } from "sonner";

const CourseThumbnailStep = ({ courseData, updateCourseData, courseSlug }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast("Invalid image file type", {
        description: "Please select an image file (JPEG, PNG, etc.)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast("File too large", {
        description: "Please select an image smaller than 5MB",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file, "courseThumbnail", {
        courseSlug,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update course data with the image URL
      updateCourseData({ thumbnailImage: imageUrl });

      toast("Thumbnail uploaded", {
        description: "Your course thumbnail has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast("Upload failed", {
        description:
          error.message || "Failed to upload thumbnail. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    updateCourseData({ thumbnailImage: "" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Course Thumbnail</h2>
        <p className="text-muted-foreground">
          Upload an eye-catching thumbnail for your course
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="thumbnail">Course Thumbnail</Label>

        {courseData.thumbnailImage ? (
          // Display uploaded image
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            <img
              src={courseData.thumbnailImage || "/placeholder.svg"}
              alt="Course thumbnail"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Remove thumbnail"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          // Upload area
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              id="thumbnail"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Upload your course thumbnail
                </p>
                <p className="text-sm text-muted-foreground">
                  Recommended size: 1280x720 pixels (16:9 ratio)
                </p>
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, WebP. Max size: 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseThumbnailStep;
