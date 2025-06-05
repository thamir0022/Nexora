import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Loader2, Upload } from "lucide-react";
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function CloudinaryUploadWidget({
  onSuccess,
  onError,
  folder = "",
  publicId = "",
  resourceType = "auto",
  maxFileSize = 10000000,
  allowedFormats = [],
  clientAllowedFormats = [],
  children,
  disabled = false,
  className = "",
  variant = "modal", // "modal" | "button"
}) {
  const fileInputRef = useRef(null);
  const uploadWidgetRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // Initialize the widget (modal mode)
  useEffect(() => {
    if (variant !== "modal") return;

    const loadCloudinaryScript = () => {
      return new Promise((resolve, reject) => {
        if (window.cloudinary) return resolve(window.cloudinary);

        const script = document.createElement("script");
        script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
        script.async = true;
        script.onload = () => resolve(window.cloudinary);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initWidget = async () => {
      try {
        const cloudinary = await loadCloudinaryScript();
        uploadWidgetRef.current = cloudinary.createUploadWidget(
          {
            cloudName,
            uploadPreset,
            folder,
            publicId,
            resourceType,
            maxFileSize,
            clientAllowedFormats:
              clientAllowedFormats.length > 0
                ? clientAllowedFormats
                : allowedFormats,
            sources: ["local", "url"],
            multiple: false,
            showAdvancedOptions: false,
            showPoweredBy: false,
            theme: "minimal",
            zIndex: 999999,
          },
          (error, result) => {
            if (error) {
              console.error("Upload error:", error);
              setIsUploading(false);
              onError?.(error);
              return;
            }

            if (result?.event === "success") {
              setIsUploading(false);
              onSuccess?.(result.info);
            }

            if (result?.event === "upload-added") {
              setIsUploading(true);
            }

            if (result?.event === "close") {
              setIsUploading(false);
            }
          }
        );

        setIsWidgetReady(true);
      } catch (err) {
        console.error("Widget init failed", err);
        onError?.(err);
      }
    };

    initWidget();
  }, [variant]);

  // Manual upload (button mode)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    folder && formData.append("folder", folder);
    publicId && formData.append("public_id", publicId);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data) {
        onSuccess?.(data);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Manual upload error", err);
      onError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (variant === "modal") {
      if (
        uploadWidgetRef.current &&
        isWidgetReady &&
        !disabled &&
        !isUploading
      ) {
        uploadWidgetRef.current.open();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`cloudinary-upload-wrapper ${className}`}>
      <input
        type="file"
        accept={allowedFormats.map((f) => `.${f}`).join(",")}
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {children ? (
        <div
          onClick={handleUploadClick}
          className="cursor-pointer"
          style={{ position: "relative", zIndex: 9999 }}
        >
          {children}
        </div>
      ) : (
        <Button
          onClick={handleUploadClick}
          disabled={
            disabled || isUploading || (variant === "modal" && !isWidgetReady)
          }
          className="w-full"
          type="button"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
      )}  
    </div>
  );
}
