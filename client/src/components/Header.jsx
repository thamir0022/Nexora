import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { DraftingCompass, Menu } from "lucide-react";
import { useState } from "react";
import Toggletheme from "./theme-toggle";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="w-11/12 max-w-6xl mx-auto relative top-4 px-4 py-2 md:py-4 mb-4
        border border-white/30 shadow-lg rounded-2xl
        bg-white/60 backdrop-blur-lg
        transition-all duration-300 row-span-1 col-span-full"
    >
      {/* Header Row: mobile (logo+hamburger), desktop (logo, nav, button) */}
      <div className="w-full flex items-center justify-between md:grid md:grid-cols-3 md:items-center">
        {/* Logo: always left */}
        <Link className="inline-flex items-center gap-2 text-lg font-bold text-gray-800 drop-shadow-md hover:text-blue-600 transition md:justify-self-start" to="/">
          <DraftingCompass className="w-6 h-6" />
          Start Up
        </Link>
        {/* Nav: center on md+ */}
        <nav className="hidden md:flex gap-8 items-center justify-center text-base font-medium text-gray-700 md:justify-self-center">
          <Link to="#" className="hover:text-blue-500 transition">Home</Link>
          <Link to="#" className="hover:text-blue-500 transition">Courses</Link>
          <Link to="#" className="hover:text-blue-500 transition">About</Link>
          <Toggletheme/>
        </nav>
        {/* Sign In: right on md+ */}
        <div className="hidden md:block md:justify-self-end">
          <Link to="/sign-in"><Button>Sign In</Button></Link>
        </div>
        {/* Hamburger: right on mobile only */}
        <button
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      {/* Hamburger for mobile (hidden, now inside flex row above) */}
      {/* <button
        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-7 h-7 text-gray-700" />
      </button> */}

      {/* Dropdown menu for mobile */}
      <div
        className={`md:hidden absolute top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xs
          bg-white/80 backdrop-blur-lg border border-white/30 shadow-xl rounded-xl
          px-6 py-4 flex flex-col items-center gap-4
          transition-all duration-300 ease-in-out
          ${menuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <Link to="#" className="w-full text-center py-2 rounded hover:bg-blue-100 transition">Home</Link>
        <Link to="#" className="w-full text-center py-2 rounded hover:bg-blue-100 transition">Courses</Link>
        <Link to="#" className="w-full text-center py-2 rounded hover:bg-blue-100 transition">About</Link>
        <Link to="/sign-in"><Button className="w-full">Sign In</Button></Link>
      </div>
    </header>
  );
};

export default Header;
