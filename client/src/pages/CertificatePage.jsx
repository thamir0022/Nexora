import { useEffect, useRef, useState } from "react";
import CertificateTemplate from "@/components/CertificateTemplate";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useReactToPrint } from "react-to-print";

const CertificatePage = () => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const { certificateId } = useParams();
  const axios = useAxiosPrivate();
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await axios.get(`/certificates/${certificateId}`);
        setCertificate(res.data.certificate);
      } catch (error) {
        console.error("Error fetching certificate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  // ✅ Correct use of useReactToPrint
  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: "certificate",
    removeAfterPrint: true,
  });

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!certificate) return <p className="text-center py-10">Certificate not found</p>;

  return (
    <div className="py-10 px-4 min-h-screen flex flex-col items-center">
      <div ref={certificateRef} id="certificate" className="mb-6">
        <CertificateTemplate certificate={certificate} />
      </div>
      <Button onClick={handlePrint}>Download as PDF</Button>
    </div>
  );
};

export default CertificatePage;
