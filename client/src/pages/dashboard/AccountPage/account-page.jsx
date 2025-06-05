import { useAuth } from "@/hooks/useAuth"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ProfileTab } from "./profile-tab"
import { SecurityTab } from "./security-tab"
import { QualificationsTab } from "./qualifications-tab"
import { EnrolledCoursesTab } from "./enrolled-courses-tab"
import { MyCoursesTab } from "./my-courses-tab"
import { RevenueTab } from "./revenue-tab"
import { EditProfileDialog } from "./edit-profile-dialog"

import {
  CalendarDays,
  Mail,
  Phone,
  Wallet,
  BookOpen,
  User,
  ShieldCheck,
  Edit,
  GraduationCap,
  TrendingUp,
} from "lucide-react"
import { CiCalendar, CiEdit, CiMail, CiPhone, CiUser, CiWallet } from "react-icons/ci"

const AccountPage = () => {
  const [userData, setUserData] = useState(null)
  const [qualifications, setQualifications] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { user } = useAuth()
  const axios = useAxiosPrivate()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, qualResponse] = await Promise.all([
          axios.get(`/users/${user._id}`),
          user.role === "instructor"
            ? axios.get(`/instructors/qualifications/${user._id}`).catch(() => null)
            : Promise.resolve(null),
        ])

        if (!userResponse.data.success) {
          toast.error(userResponse.data.message)
          return
        }
        setUserData(userResponse.data.user)

        if (qualResponse?.data?.success) {
          setQualifications(qualResponse.data.qualifications)
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch user data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [user._id, user.role])

  const formatDate = (dateString) => {
    return dateString ? format(new Date(dateString), "MMM d, yyyy") : "N/A"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl text-center">
        <p className="text-muted-foreground">No user data available</p>
      </div>
    )
  }

  return (
    <section className="container mx-auto py-8 px-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={userData.profilePicture || "/placeholder.svg"} alt={userData.fullName} />
              <AvatarFallback className="text-2xl">{userData.fullName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{userData.fullName}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-2">
                    <CiUser className="size-4!" />
                    <span className="capitalize">{userData.role}</span>
                    <Badge variant={userData.status === "active" ? "outline" : "secondary"} className="ml-2 capitalize">
                      {userData.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {userData.role === "student" && (
                    <Badge variant="outline" className="flex items-center gap-2 px-3 py-2">
                      <CiWallet className="size-5!" />₹{userData.wallet?.balance?.toFixed(2) || "0.00"}
                    </Badge>
                  )}
                  <Button onClick={() => setIsEditDialogOpen(true)} size="sm" className="flex-1">
                    Edit Profile
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <CiMail className="size-4! text-muted-foreground" />
                  <span>{userData.email}</span>
                  {userData.emailVerified && <Badge variant="outline">Verified</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <CiPhone className="size-4! text-muted-foreground" />
                  <span>{userData.mobile || "Not provided"}</span>
                  {userData.mobileVerified && <Badge variant="outline">Verified</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <CiCalendar className="size-4! text-muted-foreground" />
                  <span>Joined {formatDate(userData.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full flex h-11">
          <TabsTrigger value="profile" className="flex-1">
            <CiUser className="h-4 w-4" />
            Profile 
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1">
            <ShieldCheck className="h-4 w-4" />
            Security
          </TabsTrigger>
          {userData.role === "student" && (
            <TabsTrigger value="courses" className="flex-1">
              <BookOpen className="h-4 w-4" />
              My Courses
            </TabsTrigger>
          )}
          {userData.role === "instructor" && (
            <>
              <TabsTrigger value="qualifications" className="flex-1">
                <GraduationCap className="h-4 w-4" />
                Qualifications
              </TabsTrigger>
              <TabsTrigger value="my-courses" className="flex-1">
                <BookOpen className="h-4 w-4" />
                My Courses
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex-1">
                <TrendingUp className="h-4 w-4" />
                Revenue
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab userData={userData} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab userData={userData} />
        </TabsContent>

        {userData.role === "student" && (
          <TabsContent value="courses">
            <EnrolledCoursesTab userData={userData} />
          </TabsContent>
        )}

        {userData.role === "instructor" && (
          <>
            <TabsContent value="qualifications">
              <QualificationsTab
                qualifications={qualifications}
                setQualifications={setQualifications}
                userId={userData._id}
              />
            </TabsContent>
            <TabsContent value="my-courses">
              <MyCoursesTab userData={userData} />
            </TabsContent>
            <TabsContent value="revenue">
              <RevenueTab userData={userData} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        userData={userData}
        setUserData={setUserData}
      />
    </section>
  )
}

export default AccountPage
