import { useState, useEffect } from "react"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useAuth } from "@/hooks/useAuth"
import { CourseCard } from "./components/course-card"
import { LoadingSkeleton } from "./components/loading-skeleton"
import { EmptyState } from "./components/empty-state"
import { ErrorState } from "./components/error-state"
import { OverallProgressChart } from "./components/overall-progress-chart"

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const axios = useAxiosPrivate()

  const fetchEnrolledCourses = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.get(`/users/${user._id}/courses`)

      if (data.success) {
        // Remove duplicate courses based on course._id
        const uniqueCourses = data.courses.filter(
          (courseData, index, self) => index === self.findIndex((c) => c.course._id === courseData.course._id),
        )
        setCourses(uniqueCourses)
      } else {
        throw new Error(data.message || "Failed to fetch courses")
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error)
      const errorMessage = error.response?.data?.message || error.message || "Error loading courses"
      setError(errorMessage)
      toast.error("Failed to load your courses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrolledCourses()
  }, [user?._id])

  const handleRetry = () => {
    fetchEnrolledCourses()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          {/* Loading skeleton for overview section */}
          <div className="mb-8 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-80 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState error={error} onRetry={handleRetry} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Dashboard</h1>
          <p className="text-gray-600">
            {courses.length === 0
              ? "No courses enrolled yet"
              : `${courses.length} ${courses.length === 1 ? "course" : "courses"} in your learning journey`}
          </p>
        </div>

        {/* Content */}
        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Overall Progress Section */}
            <OverallProgressChart courses={courses} />

            {/* Courses Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((courseData) => (
                <CourseCard key={courseData.course._id} courseData={courseData} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyCourses
