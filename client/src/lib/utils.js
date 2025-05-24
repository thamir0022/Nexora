import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")        // Replace spaces and underscores with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-");        // Replace multiple - with single -
};


export const formatDuration = (seconds) => {
  if (typeof seconds !== "number" || seconds < 0) return "0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const hDisplay = hours > 0 ? `${hours}h` : "";
  const mDisplay = `${minutes}m`;

  return [hDisplay, mDisplay].filter(Boolean).join(" ");
};
