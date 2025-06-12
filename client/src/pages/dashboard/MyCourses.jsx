import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { StarRating } from "@/components/ui/star-rating"
import { CiClock2, CiTrophy, CiPlay1, CiCalendar, CiBookmark, CiStar, CiUser } from "react-icons/ci"
import { Link } from "react-router-dom"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import noData from "@/assets/images/no-data.svg"

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user: { _id: userId } } = useAuth()
  const axios = useAxiosPrivate()

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`/users/${userId}/courses`)

        if (data.success) {
          setCourses(data.courses)
        } else {
          setError("Failed to fetch courses")
          toast.error("Failed to load your courses")
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error)
        setError("Error loading courses")
        toast.error("Error loading your courses")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchEnrolledCourses()
    }
  }, [userId, axios])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = (completed, percentage) => {
    if (completed) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
          <CiTrophy className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    if (percentage > 0) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
          In Progress
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-gray-400 text-gray-600">
        Not Started
      </Badge>
    )
  }

  const getProgressMessage = (percentage, completedLessons, totalLessons) => {
    if (percentage === 100) return "Course completed! 🎉"
    if (percentage === 0) return "Ready to start your learning journey"
    return `${completedLessons} of ${totalLessons} lessons completed`
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <CardHeader className="pb-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <CiBookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Dashboard</h1>
          <p className="text-gray-600">
            {courses.length} {courses.length === 1 ? "course" : "courses"} in your learning journey
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <img className="w-44 mx-auto" src={noData} alt="No Courses Found" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Start Your Learning Journey</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Discover amazing courses and unlock your potential. Your first course is just a click away!
            </p>
            <Link to="/">
              <Button size="lg" className="px-8">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((enrollment) => (
              <Card
                key={enrollment.course}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md"
              >
                {/* Course Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={enrollment.courseDetails.thumbnailImage || "/placeholder.svg?height=200&width=400"}
                    alt={enrollment.courseDetails.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(enrollment.completed, enrollment.progress.progressPercentage)}
                  </div>
                  {enrollment.progress.progressPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <Progress value={enrollment.progress.progressPercentage} className="h-1.5 bg-white/20" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {enrollment.courseDetails.title}
                    </h3>

                    {/* Course Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {enrollment.courseDetails.rating.ratingCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <StarRating value={enrollment.courseDetails.rating.averageRating} readonly size="sm" />
                          <span className="text-xs">({enrollment.courseDetails.rating.ratingCount})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <CiStar className="h-4 w-4" />
                          <span className="text-xs">No ratings yet</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <CiUser className="h-4 w-4" />
                        <span className="text-xs">{enrollment.courseDetails.enrolledCount} enrolled</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Learning Progress</span>
                      <span className="text-sm font-bold text-gray-900">{enrollment.progress.progressPercentage}%</span>
                    </div>

                    {enrollment.progress.progressPercentage > 0 && (
                      <Progress value={enrollment.progress.progressPercentage} className="h-2" />
                    )}

                    <p className="text-xs text-gray-600">
                      {getProgressMessage(
                        enrollment.progress.progressPercentage,
                        enrollment.progress.completedLessons.length,
                        enrollment.progress.totalLessons,
                      )}
                    </p>
                  </div>

                  <Separator />

                  {/* Course Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CiCalendar className="h-4 w-4" />
                        <span>Enrolled {formatDate(enrollment.enrolledAt)}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatPrice(enrollment.courseDetails.price)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CiClock2 className="h-4 w-4" />
                      <span>Last accessed {formatDate(enrollment.lastAccessed)}</span>
                    </div>
                  </div>

                  {/* Hashtags */}
                  {enrollment.courseDetails.hashtags && enrollment.courseDetails.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {enrollment.courseDetails.hashtags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                          #{tag}
                        </Badge>
                      ))}
                      {enrollment.courseDetails.hashtags.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          +{enrollment.courseDetails.hashtags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Link to={`/courses/${enrollment.course}`} className="block">
                    <Button className="w-full" variant={enrollment.completed ? "outline" : "default"} size="lg">
                      <CiPlay1 className="mr-2 h-4 w-4" />
                      {enrollment.completed
                        ? "Review Course"
                        : enrollment.progress.progressPercentage > 0
                          ? "Continue Learning"
                          : "Start Course"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCourses
