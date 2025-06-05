import { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/datatable/data-table";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useAuth } from "@/hooks/useAuth";

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const url = user.role === "admin" ? "/courses?status=all" : "/instructors/courses";
        const response = await axios.get(url);

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch courses");
        }

        setCourses(response.data.courses);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Handle row click to navigate to course details
  const handleRowClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}`);
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor?.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (course.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 border-b px-4">
            <Skeleton className="h-6 w-full mt-3" />
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 border-b px-4 py-2">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No courses found</AlertTitle>
        <AlertDescription>
          There are no courses available at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  const columns = [
    {
      id: "title",
      header: "Course",
      accessorKey: "title",
      cell: ({ row }) => (
        <div className="max-w-sm flex items-start gap-3">
          <div className="h-12 w-16 rounded bg-muted flex-shrink-0">
            <img
              src={row.original.thumbnailImage || ""}
              alt={row.original.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "";
              }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-medium truncate">{row.original.title}</p>
            <p className="w-full text-muted-foreground break-words line-clamp-2">
              {row.original.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "instructor",
      header: "Instructor",
      accessorKey: "instructor.fullName",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={row.original.instructor?.profilePicture || "/placeholder.svg"}
              alt={row.original.instructor?.fullName || "Instructor"}
            />
          </Avatar>
          <span>
            {row.original.instructor?.fullName || "Unknown Instructor"}
          </span>
        </div>
      ),
    },
    {
      id: "categories",
      header: "Categories",
      accessorKey: "category",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.category?.slice(0, 2).map((cat) => (
            <Badge
              key={cat._id}
              variant="secondary"
              className="font-normal"
            >
              {cat.name}
            </Badge>
          ))}
          {row.original.category?.length > 2 && (
            <Badge variant="outline" className="font-normal">
              +{row.original.category.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "rating.averageRating",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <span className="font-medium">
            {row.original.rating?.averageRating || "N/A"}
          </span>
          <StarRating
            rating={row.original.rating?.averageRating || 0}
            readonly
            size="sm"
          />
          <span className="text-xs text-muted-foreground">
            ({row.original.rating?.ratingCount || 0})
          </span>
        </div>
      ),
    },
    {
      id: "students",
      header: "Students",
      accessorKey: "enrolledCount",
      cell: ({ row }) => row.original.enrolledCount || 0,
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">{formatDate(row.original.updatedAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <section className="container mx-auto py-8 px-4">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Course Management</h2>
        <p className="text-muted-foreground">Manage course and their descriptions</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-8 w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredCourses}
        pageSize={10}
        className="w-full"
        onRowClick={(row) => handleRowClick(row.original._id)}
      />
    </section>
  );
}

export default CoursesList;
