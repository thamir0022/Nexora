import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Clock, Trophy, Play, Tag } from "lucide-react"
import { Link } from "react-router-dom"
import { ProgressPieChart } from "./progress-pie-chart"

export function CourseCard({ courseData }) {
  const { course, progress } = courseData
  const progressPercentage =
    progress.totalLessons > 0 ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100) : 0

  const isCompleted = progressPercentage === 100
  const isStarted = progressPercentage > 0

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
          <Trophy className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    if (isStarted) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-gray-400 text-gray-600">
        <BookOpen className="h-3 w-3 mr-1" />
        Not Started
      </Badge>
    )
  }

  const getProgressMessage = () => {
    if (isCompleted) return "Course completed! 🎉"
    if (!isStarted) return "Ready to start your learning journey"
    return `${progress.completedLessons.length} of ${progress.totalLessons} lessons completed`
  }

  const getButtonText = () => {
    if (isCompleted) return "Review Course"
    if (isStarted) return "Continue Learning"
    return "Start Course"
  }

  // Get primary category (first one)
  const primaryCategory = course.categories && course.categories.length > 0 ? course.categories[0] : null

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md group">
      {/* Course Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <img
          src={course.thumbnailImage || `/placeholder.svg?height=200&width=400`}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = `/placeholder.svg?height=200&width=400`
          }}
        />
        <div className="absolute top-3 right-3">{getStatusBadge()}</div>

        {/* Progress Pie Chart Overlay */}
        {isStarted && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
              <ProgressPieChart
                completedLessons={progress.completedLessons.length}
                totalLessons={progress.totalLessons}
                size={60}
              />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight text-lg">{course.title}</h3>

          {/* Instructor Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={course.instructor.profilePicture || "/placeholder.svg"}
                alt={course.instructor.fullName}
              />
              <AvatarFallback className="text-xs">
                {course.instructor.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{course.instructor.fullName}</p>
              {primaryCategory && <p className="text-xs text-gray-500 truncate">{primaryCategory.name}</p>}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section with Pie Chart */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ProgressPieChart
              completedLessons={progress.completedLessons.length}
              totalLessons={progress.totalLessons}
              size={80}
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">{progressPercentage}%</span>
            </div>
            <p className="text-xs text-gray-600">{getProgressMessage()}</p>
          </div>
        </div>

        {/* Course Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{progress.totalLessons} lessons</span>
            </div>
            <span className="font-semibold text-gray-900">{formatPrice(course.price)}</span>
          </div>
        </div>

        {/* Categories */}
        {course.categories && course.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.categories.slice(0, 2).map((category) => (
              <Badge key={category._id} variant="secondary" className="text-xs px-2 py-0.5">
                <Tag className="h-3 w-3 mr-1" />
                {category.name}
              </Badge>
            ))}
            {course.categories.length > 2 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{course.categories.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Link to={`/courses/${course._id}`} className="block">
          <Button className="w-full" variant={isCompleted ? "outline" : "default"} size="lg">
            <Play className="mr-2 h-4 w-4" />
            {getButtonText()}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
