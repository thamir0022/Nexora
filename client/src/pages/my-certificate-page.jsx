import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Award, Download, Calendar, Loader2 } from "lucide-react"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useAuth } from "@/hooks/useAuth"
import CertificateTemplate from "@/components/CertificateTemplate"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { Link } from "react-router-dom"

// Certificate Skeleton Component
const CertificateSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Individual Certificate Card Component
const CertificateCard = ({ certificate }) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Add your download logic here
      toast.success("Certificate downloaded!")
    } catch (error) {
      toast.error("Failed to download certificate")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-full flex-shrink-0">
            <Award className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{certificate.courseName}</h3>

            <p className="text-gray-600 mb-3">{certificate.studentName}</p>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar className="h-4 w-4" />
              <span>Completed on {formatDate(certificate.completionDate)}</span>
            </div>

            <Link to={`/certificate/${certificate._id}`}>
              <Button>View Certificate</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main My Certificates Page Component
const MyCertificatesPage = () => {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCertificates, setFilteredCertificates] = useState([])

  const axios = useAxiosPrivate()
  const { user } = useAuth()

  // Fetch certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?._id) return

      try {
        setLoading(true)
        const response = await axios.get(`/users/${user._id}/certificates`)

        if (response.data.success) {
          setCertificates(response.data.certificates || [])
        }
      } catch (err) {
        console.error("Failed to fetch certificates:", err)
        setError("Failed to load certificates")
        toast.error("Failed to load certificates")
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [axios, user])

  // Filter certificates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCertificates(certificates)
    } else {
      const filtered = certificates.filter(
        (cert) =>
          cert.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cert.course?.instructor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredCertificates(filtered)
    }
  }, [certificates, searchQuery])

  // Download certificate as PDF
  const handleDownloadCertificate = async (certificate) => {
    try {
      // Create a temporary div to render the certificate
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.top = "-9999px"
      document.body.appendChild(tempDiv)

      // Create certificate data
      const certificateData = {
        studentName: certificate.student?.fullName || user?.fullName || "Student Name",
        courseName: certificate.course?.title || "Course Title",
        completionDate: certificate.completionDate,
        certificateId: certificate._id,
        instructorName: certificate.course?.instructor?.fullName || "Instructor",
      }

      // Render certificate template
      const { createRoot } = await import("react-dom/client")
      const root = createRoot(tempDiv)

      await new Promise((resolve) => {
        root.render(
          <div>
            <CertificateTemplate certificate={certificateData} />
          </div>,
        )
        setTimeout(resolve, 1000) // Wait for rendering
      })

      // Generate PDF
      const certificateElement = tempDiv.querySelector("#certificate")
      if (!certificateElement) {
        throw new Error("Certificate element not found")
      }

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 297 // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${certificateData.courseName}-Certificate.pdf`)

      // Cleanup
      document.body.removeChild(tempDiv)
      toast.success("Certificate downloaded successfully!")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Failed to download certificate. Please try again.")
    }
  }

  // Share certificate
  const handleShareCertificate = async (certificate) => {
    try {
      const shareUrl = `${window.location.origin}/certificate/${certificate._id}`

      if (navigator.share) {
        await navigator.share({
          title: `${certificate.course?.title} Certificate`,
          text: `Check out my certificate for completing ${certificate.course?.title}!`,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Certificate link copied to clipboard!")
      }
    } catch (error) {
      console.error("Share failed:", error)
      toast.error("Failed to share certificate")
    }
  }

  // Retry loading certificates
  const handleRetry = () => {
    setError(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Certificates</h1>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <CertificateSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        ) : certificates.length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600">Complete courses to earn your first certificate!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate._id} certificate={certificate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCertificatesPage
