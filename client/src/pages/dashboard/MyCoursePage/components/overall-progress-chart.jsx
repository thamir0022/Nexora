import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { TrendingUp, BookOpen, Clock, Trophy } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  courses: {
    label: "Courses",
  },
  completed: {
    label: "Completed",
    color: "#10b981", // green-500
  },
  inProgress: {
    label: "In Progress",
    color: "#3b82f6", // blue-500
  },
  notStarted: {
    label: "Not Started",
    color: "#6b7280", // gray-500
  },
}

export function OverallProgressChart({ courses }) {
  // Calculate overall statistics
  const stats = courses.reduce(
    (acc, courseData) => {
      const { progress } = courseData
      const progressPercentage =
        progress.totalLessons > 0 ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100) : 0

      if (progressPercentage === 100) {
        acc.completed += 1
      } else if (progressPercentage > 0) {
        acc.inProgress += 1
      } else {
        acc.notStarted += 1
      }

      acc.totalLessons += progress.totalLessons
      acc.completedLessons += progress.completedLessons.length

      return acc
    },
    {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      totalLessons: 0,
      completedLessons: 0,
    },
  )

  const chartData = [
    {
      status: "completed",
      courses: stats.completed,
      fill: "#10b981",
    },
    {
      status: "inProgress",
      courses: stats.inProgress,
      fill: "#3b82f6",
    },
    {
      status: "notStarted",
      courses: stats.notStarted,
      fill: "#6b7280",
    },
  ].filter((item) => item.courses > 0)

  const totalCourses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.courses, 0)
  }, [chartData])

  const overallProgress = stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0

  if (courses.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left side - Stats */}
        <div className="flex-1 space-y-6">
          {/* Statistics Cards - Left Aligned */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div>
                <div className="text-xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xl font-bold text-gray-600">{stats.notStarted}</div>
                <div className="text-sm text-gray-700">Not Started</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Chart (No Card) */}
        <div className="flex-shrink-0">
          <div className="w-full max-w-sm">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
              <p className="text-sm text-gray-600">Overall completion status</p>
            </div>

            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="courses" nameKey="status" innerRadius={50} strokeWidth={5}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                              {totalCourses}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-sm">
                              Courses
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
