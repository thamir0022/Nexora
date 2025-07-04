"use client"

import { useEffect, useRef, useState } from "react"
import socket from "../config/socket"

export const useCourseChat = (courseId, userId, onNewMessage, onConnectionChange) => {
  const [isConnected, setIsConnected] = useState(false)
  const courseRoomRef = useRef("")

  useEffect(() => {
    if (!courseId || !userId) return

    const courseRoom = `course_${courseId}`
    courseRoomRef.current = courseRoom

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect()
    }

    const handleConnect = () => {
      console.log("🔌 Socket connected:", socket.id)
      setIsConnected(true)
      onConnectionChange(true)

      // Join personal room for notifications
      socket.emit("join", userId)

      // Join the course room
      socket.emit("join_course", { courseId, userId })
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      onConnectionChange(false)
    }

    const handleNewMessage = (message) => {
      onNewMessage(message)
    }

    const handleJoinedCourse = (data) => {
      console.log(`✅ Successfully joined course ${data.courseId} with ${data.participantCount} participants`)
    }

    const handleError = (error) => {
      console.error("❌ Socket error:", error)
      onConnectionChange(false)
    }

    // Set up event listeners
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("new_course_message", handleNewMessage)
    socket.on("joined_course", handleJoinedCourse)
    socket.on("error", handleError)

    // If already connected, join the room immediately
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup function
    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("new_course_message", handleNewMessage)
      socket.off("joined_course", handleJoinedCourse)
      socket.off("error", handleError)

      // Leave the course room
      if (courseRoomRef.current) {
        socket.emit("leave_course", { courseId, userId })
      }
    }
  }, [courseId, userId, onNewMessage, onConnectionChange])

  return {
    isConnected,
  }
}
