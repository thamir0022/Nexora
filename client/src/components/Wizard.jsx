import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { z } from "zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { ScrollArea } from "./ui/scroll-area";
import { Eye, Loader, PlusCircle, Trash2, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import axios from "@/config/axios";
import { toast } from "sonner";
import { SlidingNumber } from "./ui/sliding-number";
import { useAuth } from "@/hooks/useAuth";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Link, useNavigate } from "react-router-dom";
import CloudinaryUploadWidget from "./CloudinaryUploadWidget";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    role: z.enum(["student", "instructor"], {
      required_error: "You need to select a role type.",
    }),
    mobile: z
      .string()
      .min(10, { message: "Please enter a valid mobile number" })
      .regex(/^\d+$/, { message: "Mobile number should contain only digits" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const qualificationSchema = z.object({
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
      })
    )
    .min(1, "At least one social link is required")
    .max(5, "Maximum 5 social links allowed"),
  portfolioLink: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

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
  "Other",
];

const WizardContext = createContext(null);

const useWizard = () => useContext(WizardContext);

const Wizard = ({ open, onOpenChange, email }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    userId: "",
    fullName: "",
    email: email,
    mobile: "",
    role: "",
    password: "",
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, email }));
  }, [email]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <WizardContext.Provider
      value={{
        formData,
        handleChange,
        wizardStep,
        onOpenChange,
        open,
        setWizardStep,
        setFormData,
      }}
    >
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>{renderStep(wizardStep)}</DialogContent>
      </Dialog>
    </WizardContext.Provider>
  );
};

function renderStep(step) {
  switch (step) {
    case 1:
      return <Step1 />;
    case 2:
      return <Step2 />;
    case 3:
      return <Step3 />;
    case 4:
      return <Step4 />;
    case 5:
      return <StudentWelcomeDialog />;
    case 6:
      return <InstructorWelcomeDialog />;
    default:
      return null;
  }
}

