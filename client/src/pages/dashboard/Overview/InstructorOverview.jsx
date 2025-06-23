import { useState, useEffect } from "react"
import { toast } from "sonner"
import { BookOpen, Users, TrendingUp, Star, Award, Activity, Clock, BarChart3 } from "lucide-react"
import { FaRupeeSign } from "react-icons/fa"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { format } from "date-fns"

const InstructorOverview = () => {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const axios = useAxiosPrivate()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/instructors/analytics")

        if (response.data.success) {
          setAnalyticsData(response.data.data)
        } else {
          toast.error(response.data.message || "Failed to fetch analytics")
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
        toast.error("An error occurred while fetching analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [axios])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Unable to load your analytics data at this time.</p>
        </div>
      </div>
    )
  }

  const { overview, graphData, topCourses, recentEnrollments, metrics } = analyticsData

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Chart configurations
  const courseChartConfig = {
    courses: {
      label: "Courses",
      color: "var(--chart-1)",
    },
  }

  const studentChartConfig = {
    students: {
      label: "Students",
      color: "var(--chart-2)",
    },
  }

  // Calculate trends
  const calculateTrend = (data, key) => {
    const nonZeroData = data.filter((item) => item[key] > 0)
    if (nonZeroData.length < 2) return { trend: 0, isPositive: false }

    const recent = nonZeroData.slice(-2)
    if (recent.length < 2) return { trend: 0, isPositive: false }

    const [prev, current] = recent
    const change = ((current[key] - prev[key]) / prev[key]) * 100
    return { trend: Math.abs(change), isPositive: change > 0 }
  }

  const courseTrend = calculateTrend(graphData.courses, "courses")
  const studentTrend = calculateTrend(graphData.students, "students")

  // Stats cards data
  const statsCards = [
    {
      title: "Total Courses",
      value: overview.totalCourses,
      icon: BookOpen,
      description: `${overview.publishedCourses} published, ${overview.draftCourses} draft`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Students",
      value: overview.totalStudents,
      icon: Users,
      description: `${metrics.averageEnrollmentsPerCourse} avg per course`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(overview.totalRevenue),
      icon: FaRupeeSign,
      description: "From all enrollments",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Completion Rate",
      value: `${overview.completionRate}%`,
      icon: Award,
      description: "Student completion rate",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Instructor Overview</h1>
        <p className="text-gray-600">Track your teaching performance and student engagement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Creation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Creation Trends
            </CardTitle>
            <CardDescription>Number of courses created each month this year</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={courseChartConfig}>
              <AreaChart
                accessibilityLayer
                data={graphData.courses}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="courses"
                  type="natural"
                  fill="var(--color-courses)"
                  fillOpacity={0.4}
                  stroke="var(--color-courses)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {courseTrend.trend > 0 ? (
                    <>
                      {courseTrend.isPositive ? "Trending up" : "Trending down"} by {courseTrend.trend.toFixed(1)}% this
                      period
                      <TrendingUp
                        className={`h-4 w-4 ${courseTrend.isPositive ? "text-green-600" : "text-red-600 rotate-180"}`}
                      />
                    </>
                  ) : (
                    "No trend data available"
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  Course creation activity - {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Student Enrollment Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Student Enrollment Trends
            </CardTitle>
            <CardDescription>Number of student enrollments each month this year</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={studentChartConfig}>
              <AreaChart
                accessibilityLayer
                data={graphData.students}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="students"
                  type="natural"
                  fill="var(--color-students)"
                  fillOpacity={0.4}
                  stroke="var(--color-students)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {studentTrend.trend > 0 ? (
                    <>
                      {studentTrend.isPositive ? "Trending up" : "Trending down"} by {studentTrend.trend.toFixed(1)}%
                      this period
                      <TrendingUp
                        className={`h-4 w-4 ${studentTrend.isPositive ? "text-green-600" : "text-red-600 rotate-180"}`}
                      />
                    </>
                  ) : (
                    "No trend data available"
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  Student enrollment activity - {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Courses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Top Performing Courses
            </CardTitle>
            <CardDescription>Your courses ranked by student enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCourses.slice(0, 5).map((course, index) => (
                <div key={course._id} className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50/50">
                  <div className="flex-shrink-0">
                    <img
                      src={course.thumbnailImage || "/placeholder.svg"}
                      alt={course.title}
                      className="h-16 w-20 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">{course.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.totalEnrollments} students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {course.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <FaRupeeSign className="h-3 w-3" />
                        {formatCurrency(course.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      #{index + 1}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {course.rating.averageRating || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Recent Enrollments
            </CardTitle>
            <CardDescription>Latest student enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEnrollments.slice(0, 6).map((enrollment) => (
                <div key={enrollment._id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {enrollment.studentName?.charAt(0)?.toUpperCase() || "S"}
                    </AvatarFallback>
                    <AvatarImage src={enrollment.studentAvatar || "/placeholder.svg"} alt={enrollment.studentName} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{enrollment.studentName}</p>
                    <p className="text-xs text-gray-500 truncate">{enrollment.courseTitle}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(enrollment.enrolledAt), "MMM d")}
                    </div>
                    <Badge
                      variant="secondary"
                      className={enrollment.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                    >
                      {enrollment.completed ? "Completed" : "Active"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InstructorOverview
