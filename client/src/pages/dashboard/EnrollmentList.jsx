import { useState, useEffect } from "react"
import { useDebounce } from "use-debounce"
import { Search, X, BookOpen, Calendar, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { DataTable } from "@/components/datatable/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

const EnrollmentsList = () => {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [debouncedSearch] = useDebounce(searchText, 500)
  const axios = useAxiosPrivate()

  const fetchEnrollments = async (searchQuery = "") => {
    try {
      setLoading(true)
      const response = await axios.get(
        `/admin/enrollments${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`,
      )

      if (response.data.success) {
        setEnrollments(response.data.enrollments)
      } else {
        toast.error(response.data.message || "Failed to fetch enrollments")
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      toast.error("An error occurred while fetching enrollments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollments(debouncedSearch)
  }, [debouncedSearch])

  const columns = [
    {
      accessorKey: "user",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {row.original.user?.fullName?.charAt(0)?.toUpperCase() || "S"}
            </AvatarFallback>
            <AvatarImage
              src={row.original.user?.profilePicture || "/placeholder.svg"}
              alt={row.original.user?.fullName || "Student"}
            />
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{row.original.user?.fullName || "Unknown Student"}</p>
            <p className="text-sm text-gray-500">ID: {row.original.user?._id?.slice(-8) || "N/A"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "course",
      header: "Course",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={row.original.course?.thumbnailImage || "/placeholder.svg"}
              alt={row.original.course?.title || "Course"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 line-clamp-2">{row.original.course?.title || "Unknown Course"}</p>
            <p className="text-sm text-gray-500">ID: {row.original.course?._id?.slice(-8) || "N/A"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "completed",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.completed ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                Completed
              </Badge>
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 text-blue-500" />
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                In Progress
              </Badge>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: "enrolledAt",
      header: "Enrolled Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(row.original.enrolledAt), "MMM d, yyyy")}
            </p>
            <p className="text-xs text-gray-500">{format(new Date(row.original.enrolledAt), "h:mm a")}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "lastAccessed",
      header: "Last Accessed",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            {row.original.lastAccessed ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(row.original.lastAccessed), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-gray-500">{format(new Date(row.original.lastAccessed), "h:mm a")}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Never accessed</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        // You can calculate progress based on your data structure
        // For now, showing completion status
        const progress = row.original.completed ? 100 : 0
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress === 100 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )
      },
    },
  ]

  const getEnrollmentStats = () => {
    const total = enrollments.length
    const completed = enrollments.filter((enrollment) => enrollment.completed).length
    const inProgress = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, completionRate }
  }

  const stats = getEnrollmentStats()

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600">Monitor and manage student course enrollments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-600">Total Enrollments</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.inProgress}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gradient-to-r from-blue-500 to-green-500 rounded" />
              <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by student name or course title..."
            className="pl-10 pr-10"
          />
          {searchText && (
            <button onClick={() => setSearchText("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={loading}
        pageSize={10}
        className="bg-white rounded-lg border shadow-sm"
      />
    </div>
  )
}

export default EnrollmentsList
