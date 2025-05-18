import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Camera, Loader, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "./ui/dialog";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/utils/cloudinaryUploader";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

const updateUserSchema = z
  .object({
    id: z.string(),
    fullName: z.string().min(1, "Full name is required"),
    bio: z.string().min(20).max(400).optional(),
    mobile: z
      .string()
      .regex(/^\d{10}$/, "Mobile number must be 10 digits")
      .optional(),

    oldPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      const { oldPassword, newPassword } = data;

      // If either one is provided, both must be present
      if (oldPassword || newPassword) {
        return !!oldPassword && !!newPassword && newPassword.length >= 6;
      }

      return true; // No passwords entered, allow
    },
    {
      message:
        "Both old and new passwords are required, and new password must be at least 6 characters",
      path: ["newPassword"],
    }
  );

const Profile = ({
  user: {
    _id,
    profilePicture,
    fullName,
    role,
    status,
    email,
    emailVerified,
    bio,
    mobile,
    mobileVerified,
  },
}) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setprofilePhotoPreview] = useState("");
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const axios = useAxiosPrivate();

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: _id,
      fullName,
      bio,
      mobile,
      password: "",
      confirmPassword: "",
    },
  });

  const handleUploadProfilePhoto = () => {
    inputRef.current.click();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let profilePicture = undefined;
      if (profilePhoto) {
        profilePicture = await uploadToCloudinary(
          profilePhoto,
          "userProfilePhoto",
          { userId: _id }
        );
      }

      const res = await axios.patch(`/users/${_id}`, {
        ...data,
        profilePicture,
      });

      if(res.data.success) setOpenUpdateDialog(false);

      toast(res.data.message);
    } catch (error) {
      console.log(error);
    }finally{
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfilePhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setprofilePhotoPreview(previewUrl);
  };

  return (
    <Card className="w-1/3 min-w-sm mx-auto">
      <CardHeader className="">
        <Avatar className="size-36 mx-auto">
          <AvatarImage
            className="object-cover"
            src={profilePhotoPreview || profilePicture}
            alt={fullName}
          />
          <AvatarFallback className="text-6xl text-muted-foreground">
            {fullName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="w-fit mx-auto space-x-5">
          <Badge className="capitalize">{role}</Badge>
          <Badge
            className={
              status === "pending"
                ? "bg-yellow-500"
                : status === "suspended"
                ? "bg-red-500"
                : status === "active" && "bg-green-500"
            }
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <p>{fullName}</p>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="flex gap-1 items-center">
            {email} {emailVerified && <ShieldCheck size={20} />}
          </p>
        </div>
        {role === "instructor" && (
          <div className="space-y-2">
            <Label>Bio</Label>
            <p>{bio}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Mobile</Label>
          <p className="flex gap-1 items-center">
            {mobile} {mobileVerified && <ShieldCheck size={20} />}
          </p>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-5">
        <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
          <DialogTrigger>
            <Button className="bg-yellow-500 hover:bg-yellow-500">
              Update Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-center">
                Update Your Account
              </DialogTitle>
            </DialogHeader>
            <Form {...form} className="">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <Avatar className="m-auto size-36 relative">
                  <AvatarImage
                    className="object-cover"
                    src={profilePhotoPreview || profilePicture}
                  />
                  <AvatarFallback className="text-6xl text-muted-foreground">
                    {fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Camera
                          onClick={() => handleUploadProfilePhoto()}
                          className="bg-white rounded-full p-1 absolute text-black size-8 right-5 bottom-0 cursor-pointer hover:scale-125 transition-all"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Edit Profile Picture</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Avatar>
                <Input
                  ref={inputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-20 max-h-40"
                          placeholder="Say something about yourself"
                          {...field}
                        />
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
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your mobile number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Old Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="w-full grid grid-cols-2 gap-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button type="submit" className="" disabled={loading}>
                    {loading ? <Loader className="size-6 animate-spin"/> : "Confirm"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger>
            <Button variant="destructive">Delete Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <h2 className="text-2xl font-semibold text-center">
                Delete Your Account
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
            </DialogHeader>
            <div className="flex justify-around space-x-3">
              <DialogClose>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose>
                <Button variant="destructive">Delete</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default Profile;
