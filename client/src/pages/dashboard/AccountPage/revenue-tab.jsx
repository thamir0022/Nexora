import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, BookOpen } from "lucide-react"
import { FaRubleSign } from "react-icons/fa"

export function RevenueTab({ userData }) {
  // Mock revenue data - replace with actual API data
  const revenueStats = [
    {
      label: "Total Revenue",
      value: "₹45,230",
      change: "+12.5%",
      icon: FaRubleSign,
    },
    {
      label: "This Month",
      value: "₹8,420",
      change: "+8.2%",
      icon: TrendingUp,
    },
    {
      label: "Total Students",
      value: "234",
      change: "+15.3%",
      icon: Users,
    },
    {
      label: "Active Courses",
      value: userData.courses?.length || 0,
      change: "0%",
      icon: BookOpen,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>Track your earnings and course performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {revenueStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                      {stat.change}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest earnings from course sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <p>No recent transactions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
