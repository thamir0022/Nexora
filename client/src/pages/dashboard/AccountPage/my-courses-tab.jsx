import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function MyCoursesTab({ userData }) {
  const courses = userData.courses || [];

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>You haven't created any courses yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Share your knowledge with the world
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Courses you've created and published
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <Link to={"/dashboard?tab=courses"}>
            <Button>Go to my courses</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
