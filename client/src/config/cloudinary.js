import { Cloudinary } from "@cloudinary/url-gen";

// Create a Cloudinary instance and set your cloud name.
export const cld = new Cloudinary({
  cloud: {
    cloudName: "nexora",
  },
});
