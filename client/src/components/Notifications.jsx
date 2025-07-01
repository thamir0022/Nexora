"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import socket from "@/config/socket"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { CiBellOn, CiCircleCheck, CiTrash } from "react-icons/ci"
import { Button } from "./ui/button"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "./ui/skeleton"
import { ScrollArea } from "./ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { cn } from "@/lib/utils"
import noNotifications from "@/assets/images/no-notifications.svg"

const Notifications = () => {
  // State management
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [filter, setFilter] = useState("unread")
  const [isOpen, setIsOpen] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)

  // Hooks
  const { user } = useAuth()
  const axios = useAxiosPrivate()

  // Fetch notifications data
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return

    setLoading(true)
    try {
      const res = await axios.get(`/notifications?filter=${filter}`)
      if (res.data.success) {
        setNotifications(res.data.notifications)

        // Calculate unread count from all notifications (not just filtered ones)
        if (filter === "unread") {
          setUnreadCount(res.data.notifications.length)
        } else {
          // If showing all, we need to get unread count separately
          const unreadRes = await axios.get(`/notifications?filter=unread`)
          if (unreadRes.data.success) {
            setUnreadCount(unreadRes.data.notifications.length)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [user?._id, axios, filter])

  // Handle dropdown open change - fetch data when opened
  const handleOpenChange = useCallback(
    (open) => {
      setIsOpen(open)

      if (open && (!hasInitialFetch || filter !== "unread")) {
        fetchNotifications().then(() => {
          setHasInitialFetch(true)
        })
      }
    },
    [hasInitialFetch, filter, fetchNotifications],
  )

  // Handle filter change - refetch data when filter changes
  const handleFilterChange = useCallback(
    (newFilter) => {
      if (newFilter && newFilter !== filter) {
        setFilter(newFilter)
        // Fetch data immediately when filter changes
        setLoading(true)
        setTimeout(() => {
          fetchNotifications()
        }, 0)
      }
    },
    [filter, fetchNotifications],
  )

  // Mark single notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      try {
        await axios.patch(`/notifications/${notificationId}/mark-as-read`)

        // Update local state
        setNotifications((prev) => {
          if (filter === "unread") {
            // Remove from unread list
            return prev.filter((notification) => notification._id !== notificationId)
          } else {
            // Mark as read in all list
            return prev.map((notification) =>
              notification._id === notificationId ? { ...notification, isRead: true } : notification,
            )
          }
        })

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    },
    [axios, filter],
  )

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await axios.post(`/notifications/mark-all-as-read`)

      if (filter === "unread") {
        setNotifications([])
      } else {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
      }

      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [axios, filter])

  // Delete notification
  const handleDeleteNotification = useCallback(
    async (notificationId) => {
      try {
        await axios.delete(`/notifications/${notificationId}`)

        setNotifications((prev) => {
          const notification = prev.find((n) => n._id === notificationId)
          const updatedNotifications = prev.filter((n) => n._id !== notificationId)

          // If deleted notification was unread, decrease unread count
          if (notification && !notification.isRead) {
            setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
          }

          return updatedNotifications
        })
      } catch (error) {
        console.error("Error deleting notification:", error)
      }
    },
    [axios],
  )

  // Socket connection and real-time notifications
  useEffect(() => {
    if (!user?._id) return

    if (!socket.connected) {
      socket.connect()
    }

    socket.emit("join", user._id)

    const handleNewNotification = (data) => {
      // Add new notification to the list if showing unread or all
      setNotifications((prev) => {
        // Only add if it matches current filter
        if (filter === "unread" && !data.isRead) {
          return [data, ...prev]
        } else if (filter === "all") {
          return [data, ...prev]
        }
        return prev
      })

      // Always increment unread count for new notifications
      if (!data.isRead) {
        setUnreadCount((prev) => prev + 1)
      }

      // Show alert for new notifications
      setShowAlert(true)
    }

    socket.on("new_notification", handleNewNotification)

    return () => {
      socket.off("new_notification", handleNewNotification)
    }
  }, [user?._id, filter])

  // Reset data when user changes
  useEffect(() => {
    if (!user?._id) {
      setHasInitialFetch(false)
      setNotifications([])
      setUnreadCount(0)
      setFilter("unread")
    }
  }, [user?._id])

  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showAlert])

  // Render notification item
  const renderNotificationItem = useCallback(
    (notification, index) => {
      const { _id, message, isRead, createdAt } = notification

      return (
        <div className="min-h-16" key={_id}>
          <DropdownMenuLabel className="flex gap-2 items-center justify-between hover:bg-accent rounded-md mr-2">
            {!isRead && <span className="size-1 bg-primary rounded-full flex-shrink-0" />}

            <div className="flex-1 min-w-0">
              <p className={cn("font-medium capitalize text-sm", isRead && "text-muted-foreground")}>{message}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>

            <div className="flex-shrink-0">
              {isRead ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotification(_id)
                  }}
                >
                  <CiTrash className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkAsRead(_id)
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-green-500 hover:bg-green-50"
                >
                  <CiCircleCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DropdownMenuLabel>

          {index < notifications.length - 1 && <DropdownMenuSeparator />}
        </div>
      )
    },
    [handleMarkAsRead, handleDeleteNotification],
  )

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      <DropdownMenuLabel>
        <Skeleton className="h-6 w-full" />
      </DropdownMenuLabel>
      <div className="flex justify-between items-center px-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded-full" />
      </div>
      <DropdownMenuSeparator />
      <div className="space-y-2 p-2">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </>
  )

  // Render empty state
  const renderEmptyState = () => (
    <DropdownMenuLabel className="flex flex-col items-center justify-center h-64">
      <img src={noNotifications || "/placeholder.svg"} alt="No Notifications" className="w-24 h-24" />
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {filter === "unread" ? "No unread notifications!" : "No notifications found!"}
      </p>
    </DropdownMenuLabel>
  )

  // Render header
  const renderHeader = () => (
    <>
      <DropdownMenuLabel className="text-center">
        {filter === "unread"
          ? `${notifications.length > 0 ? `${notifications.length} Unread` : "No Notifications"}`
          : "All Notifications"}
      </DropdownMenuLabel>

      <div className="flex justify-between items-center px-2">
        <ToggleGroup
          value={filter}
          onValueChange={handleFilterChange}
          size="sm"
          type="single"
          variant="outline"
          className="h-8"
        >
          <ToggleGroupItem value="unread" className="text-xs px-2 py-1 h-6">
            Unread
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="text-xs px-2 py-1 h-6">
            All
          </ToggleGroupItem>
        </ToggleGroup>

        {notifications.length > 0 && filter === "unread" && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-green-500 hover:bg-green-50"
            title="Mark all as read"
          >
            <CiCircleCheck className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  )

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
            <CiBellOn className="size-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="end">
          {loading ? (
            renderLoadingSkeleton()
          ) : (
            <>
              {renderHeader()}
              <DropdownMenuSeparator />

              <ScrollArea className="h-64">
                {notifications.length > 0 ? (
                  <div className="p-1">{notifications.map(renderNotificationItem)}</div>
                ) : (
                  renderEmptyState()
                )}
              </ScrollArea>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Alert */}
      {showAlert && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap animate-in fade-in-0 slide-in-from-top-2 duration-300">
            New Notification
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