function Step1() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  const { formData, setWizardStep, handleChange } = useWizard();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    if (!otp) return toast.error("Please enter the OTP");

    if (otp.length !== 6) toast.error("Please enter full OTP");

    const data = {
      email: formData.email,
      otp,
    };

    try {
      const res = await axios.post("/auth/verify-otp", data);

      if (!res.data.success) {
        return toast.error(
          res.data.message || "Something went wrong, Try Again!"
        );
      }

      setSeconds(0);
      const { _id } = res.data.user;
      handleChange("userId", _id);
      toast.success(res.data.message || "OTP Verified successfully");

      setWizardStep((prev) => prev + 1);
    } catch (error) {
      console.log(error);
      const message = error.response.data.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    try {
      const res = await axios.post("/auth/send-otp", { email: formData.email });

      if (!res.data.success) {
        return toast.error(res.data.message || "Something went wrong");
      }

      toast.success(res.data.message);
      setSeconds(60);
      const interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <div className="animate-in space-y-2">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Check your inbox 📬
        </DialogTitle>
        <DialogDescription className="text-center">
          We've sent you an OTP to{" "}
          <span className="font-semibold">{formData.email}</span>. Please enter
          it to proceed.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center">
        <SlidingNumber value={seconds} padStart={true} />
      </div>
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          onComplete={() => handleSubmit()}
          value={otp}
          onChange={(value) => setOtp(value)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="flex justify-between items-center">
        <Button
          variant="link"
          disabled={seconds > 0}
          onClick={() => handleOtpResend()}
        >
          Resend OTP
        </Button>
        <Button
          // onClick={() => handleSubmit()}
          onClick={() => setWizardStep((p) => p + 1)}
          disabled={loading || otp.length !== 6}
        >
          {loading ? <Loader className="size-7 animate-spin" /> : "Next"}
        </Button>
      </div>
    </div>
  );
}

function Step2() {
  const [role, setRole] = useState("");

  const { setWizardStep, handleChange } = useWizard();

  const handleSubmit = () => {
    try {
      if (!role) {
        toast.error("Please select any role");
      }

      handleChange("role", role);

      setWizardStep((prev) => prev + 1);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Choose Your Path 🎓
        </DialogTitle>
        <DialogDescription className="text-center">
          Let's get you set up! Tell us what you're here for.
        </DialogDescription>
      </DialogHeader>
      <div className="my-2 flex items-center justify-center">
        <ToggleGroup
          onValueChange={(value) => setRole(value)}
          type="single"
          variant="outline"
          size="lg"
        >
          <ToggleGroupItem value="student" aria-label="Toggle student">
            Student 👨‍🎓
          </ToggleGroupItem>
          <ToggleGroupItem value="instructor" aria-label="Toggle instructor ">
            Instructor 👩‍🏫
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <DialogFooter className="flex justify-end">
        <Button disabled={!role} onClick={() => handleSubmit()}>
          Next
        </Button>
      </DialogFooter>
    </div>
  );
}

function Step3() {
  const { handleChange, formData, setWizardStep } = useWizard();
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { setToken } = useAccessToken();

  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: formData.email,
      role: "student",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formValues) => {
    // Validate required fields first
    const { confirmPassword, ...rest } = formValues;
    const { fullName, email, mobile, password, role } = rest;
    
    if (!fullName || !email || !mobile || !password) {
      return toast.error("Please fill in all required fields");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    
    try {
      // Create the submission data with the latest form values
      const submissionData = {
        ...formData,
        fullName,
        email,
        mobile,
        password,
        role: role || 'student'
      };

      // Submit the registration
      const res = await axios.post("/auth/register", submissionData);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Registration failed');
      }

      // Handle student flow
      if (res.data.user.role === "student") {
        form.reset();
        setUser(res.data.user);
        setToken(res.data.accessToken);
        setWizardStep(5);
        return;
      }

      // Handle instructor flow
      await handleChange("userId", res.data.user._id);
      toast.success(res.data.message || "Registration successful!");
      setWizardStep(4);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set default role if not set
  useEffect(() => {
    if (formData.role && !form.getValues('role')) {
      form.setValue('role', formData.role);
    }
  }, [formData.role, form]);

  return (
    <div className="animate-in space-y-2">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Let&apos;s Get Started ✨
        </DialogTitle>
        <DialogDescription className="text-center">
          One step closer to mastering something new, let's begin!
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter Your full name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter Your email</FormLabel>
                <FormControl>
                  <Input placeholder="yourname@mail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter Your mobile number</FormLabel>
                <FormControl>
                  <Input placeholder="+91 " {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter Your Password</FormLabel>
                <FormControl>
                  <Input placeholder="******" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input placeholder="******" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              onClick={() => setWizardStep((prev) => prev - 1)}
            >
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader size={20} className="animate-spin" /> : "Next"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function Step4() {
  const [loading, setLoading] = useState(false)
  const [uploadingStates, setUploadingStates] = useState({})
  const [previewDialog, setPreviewDialog] = useState({ open: false, url: "" })

  const {
    setWizardStep,
    formData: { fullName, userId },
  } = useWizard()

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

  const { control, setValue, watch, handleSubmit, reset, getValues } = form

  const qualificationsArray = useFieldArray({
    control,
    name: "qualifications",
  })

  const socialLinksArray = useFieldArray({
    control,
    name: "socialLinks",
  })

  // Watch all form values to ensure we have the latest data
  const watchedValues = watch()

  const handleUploadSuccess = (url, index) => {
    if (!url) {
      toast.error("Upload failed!")
      setUploadingStates((prev) => ({ ...prev, [index]: false }))
      return
    }

    // Set the certificate URL and ensure form state is updated
    setValue(`qualifications.${index}.certificateURL`, url, {
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

  const onSubmit = async () => {
    setLoading(true)
    try {
      // Get the latest form values to ensure certificate URLs are included
      const currentValues = getValues()
      const payload = { ...currentValues, userId }

      console.log("Submitting payload:", payload) // Debug log

      const res = await axios.post("/instructors/qualifications", payload)

      if (!res.data.success) {
        toast.error(res.data.message || "Submission failed")
        return
      }

      toast.success("Qualifications submitted successfully!")
      reset()
      setWizardStep(6)
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const openPreview = (url) => {
    setPreviewDialog({ open: true, url })
  }

  return (
    <>
      <div className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold">
            Hey {fullName} 👋, Let&apos;s Talk About Your Journey!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Share your experience and qualifications so we can get you verified and ready to inspire learners.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1">
              {/* Experience Summary */}
              <FormField
                control={control}
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
                      {field.value?.length || 0}/500 characters (minimum 50)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Qualifications */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel className="text-base font-medium">Qualifications & Certificates</FormLabel>
                  {qualificationsArray.fields.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        qualificationsArray.append({
                          degree: "",
                          certificateURL: "",
                        })
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Qualification
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {qualificationsArray.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <FormField
                              control={control}
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

                        {/* Certificate Upload and Preview */}
                        <div className="flex items-start gap-4">
                          <CloudinaryUploadWidget
                            onSuccess={(url) => handleUploadSuccess(url, index)}
                            onError={handleUploadError}
                            folder={`instructors/${userId}/qualifications`}
                            className="flex-shrink-0"
                            variant="button"
                          >
                            {uploadingStates[index] ? (
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadingStates[index] ? "Uploading..." : "Upload Certificate"}
                          </CloudinaryUploadWidget>

                          {/* Modern Certificate Preview */}
                          {watchedValues.qualifications?.[index]?.certificateURL && (
                            <div className="flex items-center gap-3">
                              <div className="relative group">
                                <img
                                  src={watchedValues.qualifications[index].certificateURL || "/placeholder.svg"}
                                  alt="Certificate preview"
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-border shadow-sm transition-all group-hover:shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20"
                                    onClick={() => openPreview(watchedValues.qualifications[index].certificateURL)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Certificate uploaded
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
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
                      onClick={() =>
                        socialLinksArray.append({
                          platform: "",
                          profileUrl: "",
                        })
                      }
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
                            control={control}
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
                                    <ScrollArea className="max-h-40">
                                      {socialPlatforms.map((platform) => (
                                        <SelectItem key={platform} value={platform}>
                                          {platform}
                                        </SelectItem>
                                      ))}
                                    </ScrollArea>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex-1">
                          <FormField
                            control={control}
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
                control={control}
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

        <DialogFooter className="flex justify-between pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => setWizardStep((prev) => prev - 1)}>
            Back
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="min-w-24">
              {loading ? <Loader className="animate-spin h-4 w-4" /> : "Submit"}
            </Button>
          </div>
        </DialogFooter>
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open, url: "" })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewDialog.url || "/placeholder.svg"}
              alt="Certificate preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InstructorWelcomeDialog() {
  const {
    formData: { fullName, email },
    setWizardStep,
    onOpenChange,
  } = useWizard();
  const navigate = useNavigate();

  const handleClick = () => {
    onOpenChange(false);
    setWizardStep(1);
    navigate("/");
  };

  return (
    <div className="space-y-3">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          🎉 Welcome Aboard, {fullName || "Instructor"}!
        </DialogTitle>
      </DialogHeader>
      <p className="text-lg text-muted-foreground text-center">
        Your qualifications have been submitted successfully! Our team will
        review your profile shortly. Get ready to inspire and teach the next
        generation! 🚀
      </p>
      <p className="text-sm text-muted-foreground text-center">
        Any updates will be sent straight to your email inbox at{" "}
        <span className="font-medium">{email}</span>. 📬
      </p>
      <DialogFooter>
        <Button onClick={() => handleClick()}>Done</Button>
      </DialogFooter>
    </div>
  );
}

function StudentWelcomeDialog() {
  const {
    formData: { fullName },
    onOpenChange,
    setWizardStep,
  } = useWizard();

  const navigate = useNavigate();

  const handleClick = () => {
    onOpenChange(false);
    setWizardStep(1);
    navigate("/dashboard");
  };
  return (
    <div className="space-y-3">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">
          🎓 Welcome, {fullName || "Student"}!
        </DialogTitle>
      </DialogHeader>
      <p className="text-lg text-muted-foreground text-center">
        You're officially part of the learning journey! 🚀 Get ready to explore
        new courses, gain skills, and level up your knowledge.
      </p>
      <DialogFooter>
        <Link to="/dashboard">
          <Button className="" onClick={() => handleClick()}>
            Dashboard
          </Button>
        </Link>
      </DialogFooter>
    </div>
  );
}

export default Wizard;
