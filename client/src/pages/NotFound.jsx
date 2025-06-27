// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import notFoundImage from "@/assets/images/not-found.svg";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <img className="w-1/3 mx-auto" src={notFoundImage} alt="" />
      <Link to="/" className="text-blue-500 underline link">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
