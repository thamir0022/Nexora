import { useEffect } from "react";

const RightClickBlocker = () => {
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();

    const isProd = import.meta.env.VITE_ENV === "production";

    if (isProd) {
      document.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      if (isProd) {
        document.removeEventListener("contextmenu", handleContextMenu);
      }
    };
  }, []);

  return null;
};

export default RightClickBlocker;
