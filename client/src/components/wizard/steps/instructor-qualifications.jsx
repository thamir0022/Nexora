import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader, PlusCircle, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget"
import { CertificatePreview } from "../components/certificate-preview"

const qualificationSchema = z.object({
  experienceSummary: z
    .string()
    .min(50, "Experience summary must be at least 50 characters")
    .max(1000, "Experience summary must be less than 1000 characters"),
  qualifications: z
    .array(
      z.object({
        degree: z.string().min(2, "Degree is required"),
        certificateURL: z.string().optional(),
      }),
    )
    .min(1, "At least one qualification is required")
    .max(5, "Maximum 5 qualifications allowed"),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(2, "Platform is required"),
        profileUrl: z.string().url("Please enter a valid URL"),
      }),
    )
    .max(5, "Maximum 5 social links allowed"),
  portfolioLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

const socialPlatforms = [
  "LinkedIn",
  "Twitter",
  "GitHub",
  "YouTube",
  "Instagram",
  "Facebook",
  "Medium",
  "TikTok",
  "Other",
]

export const InstructorQualifications = ({ formData, nextStep, previousStep }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingStates, setUploadingStates] = useState({})
  const axios = useAxiosPrivate()

  const form = useForm({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      experienceSummary: "",
      qualifications: [{ degree: "", certificateURL: "" }],
      socialLinks: [{ platform: "", profileUrl: "" }],
      portfolioLink: "",
    },
  })

  const qualificationsArray = useFieldArray({
    control: form.control,
    name: "qualifications",
  })

  const socialLinksArray = useFieldArray({
    control: form.control,
    name: "socialLinks",
  })

  const watchedQualifications = form.watch("qualifications")

  const handleUploadStart = (index) => {
    setUploadingStates((prev) => ({ ...prev, [index]: true }))
  }

  const handleUploadSuccess = (result, index) => {
    const {secure_url} = result;
    if (!secure_url) {
      toast.error("Upload failed!")
      setUploadingStates((prev) => ({ ...prev, [index]: false }))
      return
    }

    form.setValue(`qualifications.${index}.certificateURL`, secure_url, {
      shouldValidate: true,
      shouldDirty: true,
    })

    setUploadingStates((prev) => ({ ...prev, [index]: false }))
    toast.success("Certificate uploaded successfully!")
  }

  const handleUploadError = (index) => {
    setUploadingStates((prev) => ({ ...prev, [index]: false }))
    toast.error("Upload failed!")
  }

  const canAddNewQualification = () => {
    if (qualificationsArray.fields.length >= 5) return false

    // Check if the last qualification is complete
    const lastIndex = qualificationsArray.fields.length - 1
    const lastQualification = watchedQualifications[lastIndex]

    return lastQualification?.degree && lastQualification?.certificateURL
  }

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      const payload = { ...data, userId: formData.userId }

      console.log(payload)
      const response = await axios.post("/instructors/qualifications", payload)

      if (response.data.success) {
        toast.success("Qualifications submitted successfully!")
        nextStep()
      } else {
        toast.error(response.data.message || "Submission failed")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">
          Hey {formData.fullName} 👋, Let's Talk About Your Journey!
        </DialogTitle>
        <DialogDescription className="text-center">
          Share your experience and qualifications so we can get you verified and ready to inspire learners.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="h-[60vh] px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Experience Summary */}
            <FormField
              control={form.control}
              name="experienceSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Experience Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your teaching experience, industry background, and what makes you passionate about education..."
                      className="min-h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/1000 characters (minimum 50)
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Qualifications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-medium">Qualifications & Certificates</FormLabel>
                {canAddNewQualification() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => qualificationsArray.append({ degree: "", certificateURL: "" })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Qualification
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {qualificationsArray.fields.map((field, index) => {
                  const qualification = watchedQualifications[index]
                  const isUploading = uploadingStates[index]
                  const hasImage = qualification?.certificateURL
                  const isComplete = qualification?.degree && qualification?.certificateURL

                  return (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name={`qualifications.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., M.Sc. in Computer Science, B.Ed. in Mathematics"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {qualificationsArray.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => qualificationsArray.remove(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Certificate Upload */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <CloudinaryUploadWidget
                              variant="button"
                              onUploadStart={() => handleUploadStart(index)}
                              onSuccess={(url) => handleUploadSuccess(url, index)}
                              onError={() => handleUploadError(index)}
                              folder={`instructors/${formData.userId}/qualifications`}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isUploading}
                                className="flex items-center gap-2"
                              >
                                {isUploading ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {isUploading ? "Uploading..." : "Upload Certificate"}
                              </Button>
                            </CloudinaryUploadWidget>

                            {isComplete && (
                              <Badge variant="secondary" className="text-xs">
                                ✓ Complete
                              </Badge>
                            )}
                          </div>

                          {/* Certificate Preview */}
                          {hasImage && (
                            <CertificatePreview
                              imageUrl={qualification.certificateURL}
                              alt={`Certificate for ${qualification.degree}`}
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {!canAddNewQualification() && qualificationsArray.fields.length < 5 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Complete the current qualification to add another one
                </p>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-medium">Social Links (Optional)</FormLabel>
                {socialLinksArray.fields.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => socialLinksArray.append({ platform: "", profileUrl: "" })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {socialLinksArray.fields.map((field, index) => (
                  <Card key={field.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-40">
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.platform`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {socialPlatforms.map((platform) => (
                                    <SelectItem key={platform} value={platform}>
                                      {platform}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.profileUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="url" placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {socialLinksArray.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => socialLinksArray.remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Portfolio Link */}
            <FormField
              control={form.control}
              name="portfolioLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Portfolio Website (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="e.g., https://yourportfolio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ScrollArea>

      <DialogFooter className="flex justify-between pt-4 border-t px-6">
        <Button variant="outline" type="button" onClick={previousStep}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="min-w-24">
            {isLoading ? <Loader className="animate-spin h-4 w-4" /> : "Submit"}
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}
