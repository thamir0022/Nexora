import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, MoreHorizontal, Loader2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export default function UsersTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const axios = useAxiosPrivate();
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/admin/users");

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
  }, [])

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
            {/* Only show rating column for instructors */}
            <TableHead className="cursor-pointer" onClick={() => requestSort("rating.averageRating")}>
              <div className="flex items-center">
                Rating
                {getSortDirectionIcon("rating.averageRating")}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getSortedData().map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user.profilePicture} alt={user.fullName} className="h-8 w-8" />
                  <AvatarFallback className="h-8 w-8">{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {user.fullName}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                {user.role === "instructor" && user.rating
                  ? `${user.rating.averageRating.toFixed(1)} (${user.rating.totalReviews})`
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user._id)}>Copy ID</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                    {user.status === "active" ? (
                      <DropdownMenuItem className="text-yellow-600">Suspend User</DropdownMenuItem>
                    ) : user.status === "pending" ? (
                      <DropdownMenuItem className="text-green-600">Approve User</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-green-600">Activate User</DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
