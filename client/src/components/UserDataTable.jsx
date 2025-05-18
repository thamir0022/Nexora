"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Wallet,
  CheckCircle,
  XCircle,
  User,
  Edit,
  Save,
  X,
} from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"

export default function UsersTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)
  const axios = useAxiosPrivate()
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/admin/users")

        if (response.data.status === "success") {
          setUsers(response.data.users)
        } else {
          setError(response.data.message || "Failed to fetch users")
        }
      } catch (error) {
        setError(error.response?.data?.message || "An error occurred while fetching users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [axios])

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      setLoadingUserDetails(true)
      const response = await axios.get(`/users/${userId}`)

      if (response.data.success) {
        setSelectedUser(response.data.user)
        setUserDetailsOpen(true)
      } else {
        console.error("Failed to fetch user details:", response.data.message)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
    } finally {
      setLoadingUserDetails(false)
    }
  }

  // Handle row click
  const handleRowClick = (user) => {
    fetchUserDetails(user._id)
  }

  // Sort function
  const requestSort = (key) => {
    let direction = "asc"

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
  }

  // Get sorted data
  const getSortedData = () => {
    if (!users.length) return []

    const sortableUsers = [...users]

    sortableUsers.sort((a, b) => {
      // Handle nested properties like rating.averageRating
      if (sortConfig.key.includes(".")) {
        const keys = sortConfig.key.split(".")
        let aValue = a
        let bValue = b

        for (const key of keys) {
          aValue = aValue?.[key] ?? null
          bValue = bValue?.[key] ?? null
        }

        if (aValue === null && bValue === null) return 0
        if (aValue === null) return sortConfig.direction === "asc" ? -1 : 1
        if (bValue === null) return sortConfig.direction === "asc" ? 1 : -1

        return sortConfig.direction === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1
      }

      // Handle dates
      if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
        const dateA = new Date(a[sortConfig.key])
        const dateB = new Date(b[sortConfig.key])

        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
      }

      // Handle regular properties
      if (a[sortConfig.key] === null && b[sortConfig.key] === null) return 0
      if (a[sortConfig.key] === null) return sortConfig.direction === "asc" ? -1 : 1
      if (b[sortConfig.key] === null) return sortConfig.direction === "asc" ? 1 : -1

      return sortConfig.direction === "asc"
        ? a[sortConfig.key] > b[sortConfig.key]
          ? 1
          : -1
        : a[sortConfig.key] < b[sortConfig.key]
          ? 1
          : -1
    })

    return sortableUsers
  }

  // Get sort direction icon
  const getSortDirectionIcon = (key) => {
    if (sortConfig.key !== key) return null

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    )
  }

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case "suspended":
        return <Badge className="bg-red-500 hover:bg-red-600">Suspended</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>
    }
  }

  // Get role badge color
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>
      case "instructor":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Instructor</Badge>
      case "student":
        return <Badge className="bg-teal-500 hover:bg-teal-600">Student</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{role}</Badge>
    }
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  // Handle edit button click
  const handleEditClick = () => {
    setEditedUser({ ...selectedUser })
    setIsEditing(true)
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedUser(null)
    setIsEditing(false)
  }

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle status change
  const handleStatusChange = (value) => {
    setEditedUser((prev) => ({
      ...prev,
      status: value,
    }))
  }

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)

      // Make API request to update user
      const response = await axios.patch(`/users/${selectedUser._id}`, editedUser)

      if (response.data.success) {
        // Update the selected user with the edited data
        setSelectedUser(response.data.user || editedUser)

        // Update the user in the users list
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user._id === selectedUser._id ? { ...user, ...editedUser } : user)),
        )

        toast.success("User updated successfully")
        setIsEditing(false)
      } else {
        toast.error(response.data.message || "Failed to update user")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while updating user")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    )
  }

  if (!users.length) {
    return <div className="flex justify-center items-center h-64 text-gray-500">No users found</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => requestSort("fullName")}>
                <div className="flex items-center">
                  Name
                  {getSortDirectionIcon("fullName")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort("email")}>
                <div className="flex items-center">
                  Email
                  {getSortDirectionIcon("email")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort("role")}>
                <div className="flex items-center">
                  Role
                  {getSortDirectionIcon("role")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort("status")}>
                <div className="flex items-center">
                  Status
                  {getSortDirectionIcon("status")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort("createdAt")}>
                <div className="flex items-center">
                  Joined
                  {getSortDirectionIcon("createdAt")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedData().map((user) => (
              <TableRow
                key={user._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(user)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.fullName} />
                      <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.fullName}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the selected user.</DialogDescription>
          </DialogHeader>

          {loadingUserDetails ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading user details...</span>
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profilePicture || "/placeholder.svg"} alt={selectedUser.fullName} />
                  <AvatarFallback className="text-lg">{selectedUser.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  {isEditing ? (
                    <Input
                      name="fullName"
                      value={editedUser.fullName}
                      onChange={handleInputChange}
                      className="font-semibold text-xl h-9"
                    />
                  ) : (
                    <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {!isEditing && getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Status Toggle Group (only visible in edit mode) */}
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status">User Status</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    id="status"
                    value={editedUser.status}
                    onValueChange={(value) => value && handleStatusChange(value)}
                    className="justify-start w-1/2"
                  >
                    <ToggleGroupItem value="active" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Active
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pending" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      Pending
                    </ToggleGroupItem>
                    <ToggleGroupItem value="suspended" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      Suspend
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              <Separator />

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email:</span>
                    {isEditing ? (
                      <Input
                        name="email"
                        value={editedUser.email}
                        onChange={handleInputChange}
                        className="h-7 text-sm"
                      />
                    ) : (
                      <span className="text-sm">{selectedUser.email}</span>
                    )}
                    {selectedUser.emailVerified && (
                      <CheckCircle className="h-4 w-4 text-green-500" title="Email verified" />
                    )}
                  </div>

                  {(selectedUser.mobile || isEditing) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Mobile:</span>
                      {isEditing ? (
                        <Input
                          name="mobile"
                          value={editedUser.mobile || ""}
                          onChange={handleInputChange}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <span className="text-sm">{selectedUser.mobile}</span>
                      )}
                      {selectedUser.mobileVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" title="Mobile verified" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" title="Mobile not verified" />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Joined:</span>
                    <span className="text-sm">{formatDate(selectedUser.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Updated:</span>
                    <span className="text-sm">{formatDate(selectedUser.updatedAt)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedUser.wallet && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Wallet Balance:</span>
                      <span className="text-sm">${selectedUser.wallet.balance.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">User Type:</span>
                    <span className="text-sm">
                      {selectedUser.isStudent && "Student"}
                      {selectedUser.isInstructor && (selectedUser.isStudent ? " & Instructor" : "Instructor")}
                      {!selectedUser.isStudent && !selectedUser.isInstructor && "Admin"}
                    </span>
                  </div>

                  {selectedUser.role === "student" && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Enrolled Courses:</span>
                      <span className="text-sm">{selectedUser.enrolledCourses?.length || 0}</span>
                    </div>
                  )}

                  {selectedUser.role === "instructor" && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Created Courses:</span>
                      <span className="text-sm">{selectedUser.courses?.length || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enrolled Courses Card */}
                {selectedUser.role === "student" && selectedUser.enrolledCourses && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {selectedUser.enrolledCourses.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {selectedUser.enrolledCourses.map((course, index) => (
                            <li key={index}>{course.title || "Unnamed Course"}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No enrolled courses</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Created Courses Card */}
                {selectedUser.role === "instructor" && selectedUser.courses && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Created Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {selectedUser.courses.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {selectedUser.courses.map((course, index) => (
                            <li key={index}>{course.title || "Unnamed Course"}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No created courses</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Wallet History Card */}
                {selectedUser.wallet && selectedUser.wallet.history && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Wallet History</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {selectedUser.wallet.history.length > 0 ? (
                        <ul className="text-sm space-y-1">
                          {selectedUser.wallet.history.map((transaction, index) => (
                            <li key={index}>
                              {transaction.type}: ${transaction.amount} - {formatDate(transaction.date)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No transaction history</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* User ID */}
              <div className="text-xs text-muted-foreground">
                User ID: <span className="font-mono">{selectedUser._id}</span>
              </div>

              {/* Edit/Save Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" /> Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-1" /> Edit User
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-12 text-muted-foreground">
              No user details available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
