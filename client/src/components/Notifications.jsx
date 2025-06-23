import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import socket from "@/config/socket"
import { useState } from "react"
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
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [totalNotifications, setTotalNotifications] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [filter, setFilter] = useState("unread")
  const axios = useAxiosPrivate()

  useEffect(() => {
    const getNotifications = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`/notifications?filter=${filter}`)
        if (res.data.success) {
          setNotifications(res.data.notifications)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }
    getNotifications()

    const unreadNotifications = notifications.reduce((acc, cur) => acc + Number(!cur.isRead), 0);
    setTotalNotifications(unreadNotifications)
  }, [filter]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/mark-as-read`)
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`/notifications/mark-all-as-read`)
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/notifications/${notificationId}`)
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  useEffect(() => {
    if (!user?._id) return

    if (!socket.connected) {
      socket.connect()
    }

    socket.emit("join", user._id)

    socket.on("new_notification", (data) => {
      setNotifications((prev) => [data, ...prev])
      // Show alert when new notification arrives
      setShowAlert(true)
    })

    return () => {
      socket.off("new_notification")
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

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
            <CiBellOn className="size-7" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalNotifications}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          {loading ? (
            <>
              <DropdownMenuLabel>
                <Skeleton className="h-6 w-full" />
              </DropdownMenuLabel>
              <div className="flex justify-between items-center px-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4 rounded-full" />
              </div>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-center">{filter === "unread" ? `${notifications.length > 0 ? `${notifications.length} Notifications` : "No Notifications"}` : "All Notifications"}</DropdownMenuLabel>
              <div className="flex justify-between items-center">
                <ToggleGroup value={filter} onValueChange={setFilter} size="xs" type="single" variant="outline" className="w-24">
                  <ToggleGroupItem size="xs" value="unread" className="text-xs py-1">Unread</ToggleGroupItem>
                  <ToggleGroupItem size="xs" value="all" className="text-xs py-1">All</ToggleGroupItem>
                </ToggleGroup>
                {notifications.length > 0 && (
                  <Button
                    onClick={() => handleMarkAllAsRead()}
                    variant="ghost"
                    size="icon">
                    <CiCircleCheck />
                  </Button>
                )}
              </div>
            </>
          )}
          <DropdownMenuSeparator />
          <ScrollArea className="h-64">
            {loading
              ? [...Array(4)].map((_, index) => (
                <DropdownMenuLabel className="space-y-2" key={index}>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </DropdownMenuLabel>
              ))
              : notifications.length > 0 ? (
                notifications.map(({ _id, message, isRead, createdAt }, index) => (
                  <div className="min-h-16" key={_id}>
                    <DropdownMenuLabel
                      className="flex gap-2 items-center justify-between hover:bg-accent rounded-md mr-2"
                      key={_id}
                    >
                      {!isRead && <span className="size-1 bg-primary rounded-full"></span>}
                      <div className="flex-1">
                        <p className={cn("font-medium capitalize", isRead && "text-muted-foreground")}>{message}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {isRead ?
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:text-red-500"
                          onClick={() => handleDeleteNotification(_id)}
                        >
                          <CiTrash />
                        </Button> :
                        <Button
                          onClick={() => handleMarkAsRead(_id)}
                          variant="ghost"
                          size="icon">
                          <CiCircleCheck />
                        </Button>}
                    </DropdownMenuLabel>
                    {index < notifications.length - 1 && <DropdownMenuSeparator />}
                  </div>
                ))
              ) : (
                <DropdownMenuLabel className="flex flex-col items-center justify-center h-64">
                  <img src={noNotifications} alt="No Notifications" className="w-24 h-24" />
                  <p className="text-center text-muted-foreground mt-2">No notifications found!</p>
                </DropdownMenuLabel>
              )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Alert */}
      {showAlert && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg text-sm font-medium whitespace-nowrap animate-in fade-in-0 slide-in-from-top-2 duration-300">
            New Notification
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
