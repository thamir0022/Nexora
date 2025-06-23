import React, { Fragment, useEffect, useState } from 'react'
import useAxiosPrivate from '@/hooks/useAxiosPrivate'
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import ViewAllDialog from '@/components/ViewAllDialog'

const AdminOverview = () => {
  const axios = useAxiosPrivate();
  const [platformStats, setPlatformStats] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState([]);
  const [latestUsers, setLatestUsers] = useState([]);
  const [latestEnrollments, setLatestEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, usersStatsRes, enrollmentsStatsRes, revenueStatsRes, usersRes, enrollmentsRes] = await Promise.all([
          axios.get("/admin/stas/platform"),
          axios.get("/admin/stas/users/monthly"),
          axios.get("/admin/stas/enrollments/monthly"),
          axios.get("/admin/stas/revenue"),
          axios.get("/admin/users?limit=5"),
          axios.get("/admin/enrollments?limit=5")
        ]);

        setPlatformStats(statsRes.data);
        setUserStats(usersStatsRes.data);
        setEnrollmentStats(enrollmentsStatsRes.data);
        setRevenueStats(revenueStatsRes.data);
        setLatestUsers(usersRes.data.users);
        setLatestEnrollments(enrollmentsRes.data.enrollments);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [axios]);

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-2)",
    },
  }

  const revenueChartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-3)",
    },
    mobile: {
      label: "Mobile",
      color: "var(--chart-1)",
    },
  }

  const userTableColumns = [
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
      cell: ({ row }) => (
        <span className='capitalize'>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className='capitalize'>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const enrollmentTableColumns = [
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
      cell: ({ row }) =>
        row.original.completed ? (
          <span className="text-green-600 font-medium">Yes</span>
        ) : (
          <span className="text-gray-500">No</span>
        ),
    },
    {
      accessorKey: "lastAccessed",
      header: "Last Accessed",
      cell: ({ row }) =>
        row.original.lastAccessed ? (
          <span className="text-gray-700">
            {new Date(row.original.lastAccessed).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400 italic">Not yet</span>
        ),
    },
    {
      accessorKey: "enrolledAt",
      header: "Enrolled At",
      cell: ({ row }) =>
        new Date(row.original.enrolledAt).toLocaleDateString(),
    },
  ]

  const paymentTableColumns = [
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
      cell: ({ row }) => `${row.original.amount.toLocaleString("en-US", { style: "currency", currency: "INR", minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => row.original.paymentMethod || "N/A",
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.paymentStatus === "completed"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
            }`}
        >
          {row.original.paymentStatus}
        </span>
      ),
    },
    {
      accessorKey: "refund.isRefunded",
      header: "Refund",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.refund?.isRefunded
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700"
            }`}
        >
          {row.original.refund?.isRefunded ? "Refunded" : "Not Refunded"}
        </span>
      ),
    },
    {
      accessorKey: "paymentDate",
      header: "Paid At",
      cell: ({ row }) =>
        new Date(row.original.paymentDate).toLocaleDateString(),
    },
  ]


  if (loading) return <div>Loading overview...</div>;

  return (
    <section className='container mx-auto p-4'>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground mt-1">Overview of your platform</p>
      </div>
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4'>
        <Card className='p-4'>
          <CardHeader className='font-semibold'>Total Users</CardHeader>
          <CardContent className='text-2xl font-bold'>{platformStats?.totalUsers ?? 0}</CardContent>
        </Card>
        <Card className='p-4'>
          <CardHeader className='font-semibold'>Total Courses</CardHeader>
          <CardContent className='text-2xl font-bold'>{platformStats?.totalCourses ?? 0}</CardContent>
        </Card>
        <Card className='p-4'>
          <CardHeader className='font-semibold'>Total Enrollments</CardHeader>
          <CardContent className='text-2xl font-bold'>{platformStats?.totalEnrollments ?? 0}</CardContent>
        </Card>
        <Card className='p-4'>
          <CardHeader className='font-semibold'>Total Sales</CardHeader>
          <CardContent className='text-2xl font-bold'>{platformStats?.totalRevenue ?? 0}</CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Users</CardTitle>
            <ViewAllDialog
              title="Users"
              api="/admin/users"
              dataKey="users"
              defaultFilters={[{ label: "All", value: "all" }, { label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Suspended", value: "suspended" }, { label: "Rejected", value: "rejected" }]}
              columns={userTableColumns}
            />
          </CardHeader>
          <Separator />
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={userStats}
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
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="users"
                  type="natural"
                  fill="var(--color-desktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Enrollemnts</CardTitle>
            <ViewAllDialog
              title="Enrollemnts"
              api="/admin/enrollments"
              dataKey="enrollments"
              defaultFilters={[{ label: "All", value: "all" }, { label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Suspended", value: "suspended" }, { label: "Rejected", value: "rejected" }]}
              columns={enrollmentTableColumns}
            />
          </CardHeader>
          <Separator />
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={enrollmentStats}
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
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="enrollments"
                  type="natural"
                  fill="var(--color-desktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Sales</CardTitle>
            <ViewAllDialog
              title="Revenue"
              api="/admin/orders"
              dataKey="orders"
              defaultFilters={[{ label: 'Pending', value: 'pending' }, { label: 'Completed', value: 'completed' }, { label: 'Failed', value: 'failed' }, { label: 'Refunded', value: 'refunded' }, { label: 'Cancelled', value: 'cancelled' }]}
              columns={paymentTableColumns}
            />
          </CardHeader>
          <Separator />

          <CardContent>
            <ChartContainer className="h-[300px] w-full" config={revenueChartConfig}>
              <AreaChart
                accessibilityLayer
                data={revenueStats}
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
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-desktop)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-mobile)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillMobile)"
                  fillOpacity={0.4}
                  stroke="var(--color-mobile)"
                  stackId="a"
                />
                <Area
                  dataKey="average"
                  type="natural"
                  fill="url(#fillDesktop)"
                  fillOpacity={0.4}
                  stroke="var(--color-desktop)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Latest Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestUsers?.map(({ _id, fullName, profilePicture, email, role, createdAt }, idx) => (
              <Fragment key={_id}>
                <div>
                  <div className="flex items-center gap-1">
                    <Avatar className="size-10">
                      <AvatarImage src={profilePicture} />
                      <AvatarFallback className="capitalize">{fullName.at(1)}</AvatarFallback>
                    </Avatar>
                    <div className="">
                      <div className="flex gap-1">
                        <span className="text-sm">{fullName}</span>
                        <Badge variant="outline" className={cn("text-xs capitalize", role === "admin" && "bg-red-500 text-white", role === "student" && "bg-blue-500 text-white", role === "instructor" && "bg-green-500 text-white")}>{role}</Badge>
                      </div>
                      <p className="text-sm font-semibold">{email}</p>
                    </div>
                  </div>
                  <span className='text-xs text-muted-foreground'>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                </div>
                {idx !== latestUsers.length - 1 && <Separator />}
              </Fragment>
            ))}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Latest Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestEnrollments?.map(({ _id, course, user, enrolledAt, }, idx) => (
              <Fragment key={_id}>
                <div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2">
                      <img className='w-24 rounded-md shadow-md' src={course?.thumbnailImage || ""} alt={course?.title || ""} />
                      <p className='text-clip'>{course?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className='text-xs text-muted-foreground'>{formatDistanceToNow(enrolledAt, { addSuffix: true })}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Enrolled by</span>
                      <Avatar className="size-4">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback className="capitalize">{user.fullName.at(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold">
                        {user.fullName}
                      </span>
                    </div>
                  </div>
                </div>
                {idx !== latestUsers.length - 1 && <Separator />}
              </Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminOverview;
