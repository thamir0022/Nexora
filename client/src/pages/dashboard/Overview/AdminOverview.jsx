"use client"

import { Fragment, useEffect, useState, useCallback } from "react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import ViewAllDialog from "@/components/ViewAllDialog"

// Chart configurations using shadcn chart variables
const usersChartConfig = {
  users: {
    label: "Users",
    color: "var(--chart-1)",
  },
}

const enrollmentsChartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  average: {
    label: "Average",
    color: "var(--chart-2)",
  }
}

// Skeleton Components
const StatsCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-20" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
)

const ChartSkeleton = () => (
  <div className="h-[200px] flex items-center justify-center">
    <div className="space-y-3 w-full px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === 0 ? "w-full" : i === 1 ? "w-4/5" : i === 2 ? "w-3/5" : i === 3 ? "w-4/5" : "w-2/5"}`}
        />
      ))}
    </div>
  </div>
)

// Table columns configuration
const TABLE_COLUMNS = {
  users: [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => row.original.fullName || "N/A",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "N/A",
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => row.original.mobile || "N/A",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <span className="capitalize">{row.original.status}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
  ],
  enrollments: [
    {
      accessorKey: "user.fullName",
      header: "User",
      cell: ({ row }) => row.original.user?.fullName || "N/A",
    },
    {
      accessorKey: "course.title",
      header: "Course",
      cell: ({ row }) => row.original.course?.title || "N/A",
    },
    {
      accessorKey: "completed",
      header: "Completed",
      cell: ({ row }) => (
        <Badge variant={row.original.completed ? "default" : "secondary"}>
          {row.original.completed ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastAccessed",
      header: "Last Accessed",
      cell: ({ row }) =>
        row.original.lastAccessed ? (
          <span className="text-sm">{new Date(row.original.lastAccessed).toLocaleDateString()}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Not yet</span>
        ),
    },
    {
      accessorKey: "enrolledAt",
      header: "Enrolled At",
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.enrolledAt).toLocaleDateString()}</span>,
    },
  ],
  payments: [
    {
      accessorKey: "user.fullName",
      header: "User",
      cell: ({ row }) => row.original.user?.fullName || "N/A",
    },
    {
      accessorKey: "course[0].title",
      header: "Course",
      cell: ({ row }) => row.original.course?.[0]?.title || "N/A",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium">₹{row.original.amount?.toLocaleString() || 0}</span>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => <span className="capitalize">{row.original.paymentMethod || "N/A"}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus
        return (
          <Badge
            variant={status === "completed" ? "default" : "secondary"}
            className={status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "refund.isRefunded",
      header: "Refund",
      cell: ({ row }) => {
        const isRefunded = row.original.refund?.isRefunded
        return (
          <Badge variant={isRefunded ? "destructive" : "secondary"}>{isRefunded ? "Refunded" : "Not Refunded"}</Badge>
        )
      },
    },
    {
      accessorKey: "paymentDate",
      header: "Paid At",
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.paymentDate).toLocaleDateString()}</span>,
    },
  ],
}

// Filter options
const FILTER_OPTIONS = {
  users: [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Suspended", value: "suspended" },
    { label: "Rejected", value: "rejected" },
  ],
  enrollments: [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "In Progress", value: "in-progress" },
  ],
  payments: [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Refunded", value: "refunded" },
    { label: "Cancelled", value: "cancelled" },
  ],
}

// Stats Card Component
const StatsCard = ({ title, value, isLoading }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value || 0}</div>
      )}
    </CardContent>
  </Card>
)

// Single Area Chart Component (for Users and Enrollments)
const SingleAreaChart = ({ title, data, isLoading, config, dataKey, dialogProps }) => {
  const chartData = Array.isArray(data) ? data : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>Monthly {title.toLowerCase()} statistics</CardDescription>
        </div>
        <ViewAllDialog {...dialogProps} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No data available</p>
              <p className="text-sm text-muted-foreground">Data will appear here once available</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={config}>
            <AreaChart
              accessibilityLayer
              data={chartData}
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
                dataKey={dataKey}
                type="natural"
                fill={`var(--color-${dataKey})`}
                fillOpacity={0.4}
                stroke={`var(--color-${dataKey})`}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Monthly {title.toLowerCase()} overview <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">Last 12 months data</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Stacked Area Chart Component (for Revenue)
const StackedAreaChart = ({ title, data, isLoading, config, dialogProps }) => {
  const chartData = Array.isArray(data) ? data : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>Monthly revenue and average statistics</CardDescription>
        </div>
        <ViewAllDialog {...dialogProps} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="space-y-3 w-full px-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 w-${Math.floor(Math.random() * 5) + 3}/5`} />
              ))}
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No data available</p>
              <p className="text-sm text-muted-foreground">Data will appear here once available</p>
            </div>
          </div>
        ) : (
          <ChartContainer className="h-60 w-full" config={config}>
            <AreaChart
              accessibilityLayer
              data={chartData}
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
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="average"
                type="natural"
                fill="var(--color-average)"
                fillOpacity={0.4}
                stroke="var(--color-average)"
                stackId="a"
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="var(--color-revenue)"
                fillOpacity={0.4}
                stroke="var(--color-revenue)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Revenue trending analysis <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Revenue and average comparison
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// User Item Component
const UserItem = ({ user, showSeparator }) => (
  <Fragment>
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
          <AvatarFallback className="capitalize">{user.fullName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{user.fullName}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize shrink-0",
                user.role === "admin" && "bg-red-100 text-red-800 border-red-200",
                user.role === "student" && "bg-blue-100 text-blue-800 border-blue-200",
                user.role === "instructor" && "bg-green-100 text-green-800 border-green-200",
              )}
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
      </span>
    </div>
    {showSeparator && <Separator />}
  </Fragment>
)

