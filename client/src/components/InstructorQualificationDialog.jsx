"use client"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Simplified Zod validation schema
const formSchema = z.object({
  experienceSummary: z
    .string()
    .min(50, "Experience summary must be at least 50 characters")
    .max(1000, "Experience summary must be less than 1000 characters"),
  qualifications: z
    .array(z.object({ degree: z.string().min(2, "Degree is required") }))
    .min(1, "At least one qualification is required")
    .max(5, "Maximum 5 qualifications allowed"),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(2, "Platform is required"),
        profileUrl: z.string().url("Please enter a valid URL"),
      }),
    )
    .min(1, "At least one social link is required")
    .max(5, "Maximum 5 social links allowed"),
  portfolioLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

// Social platform options
const socialPlatforms = [
  "LinkedIn",
  "Twitter",
  "GitHub",
  "YouTube",
  "Instagram",
  "Facebook",
  "Medium",
  "TikTok",
  "Personal Website",
  "Other",
]

const InstructorQualificationDialog = ({ name, open, setOpen, onSubmit }) => {
  // Store certificates separately for Cloudinary upload
  const [certificates, setCertificates] = useState({})

  // Initialize form with React Hook Form and Zod validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      experienceSummary: "",
      qualifications: [{ degree: "" }],
      socialLinks: [{ platform: "", profileUrl: "" }],
      portfolioLink: "",
    },
  })

  // Setup field arrays for dynamic fields
  const qualificationsArray = useFieldArray({
    control: form.control,
    name: "qualifications",
  })

  const socialLinksArray = useFieldArray({
    control: form.control,
    name: "socialLinks",
  })

  // Handle file upload
  const handleFileChange = (event, index) => {
    const file = event.target.files[0]
    if (file) {
      // Store the file for Cloudinary upload
      setCertificates((prev) => ({
        ...prev,
        [index]: {
          file,
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
        },
      }))
    }
  }

  // Remove uploaded file
  const removeFile = (index) => {
    setCertificates((prev) => {
      const newCertificates = { ...prev }
      delete newCertificates[index]
      return newCertificates
    })
  }

  // Handle form submission
  const handleSubmit = (data) => {
    // Combine form data with certificates
    const completeData = {
      ...data,
      certificates,
    }

    console.log("Complete form data:", completeData)
    onSubmit?.(completeData)
    setOpen(false)
  }

  // Handle dialog close
  const handleClose = () => {
    form.reset()
    setCertificates({})
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Hello, <span className="font-semibold">{name || "Instructor"}</span>! Great instructors start with great
            stories.
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center mt-1 text-sm">
            Share your professional journey to help us verify your expertise and connect you with learners.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 px-2">
              {/* Experience Summary */}
              <FormField
                control={form.control}
                name="experienceSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Summarize your teaching or industry experience"
                        className="min-h-20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Qualifications - Simplified */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Qualifications</FormLabel>
                  {qualificationsArray.fields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => qualificationsArray.append({ degree: "" })}
                      className="h-8"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Degree
                    </Button>
                  )}
                </div>

                {qualificationsArray.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`qualifications.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g., M.Sc. in Physics" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id={`certificate-file-${index}`}
                          onChange={(e) => handleFileChange(e, index)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`certificate-file-${index}`).click()}
                        >
                          {certificates[index] ? "Change" : "Upload"}
                        </Button>
                      </div>

                      {certificates[index] && (
                        <div className="text-xs text-muted-foreground">
                          {certificates[index].name.length > 15
                            ? certificates[index].name.substring(0, 15) + "..."
                            : certificates[index].name}
                        </div>
                      )}

                      {qualificationsArray.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            qualificationsArray.remove(index)
                            removeFile(index)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links - With Dropdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Social Links</FormLabel>
                  {socialLinksArray.fields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => socialLinksArray.append({ platform: "", profileUrl: "" })}
                      className="h-8"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Link
                    </Button>
                  )}
                </div>

                {socialLinksArray.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="w-1/3">
                      <FormField
                        control={form.control}
                        name={`socialLinks.${index}.platform`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
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
                        className="h-8 w-8"
                        onClick={() => socialLinksArray.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Portfolio Link */}
              <FormField
                control={form.control}
                name="portfolioLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="e.g., https://yourportfolio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit">Submit for Review</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default InstructorQualificationDialog
