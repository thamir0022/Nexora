"use client"

import { useEffect, useState, useRef } from "react"
import { Tabs, TabsContent } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Send, MessageCircle, Users, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useCourseChat } from "@/hooks/useChat"
import useAxiosPrivate from "../hooks/useAxiosPrivate"
import { formatDistanceToNow } from "date-fns"
import { cn } from "../lib/utils"
import { Alert, AlertDescription } from "./ui/alert"

const CourseDiscussion = ({ courseId }) => {
  const { user } = useAuth()
  const axios = useAxiosPrivate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const messagesEndRef = useRef(null)

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const res = await axios.get(`/courses/${courseId}/messages`)
      const messagesData = res.data?.data || []
      setMessages(messagesData)
    } catch (err) {
      console.error("Failed to load messages:", err)
      setConnectionError("Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSocketMessage = (socketMessage) => {
    setConnectionError(null)

    setMessages((prevMessages) => {
      // Check if message already exists
      const messageExists = prevMessages.some((msg) => msg._id === socketMessage._id)
      if (messageExists) {
        return prevMessages
      }
      return [...prevMessages, socketMessage]
    })
  }

  const handleSocketConnection = (connected) => {
    setSocketConnected(connected)
    if (connected) {
      setConnectionError(null)
    } else {
      setConnectionError("Connection lost. Messages may not update in real-time.")
    }
  }

  const { isConnected } = useCourseChat(courseId, user?._id || "", handleNewSocketMessage, handleSocketConnection)

  useEffect(() => {
    if (courseId) {
      fetchMessages()
    }
  }, [courseId])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || !user) return

    const messageContent = newMessage.trim()
    setIsSending(true)
    setNewMessage("") // Clear input immediately for better UX

    try {
      // Send via HTTP API
      const res = await axios.post(`/courses/${courseId}/messages`, {
        content: messageContent,
      })

      // The real-time message will be handled by socket
      // If socket is not connected, add message manually as fallback
      if (!isConnected) {
        const fallbackMessage = {
          _id: res.data.data._id,
          content: messageContent,
          sender: {
            _id: user._id,
            fullName: user.fullName || user.name,
            profilePicture: user.profilePicture,
          },
          courseId: courseId,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, fallbackMessage])
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      // Restore message in input if failed
      setNewMessage(messageContent)
      setConnectionError("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const isMyMessage = (message) => {
    const senderId = message.sender?._id || message.sender
    return senderId === user?._id
  }

  const getMessageTime = (createdAt) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch {
      return "Just now"
    }
  }

  const getInitials = (name) => {
    return name[0] || "U";
  }

  const getSenderName = (message) => {
    if (isMyMessage(message)) {
      return "You"
    }
    return message.sender?.fullName || "Student"
  }

  const getSenderAvatar = (message) => {
    return message.sender?.profilePicture
  }

  return (
    <Tabs defaultValue="discussion">
      <TabsContent value="discussion" className="space-y-4">
        {/* Connection Error Alert */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Course Discussion</CardTitle>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </Badge>
            </div>
            <Separator />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="h-96 px-4">
              <div className="space-y-4 py-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No discussions yet</h3>
                    <p className="text-sm text-muted-foreground">Be the first to start a conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMyMsg = isMyMessage(msg)
                    const showAvatar = index === 0 || messages[index - 1]?.sender?._id !== msg.sender?._id
                    const senderName = getSenderName(msg)
                    const senderAvatar = getSenderAvatar(msg)

                    return (
                      <div key={msg._id || `msg-${index}`} className="w-full">
                        <div className={cn("flex gap-3", isMyMsg ? "justify-end" : "justify-start")}>
                          {/* Avatar for other users (left side) */}
                          {!isMyMsg && (
                            <div className="flex-shrink-0">
                              {showAvatar ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={senderAvatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{getInitials(senderName)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          )}

                          {/* Message Content */}
                          <div className={cn("flex flex-col max-w-[70%]", isMyMsg ? "items-end" : "items-start")}>
                            {/* Sender name and time */}
                            {showAvatar && (
                              <div
                                className={cn(
                                  "flex items-center gap-2 mb-1 text-xs",
                                  isMyMsg ? "flex-row-reverse" : "flex-row",
                                )}
                              >
                                <span className="font-medium text-foreground">{senderName}</span>
                                <span className="text-muted-foreground">{getMessageTime(msg.createdAt)}</span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2 text-sm break-words",
                                isMyMsg
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm",
                                !showAvatar && "mt-1",
                              )}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>

                          {/* Avatar for my messages (right side) */}
                          {isMyMsg && (
                            <div className="flex-shrink-0">
                              {showAvatar ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={senderAvatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(user?.fullName || user?.name || "")}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t bg-background p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Type your message..." : "Type your message (offline mode)..."}
                    disabled={isSending}
                    className="resize-none"
                  />
                </div>
                <Button type="submit" disabled={!newMessage.trim() || isSending} size="sm" className="px-3">
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default CourseDiscussion
