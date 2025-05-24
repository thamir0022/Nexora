import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { format } from "date-fns"
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Loader2,
  Check,
  X,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Globe,
  Linkedin,
  Github,
  Twitter,
  LinkIcon,
} from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const InstructorRequestDetail = () => {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { userId } = useParams()
  const axios = useAxiosPrivate()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchInstructorRequest = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/instructors/requests/${userId}`)

        if (!res.data?.success) {
          const message = res.data?.message || "Something went wrong"
          toast.error(message)
          setError(message)
          return
        }

        setRequest(res.data.request)
      } catch (error) {
        console.error(error)
        const message = error.response?.data?.message || "Something went wrong"
        toast.error(message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchInstructorRequest()
  }, [userId, axios])

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM dd, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("")
  }

  // Get social icon based on platform
  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      case "github":
        return <Github className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  // Handle approve instructor
  const handleApproveInstructor = async () => {
    try {
      setIsProcessing(true)
      const res = await axios.patch(`/instructors/${userId}/approve`)
      toast.success("Instructor approved successfully");      
      if(res.data.success)
      navigate(-1)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve instructor")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle reject instructor
  const handleRejectInstructor = async () => {
      try {
      setIsProcessing(true)
      const res = await axios.patch(`/instructors/${userId}/reject`)
      toast.success(res.data.message);      
      if(res.data.success)
      navigate(-1)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve instructor")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/instructors/requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Instructor Request</h1>
        </div>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Instructor Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!request) return null

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Instructor Request</h1>
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <Badge className="px-3 py-1 text-base">
          {request.status === "pending" ? "Pending Review" : request.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Personal Information */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="size-28 mb-3">
                  <AvatarFallback className="text-xl">
                    {getInitials(request.fullName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{request.fullName}</h2>
                <Badge variant="outline" className="mt-1">
                  {request.role}
                </Badge>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.email}</span>
                  {request.emailVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.mobile}</span>
                  {request.mobileVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Applied on {formatDate(request.createdAt)}</span>
                </div>
              </div>

              <Separator />

              {/* Portfolio & Social Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Portfolio & Social Links</h3>

                {request.portfolioLink && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <a
                      href={request.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Portfolio
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </div>
                )}

                {request.socialLinks && request.socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {request.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        {getSocialIcon(link.platform)}
                        <span>{link.platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleApproveInstructor}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Approve Instructor
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleRejectInstructor}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" /> Reject Request
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right column - Qualifications and Experience */}
        <div className="md:col-span-2">
          {/* Experience Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Experience Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {request.experienceSummary || "No experience summary provided"}
              </p>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.qualifications && request.qualifications.length > 0 ? (
                <div className="space-y-6">
                  {request.qualifications.map((qualification, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{qualification.degree}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCertificate(qualification.certificateURL)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Qualifications Submitted</h3>
                  <p className="text-muted-foreground">This instructor hasn't submitted any qualifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Certificate Viewer Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificate</DialogTitle>
            <DialogDescription>Review the instructor's certificate</DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-[60vh] overflow-hidden rounded-md border">
            <img
              src={selectedCertificate || "/placeholder.svg"}
              alt="Certificate"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCertificate(null)}>
              Close
            </Button>
            <Button asChild>
              <a href={selectedCertificate} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InstructorRequestDetail
