import { use, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "./ui/dialog";

const Profile = ({ user }) => {
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  console.log({userToUpdate, userToDelete});

  return (
    <Card className="w-full">
      <CardHeader className="">
        <Avatar className="size-36 mx-auto">
          <AvatarImage src={user?.profilePicture} alt={user?.fullName} />
          <AvatarFallback className="text-6xl text-muted-foreground">
            {user.fullName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="w-fit mx-auto space-x-5">
          <Badge>{user.role}</Badge>
          <Badge
            className={
              user.status === "pending"
                ? "bg-yellow-500"
                : user.status === "suspended"
                ? "bg-red-500"
                : user.status === "active" && "bg-green-500"
            }
          >
            {user.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <p>{user.fullName}</p>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="flex gap-1 items-center">
            {user.email}{" "}
            {user.emailVerified ? (
              <BadgeCheck size={20} />
            ) : (
              <BadgeX size={20} />
            )}
          </p>
        </div>
        {user.role === "instructor" && (
          <div className="space-y-2">
            <Label>Bio</Label>
            <p>{user.bio}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label>Mobile</Label>
          <p className="flex gap-1 items-center">
            {user.mobile}{" "}
            {user.mobileVerified ? (
              <BadgeCheck size={20} />
            ) : (
              <BadgeX size={20} />
            )}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-around">
        <Dialog>
          <DialogTrigger>
            <Button
              className="bg-yellow-500 hover:bg-yellow-500"
              onClick={() => setUserToUpdate(user._id)}
            >
              Update Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <h2 className="text-2xl font-semibold text-center">
                Update Your Account
              </h2>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger>
            <Button
              variant="destructive"
              onClick={() => setUserToDelete(user._id)}
            >
              Delete Account
            </Button>
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
