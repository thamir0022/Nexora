import axios from "@/config/axios";

const UPLOAD_CONFIG = {
  userProfilePhoto: ({ userId }) => `users/${userId}/profile`,
  courseThumbnail: ({ courseSlug }) => `courses/${courseSlug}/thumbnail`,
  lessonVideo: ({ courseSlug, lessonSlug }) => `courses/${courseSlug}/lessons/${lessonSlug}/video`,
  lessonThumbnail: ({ courseSlug, lessonSlug }) => `courses/${courseSlug}/lessons/${lessonSlug}/thumbnail`,
  lessonNote: ({ courseSlug, lessonSlug, noteId }) => `courses/${courseSlug}/lessons/${lessonSlug}/notes/${noteId}`,
  instructorCertificate: ({ instructorId, certIndex = 1 }) => `instructors/${instructorId}/certificates/certificate-${certIndex}`,
};

/**
 * Uploads a file to Cloudinary with overwrite using signature from backend
 * @param {File} file - File to upload
 * @param {'userProfilePhoto' | 'courseThumbnail' | 'lessonVideo' | 'lessonThumbnail' | 'lessonNote' | 'instructorCertificate'} type
 * @param {Object} identifiers - Related IDs or slugs
 */
export const uploadToCloudinary = async (file, type, identifiers) => {
  const getPublicId = UPLOAD_CONFIG[type];
  if (!getPublicId) throw new Error("Unknown upload type.");

  const publicId = getPublicId(identifiers);

  // Get signature from backend
  const signatureRes = await axios.get('/cloudinary/signature', {
    params: {
      public_id: publicId,
    },
  });

  const { signature, timestamp, apiKey, cloudName } = signatureRes.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("overwrite", "true"); // explicitly request overwrite

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  try {
    const { data } = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.response?.data || error.message);
    throw error;
  }
};
