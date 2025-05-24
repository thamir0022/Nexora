import React from "react";
import { Link } from "react-router-dom";

const BrandLogo = ({ size = 16 }) => {
  return (
    <Link
      className="inline-flex items-center gap-2 text-lg font-bold text-gray-800 drop-shadow-md hover:text-blue-600 transition md:justify-self-start"
      to="/"
    >
      <img className={`h-${size} dark:invert`} src="/logo.png" alt="Nexora Logo" />
    </Link>
  );
};

export default BrandLogo;
