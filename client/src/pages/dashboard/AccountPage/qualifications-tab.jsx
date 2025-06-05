import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget";

import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from "@/components/ui/morphing-dialog"

import { GraduationCap, Briefcase, Globe, LinkIcon, ExternalLink, Edit, Plus, X, FileText } from "lucide-react"

export function QualificationsTab({ qualifications, setQualifications, userId }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    experienceSummary: qualifications?.experienceSummary || "",
    portfolioLink: qualifications?.portfolioLink || "",
    qualifications: qualifications?.qualifications || [],
    socialLinks: qualifications?.socialLinks || [],
  })

  const axios = useAxiosPrivate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.patch(`instructors/qualifications/${userId}`, {
        userId,
        ...formData,
      })

      if (response.data.success) {
        setQualifications(response.data.qualifications)
        toast.success("Qualifications updated successfully")
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update qualifications")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCertificateUpload = (url, qualIndex) => {
    const updatedQuals = [...formData.qualifications]
    updatedQuals[qualIndex] = { ...updatedQuals[qualIndex], certificateURL: url }
    setFormData({ ...formData, qualifications: updatedQuals })
    toast.success("Certificate uploaded successfully!")
  }

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, { degree: "", certificateURL: "" }],
    })
  }

  const removeQualification = (index) => {
    const updatedQuals = formData.qualifications.filter((_, i) => i !== index)
    setFormData({ ...formData, qualifications: updatedQuals })
  }

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: "", profileUrl: "" }],
    })
  }

  const removeSocialLink = (index) => {
    const updatedLinks = formData.socialLinks.filter((_, i) => i !== index)
    setFormData({ ...formData, socialLinks: updatedLinks })
  }

  if (!qualifications) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instructor Qualifications</CardTitle>
          <CardDescription>Add your professional qualifications and experience</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Qualifications
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instructor Qualifications</CardTitle>
              <CardDescription>Your professional qualifications and experience</CardDescription>
            </div>
            <Button onClick={() => setIsEditDialogOpen(true)} size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Experience Summary */}
          {qualifications.experienceSummary && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <h3 className="text-sm font-medium">Experience Summary</h3>
              </div>
              <p className="text-sm leading-relaxed">{qualifications.experienceSummary}</p>
            </div>
          )}

          {/* Qualifications */}
          {qualifications.qualifications?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <h3 className="text-sm font-medium">Qualifications</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {qualifications.qualifications.map((qual, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <MorphingDialog
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut",
                        }}
                      >
                        <MorphingDialogTrigger className="block w-full">
                          <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
                            {qual.certificateURL ? (
                              <MorphingDialogImage
                                src={qual.certificateURL}
                                alt={`${qual.degree} certificate`}
                                className="w-full h-full object-contain bg-white cursor-zoom-in"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </MorphingDialogTrigger>
                        <MorphingDialogContainer>
                          <MorphingDialogContent className="relative bg-transparent">
                            <MorphingDialogImage
                              src={qual.certificateURL}
                              alt={`${qual.degree} certificate`}
                              className="h-auto w-auto max-w-[90vw] max-h-[90vh] object-contain rounded-sm"
                            />
                            <MorphingDialogClose className="fixed right-6 top-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors">
                              <X className="h-4 w-4 text-foreground" />
                            </MorphingDialogClose>
                          </MorphingDialogContent>
                        </MorphingDialogContainer>
                      </MorphingDialog>
                      <div className="p-4">
                        <h4 className="font-medium">{qual.degree}</h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {qualifications.socialLinks?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <h3 className="text-sm font-medium">Social Profiles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualifications.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Link */}
          {qualifications.portfolioLink && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LinkIcon className="h-4 w-4" />
                <h3 className="text-sm font-medium">Portfolio</h3>
              </div>
              <a
                href={qualifications.portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {qualifications.portfolioLink.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant={qualifications.status === "approved" ? "default" : "secondary"} className="capitalize">
              {qualifications.status}
            </Badge>
            <span>•</span>
            <span>Last updated: {format(new Date(qualifications.updatedAt), "MMM d, yyyy")}</span>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Qualifications</DialogTitle>
            <DialogDescription>Update your professional qualifications and experience</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Experience Summary */}
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Summary</Label>
              <Textarea
                id="experience"
                value={formData.experienceSummary}
                onChange={(e) => setFormData({ ...formData, experienceSummary: e.target.value })}
                placeholder="Describe your professional experience..."
                rows={4}
              />
            </div>

            {/* Portfolio Link */}
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio Link</Label>
              <Input
                id="portfolio"
                type="url"
                value={formData.portfolioLink}
                onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                placeholder="https://your-portfolio.com"
              />
            </div>

            {/* Qualifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Qualifications</Label>
                <Button type="button" onClick={addQualification} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Qualification
                </Button>
              </div>
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Qualification {index + 1}</Label>
                    <Button
                      type="button"
                      onClick={() => removeQualification(index)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={qual.degree}
                    onChange={(e) => {
                      const updatedQuals = [...formData.qualifications]
                      updatedQuals[index] = { ...updatedQuals[index], degree: e.target.value }
                      setFormData({ ...formData, qualifications: updatedQuals })
                    }}
                    placeholder="Degree/Certification name"
                  />
                  <div className="space-y-2">
                    <Label>Certificate Upload</Label>
                    <CloudinaryUploadWidget
                      onSuccess={(url) => handleCertificateUpload(url, index)}
                      onError={(error) => toast.error("Upload failed: " + error)}
                      folder={`qualifications/${userId}/certificates`}
                      resourceType="image"
                      maxFileSize={5000000}
                      allowedFormats={["jpg", "jpeg", "png", "webp", "pdf"]}
                    >
                      <Button type="button" variant="outline" className="w-full">
                        {qual.certificateURL ? "Change Certificate" : "Upload Certificate"}
                      </Button>
                    </CloudinaryUploadWidget>
                    {qual.certificateURL && (
                      <p className="text-xs text-muted-foreground">Certificate uploaded successfully</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Social Links</Label>
                <Button type="button" onClick={addSocialLink} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>
              {formData.socialLinks.map((link, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Social Link {index + 1}</Label>
                    <Button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      value={link.platform}
                      onChange={(e) => {
                        const updatedLinks = [...formData.socialLinks]
                        updatedLinks[index] = { ...updatedLinks[index], platform: e.target.value }
                        setFormData({ ...formData, socialLinks: updatedLinks })
                      }}
                      placeholder="Platform (e.g., LinkedIn)"
                    />
                    <Input
                      value={link.profileUrl}
                      onChange={(e) => {
                        const updatedLinks = [...formData.socialLinks]
                        updatedLinks[index] = { ...updatedLinks[index], profileUrl: e.target.value }
                        setFormData({ ...formData, socialLinks: updatedLinks })
                      }}
                      placeholder="Profile URL"
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
