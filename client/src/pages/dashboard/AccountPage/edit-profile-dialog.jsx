import { useState } from "react"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CiSaveUp2 } from "react-icons/ci"
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget"

export function EditProfileDialog({ isOpen, onClose, userData, setUserData }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: userData.fullName || "",
    mobile: userData.mobile || "",
    bio: userData.bio || "",
    profilePicture: userData.profilePicture || "",
  })

  const axios = useAxiosPrivate()

  const handleUploadSuccess = (result) => {
    const { secure_url } = result;
    setFormData((prev) => ({ ...prev, profilePicture: secure_url }));
    toast.success("Profile Picture uploaded successfully!")
  }

  const handleUploadError = (error) => {
    console.error("Upload error:", error)
    toast.error("Failed to upload thumbnail")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.patch(`/users/${userData._id}`, formData)

      if (response.data.success) {
        setUserData({ ...userData, ...formData })
        toast.success("Profile updated successfully")
        onClose()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative group">
              <Avatar className="size-32 mx-auto cursor-pointer transition-all duration-200 group-hover:brightness-50">
                <AvatarImage src={formData.profilePicture} alt={formData.fullName} />
                <AvatarFallback>{formData.fullName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <CloudinaryUploadWidget
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
                folder={`users/${userData._id}/profilepicture`}
                resourceType="image"
                maxFileSize={5000000} // 5MB
                allowedFormats={["jpg", "jpeg", "png", "webp"]} variant="button" className="cursor-pointer absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CiSaveUp2 className="size-10 text-white" />
              </CloudinaryUploadWidget>
            </div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="Enter your mobile number"
            />
          </div>

          {userData.role === "instructor" && (
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
