import { Cloudinary } from "@cloudinary/url-gen";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Initialize Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName,
  },
});

// Upload configuration
export const uploadConfig = {
  cloudName,
  uploadPreset,
};
