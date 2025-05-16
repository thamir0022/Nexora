import axios from "axios";
const CLOUDNAME = import.meta.env.VITE_CLOUDNAME;
const UPLOADPRESET = import.meta.env.VITE_UPLOADPRESET;

/**
 * Uploads a file to Cloudinary using a standardized folder structure
 * @param {File} file - File to upload
 * @param {'user' | 'courseThumbnail' | 'lessonVideo' | 'lessonThumbnail' | 'lessonNote' | 'instructorCertificate'} type - Entity type
 * @param {Object} identifiers - Related IDs/slugs
 */
export const uploadToCloudinary = async (file, type, identifiers) => {
  let folder = "";
  let publicId = "";

  switch (type) {
    case "user":
      folder = `users/${identifiers.userId}`;
      publicId = `${folder}/profile`;
      break;

    case "courseThumbnail":
      folder = `courses/${identifiers.courseSlug}`;
      publicId = `${folder}/thumbnail`;
      break;

    case "lessonVideo":
      folder = `courses/${identifiers.courseSlug}/lessons/${identifiers.lessonSlug}`;
      publicId = `${folder}/video`;
      break;

    case "lessonThumbnail":
      folder = `courses/${identifiers.courseSlug}/lessons/${identifiers.lessonSlug}`;
      publicId = `${folder}/thumbnail`;
      break;

    case "lessonNote":
      folder = `courses/${identifiers.courseSlug}/lessons/${identifiers.lessonSlug}/notes`;
      publicId = `${folder}/${identifiers.noteId}`;
      break;

    case "instructorCertificate":
      folder = `instructors/${identifiers.instructorId}/certificates`;
      publicId = `${folder}/certificate-${identifiers.certIndex || 1}`; // certificate-1.png
      break;

    default:
      throw new Error("Unknown upload type.");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDNAME}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOADPRESET);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  try {
    const res = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.secure_url;
  } catch (error) {
    console.error(
      "Cloudinary upload failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};
