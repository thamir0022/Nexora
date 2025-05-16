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
import { Loader, PlusCircle, Trash2 } from "lucide-react";
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
import { uploadToCloudinary } from "@/utils/cloudinaryUploader";

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
  const { handleChange, formData, setWizardStep, onOpenChange } = useWizard();
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

  const onSubmit = async (data) => {
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...rest } = data;
    const { fullName, password, mobile } = rest;
    setLoading(true);

    await handleChange("fullName", fullName);
    await handleChange("password", password);
    await handleChange("mobile", mobile);

    try {
      const { fullName, email, mobile, role, password } = formData;

      if (!fullName || !email || !mobile || !role || !password) {
        return toast.error("All fields are required");
      }

      const res = await axios.post("/auth/register", formData);

      if (!res.data.success) {
        return toast.error(res.data.message);
      }

      if (res.data.user.role === "student") {
        form.reset();
        setUser(res.data.user);
        setToken(res.data.accessToken);
        return setWizardStep(5);
      }

      await handleChange("userId", res.data.user._id);
      toast.success(res.data.message);
      setWizardStep(4);
    } catch (error) {
      const message = error.response.data.message || "Something went wrong";
      toast.error(message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

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
  // Store certificates separately for Cloudinary upload
  const [certificates, setCertificates] = useState({});
  const [loading, setLoading] = useState(false);
  const {
    setWizardStep,
    formData: { fullName, userId },
  } = useWizard();

  const axios = useAxiosPrivate();

  // Initialize form with React Hook Form and Zod validation
  const form = useForm({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      experienceSummary: "",
      qualifications: [{ degree: "" }],
      socialLinks: [{ platform: "", profileUrl: "" }],
      portfolioLink: "",
    },
  });

  // Setup field arrays for dynamic fields
  const qualificationsArray = useFieldArray({
    control: form.control,
    name: "qualifications",
  });

  const socialLinksArray = useFieldArray({
    control: form.control,
    name: "socialLinks",
  });

  // Handle file upload
  const handleFileChange = (event, index) => {
    const file = event.target.files[0];
    if (file) {
      // Store the file for Cloudinary upload
      setCertificates((prev) => ({
        ...prev,
        [index]: {
          file,
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
        },
      }));
    }
  };

  // Remove uploaded file
  const removeFile = (index) => {
    setCertificates((prev) => {
      const newCertificates = { ...prev };
      delete newCertificates[index];
      return newCertificates;
    });
  };

  // Handle form submission
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const uploadedCertificates = await Promise.all(
        data.qualifications.map(async (qualification, index) => {
          const cert = certificates[index];
          if (!cert)
            throw new Error(`Missing certificate file for index ${index}`);

          const url = await uploadToCloudinary(
            cert.file,
            "instructorCertificate",
            {
              instructorId: userId, // or data._id if needed
              certIndex: index,
            }
          );

          return {
            degree: qualification.degree,
            certificateURL: url,
          };
        })
      );

      const cleanData = {
        ...data,
        userId,
        qualifications: uploadedCertificates,
      };

      const res = await axios.post("/instructors/qualifications", cleanData);

      if (!res.data.success) {
        return toast.error(res.data.message || "Something went wrong");
      }

      form.reset();
      setCertificates({});
      setWizardStep(6);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    form.reset();
    setCertificates({});
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Hey {fullName}👋, Let&apos;s Talk About Your Journey!
        </DialogTitle>
        <DialogDescription className="text-center">
          Share your experience and qualifications so we can get you verified
          and ready to inspire learners.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5 px-2"
            >
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
                        className="min-h-20 max-h-40"
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
                              <Input
                                placeholder="e.g., M.Sc. in Physics"
                                {...field}
                              />
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
                          onClick={() =>
                            document
                              .getElementById(`certificate-file-${index}`)
                              .click()
                          }
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
                            qualificationsArray.remove(index);
                            removeFile(index);
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
                      onClick={() =>
                        socialLinksArray.append({
                          platform: "",
                          profileUrl: "",
                        })
                      }
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
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
                        control={form.control}
                        name={`socialLinks.${index}.profileUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://..."
                                {...field}
                              />
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
                      <Input
                        type="url"
                        placeholder="e.g., https://yourportfolio.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between!">
                <Button
                  className="self-start"
                  type="button"
                  variant="outline"
                  onClick={() => setWizardStep((prev) => prev - 1)}
                >
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </ScrollArea>
    </div>
  );
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
