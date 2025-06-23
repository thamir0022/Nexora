import QRCode from "react-qr-code"
import BrandLogo from "@/components/BrandLogo"

const CertificateTemplate = ({ certificate }) => {
  const { studentName, courseName, completionDate, _id: certificateId, instructorName } = certificate
  const certificateURI = `${import.meta.env.VITE_CLIENT_BASE_URL}/certificate/${certificateId}`

  return (
    <div
      id="certificate"
      className="relative w-[1123px] h-[794px] mx-auto rounded-3xl shadow-2xl print:shadow-none"
      style={{
        backgroundImage: `url('/certificate-bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Playfair Display', serif",
      }}
    >
      {/* Brand Logo - Top Left */}
      <div className="absolute top-8 left-12 z-10">
        <BrandLogo size={16} />
      </div>

      {/* Main Content Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 py-12">
        {/* Certificate Title */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              color: "#1e3a8a",
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              letterSpacing: "2px",
            }}
          >
            CERTIFICATE
          </h1>
          <div
            className="text-2xl font-semibold tracking-widest"
            style={{
              color: "#D4AF37",
              textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            OF COMPLETION
          </div>
        </div>

        {/* Certificate Body */}
        <div className="text-center max-w-3xl">
          <p
            className="text-xl mb-6"
            style={{
              color: "#374151",
              textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            This is to certify that
          </p>

          <h2
            className="text-4xl font-bold mb-6 px-8 py-3"
            style={{
              color: "#1e3a8a",
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              borderBottom: "3px solid #D4AF37",
              letterSpacing: "1px",
            }}
          >
            {studentName}
          </h2>

          <p
            className="text-lg mb-4"
            style={{
              color: "#374151",
              textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            has successfully completed the course
          </p>

          <h3
            className="text-3xl font-semibold mb-6 px-4"
            style={{
              color: "#D4AF37",
              textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
              fontStyle: "italic",
            }}
          >
            "{courseName}"
          </h3>

          <p
            className="text-lg"
            style={{
              color: "#374151",
              textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            on{" "}
            {new Date(completionDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Signature Section - Bottom Left */}
        <div className="absolute bottom-16 left-16">
          <div className="text-center">
            {/* Signature Image */}
            <div className="mb-2">
              <img
                src="/assets/signature.png"
                alt="Signature"
                className="w-40 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = "none"
                }}
              />
            </div>

          </div>

          {/* Signature Line and Text */}
          <div className="w-40">
            <div className="border-t-2 mb-1"></div>
            <p
              className="text-sm font-medium"
              style={{
                color: "#374151",
                textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
              }}
            >
              {instructorName || "Instructor"}
            </p>
            <p
              className="text-xs"
              style={{
                color: "#6B7280",
                textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
              }}
            >
              Course Instructor
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Section - Bottom Right */}
      <div className="absolute bottom-12 right-16">
        <div className="text-center">
          <div className="p-2 rounded-lg shadow-lg mb-2">
            <QRCode
              value={certificateURI}
              size={80}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      {/* Certificate ID - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p
          className="text-xs font-mono"
          style={{
            color: "#6B7280",
            textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
            letterSpacing: "1px",
          }}
        >
          Certificate ID: {certificateId}
        </p>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 opacity-30"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 opacity-30"></div>
    </div>
  )
}

export default CertificateTemplate