// Enrollment Item Component
const EnrollmentItem = ({ enrollment, showSeparator }) => (
  <Fragment>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img
          className="w-24 h-16 rounded-md object-cover shadow-sm border"
          src={enrollment.course?.thumbnailImage || "/placeholder.svg"}
          alt={enrollment.course?.title || "Course"}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{enrollment.course?.title || "Untitled Course"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}</span>
        <span>•</span>
        <span>Enrolled by</span>
        <Avatar className="h-4 w-4">
          <AvatarImage src={enrollment.user?.profilePicture || "/placeholder.svg"} />
          <AvatarFallback className="text-xs">{enrollment.user?.fullName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{enrollment.user?.fullName}</span>
      </div>
    </div>
    {showSeparator && <Separator />}
  </Fragment>
)

// Main Component
const AdminOverview = () => {
  // State management
  const [data, setData] = useState({
    platformStats: null,
    latestUsers: [],
    latestEnrollments: [],
    userStats: [],
    enrollmentStats: [],
    revenueStats: [],
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const axios = useAxiosPrivate()

  // Fetch all data in parallel
  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }
        setError(null)

        console.log("Fetching all dashboard data...")

        // Parallel API calls for better performance
        const [
          platformStatsRes,
          latestUsersRes,
          latestEnrollmentsRes,
          userStatsRes,
          enrollmentStatsRes,
          revenueStatsRes,
        ] = await Promise.all([
          axios.get("/admin/stats/platform"),
          axios.get("/admin/users?limit=5"),
          axios.get("/admin/enrollments?limit=5"),
          axios.get("/admin/stats/users/monthly"),
          axios.get("/admin/stats/enrollments/monthly"),
          axios.get("/admin/stats/revenue"),
        ])

        // Update state with all fetched data
        setData({
          platformStats: platformStatsRes.data,
          latestUsers: latestUsersRes.data?.users || [],
          latestEnrollments: latestEnrollmentsRes.data?.enrollments || [],
          userStats: userStatsRes.data || [],
          enrollmentStats: enrollmentStatsRes.data || [],
          revenueStats: revenueStatsRes.data || [],
        })

        console.log("✅ All dashboard data fetched successfully")
        console.log("User Stats:", userStatsRes.data)
        console.log("Enrollment Stats:", enrollmentStatsRes.data)
        console.log("Revenue Stats:", revenueStatsRes.data)
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err)

        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.")
        } else if (err.response?.status === 403) {
          setError("You don't have permission to access this data.")
        } else if (err.response?.status >= 500) {
          setError("Server error. Please try again later.")
        } else {
          setError("Failed to load dashboard data. Please try again.")
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [axios],
  )

  // Load data on mount
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchAllData(true)
  }, [fetchAllData])

  // Loading state
  if (loading) {
    return (
      <section className="container mx-auto p-4 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <StatsCardSkeleton key={idx} />
          ))}
        </div>

        {/* Charts and lists skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <ChartSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue chart skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-3 w-full px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 w-${Math.floor(Math.random() * 5) + 3}/5`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="container mx-auto p-4">
        <div className="text-center py-12 space-y-4">
          <div className="text-destructive text-lg font-medium">{error}</div>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Overview of your platform performance and statistics</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={data.platformStats?.totalUsers} />
        <StatsCard title="Total Courses" value={data.platformStats?.totalCourses} />
        <StatsCard title="Total Enrollments" value={data.platformStats?.totalEnrollments} />
        <StatsCard title="Total Revenue" value={`₹${data.platformStats?.totalRevenue?.toLocaleString() || 0}`} />
      </div>

      {/* Charts and Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <SingleAreaChart
          title="Users"
          data={data.userStats}
          config={usersChartConfig}
          dataKey="users"
          dialogProps={{
            title: "Users",
            api: "/admin/users",
            dataKey: "users",
            defaultFilters: FILTER_OPTIONS.users,
            columns: TABLE_COLUMNS.users,
          }}
        />

        {/* Enrollments Chart */}
        <SingleAreaChart
          title="Enrollments"
          data={data.enrollmentStats}
          config={enrollmentsChartConfig}
          dataKey="enrollments"
          dialogProps={{
            title: "Enrollments",
            api: "/admin/enrollments",
            dataKey: "enrollments",
            defaultFilters: FILTER_OPTIONS.enrollments,
            columns: TABLE_COLUMNS.enrollments,
          }}
        />

        {/* Latest Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Latest Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestUsers.length > 0 ? (
              data.latestUsers.map((user, idx) => (
                <UserItem key={user._id} user={user} showSeparator={idx < data.latestUsers.length - 1} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No users found</div>
            )}
          </CardContent>
        </Card>

        {/* Latest Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Latest Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestEnrollments.length > 0 ? (
              data.latestEnrollments.map((enrollment, idx) => (
                <EnrollmentItem
                  key={enrollment._id}
                  enrollment={enrollment}
                  showSeparator={idx < data.latestEnrollments.length - 1}
                />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No enrollments found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart - Full Width */}
      <StackedAreaChart
        title="Sales & Revenue"
        data={data.revenueStats}
        config={revenueChartConfig}
        dialogProps={{
          title: "Sales",
          api: "/admin/orders",
          dataKey: "orders",
          defaultFilters: FILTER_OPTIONS.payments,
          columns: TABLE_COLUMNS.payments,
        }}
      />
    </section>
  )
}

export default AdminOverview
