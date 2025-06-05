import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ShieldCheck, Mail } from "lucide-react"

export function ProfileTab({ userData }) {
  const stats = [
    {
      label: userData.role === "student" ? "Enrolled Courses" : "Created Courses",
      value: userData.role === "student" ? userData.enrolledCourses?.length || 0 : userData.courses?.length || 0,
      icon: BookOpen,
    },
    {
      label: "Account Status",
      value: (
        <Badge variant={userData.status === "active" ? "default" : "secondary"} className="capitalize">
          {userData.status}
        </Badge>
      ),
      icon: ShieldCheck,
    },
    {
      label: "Email Status",
      value: (
        <Badge variant={userData.emailVerified ? "default" : "secondary"}>
          {userData.emailVerified ? "Verified" : "Unverified"}
        </Badge>
      ),
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bio Section */}
      {userData.role === "instructor" && userData.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Professional bio and introduction</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{userData.bio}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
