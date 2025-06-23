import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Menu, X, User, Home, BookOpen, LogOut } from 'lucide-react';
import BrandLogo from "./BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/config/axios";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDebounce } from "use-debounce";
import CartButton from "./CartSheetButton";
import AccountDropDown from "./AccountDropDown";
import { CiHeart, CiSearch } from "react-icons/ci";
import WishlistButton from "./WishlistButton";
import Notifications from "./Notifications";

const Header = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search results when debounced search text changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearchText.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Updated API route to /courses/all
        const res = await axios.get(`/courses/all?query=${debouncedSearchText}&limit=5`);
        if (res.data.success) {
          setSearchResults(res.data.courses || []);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchText]);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    if (!e.target.value.trim()) {
      setShowDropdown(false);
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleCourseClick = (courseId) => {
    setShowDropdown(false);
    setSearchText("");
    navigate(`/courses/${courseId}`);
  };

  const handleSearchAllClick = () => {
    setShowDropdown(false);
    navigate(`/courses?q=${encodeURIComponent(searchText)}`);
  };

  return (
    <header
      className="w-11/12 max-w-7xl mx-auto relative top-4 px-4 py-3 md:py-4 
      border border-white/20 dark:border-white/10 shadow-lg rounded-2xl
      bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl
      transition-all duration-300 row-span-1 col-span-full z-50"
    >
      <div className="w-full flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <BrandLogo size={12} />
        </div>

        {/* Desktop Search */}
        <div className="hidden md:block flex-grow max-w-xl" ref={searchRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <CiSearch className="size-6 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search courses..."
              className="pl-12 pr-12 py-6 h-12 text-base border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-white/80 dark:bg-gray-800/80"
              value={searchText}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0 || searchText) {
                  setShowDropdown(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchText.trim()) {
                  handleSearchAllClick();
                }
              }}
            />
            {searchText && (
              <div className="z-50 absolute inset-y-0 right-0 flex items-center pr-4">
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <button
                    onClick={handleClearSearch}
                    className="text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Search Results Dropdown */}
            {showDropdown && searchText && (
              <div className="absolute z-[1000] w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-[70vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Searching...
                  </div>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <ul className="py-2">
                        {searchResults.map((course) => (
                          <li key={course._id}>
                            <button
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors"
                              onClick={() => handleCourseClick(course._id)}
                            >
                              <div className="flex-shrink-0 w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <img
                                  src={
                                    course.thumbnailImage ||
                                    "/placeholder.svg?height=56&width=56"
                                   || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "/placeholder.svg?height=56&width=56";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1 dark:text-white">
                                  {course.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {course.instructor?.fullName ||
                                    "Unknown Instructor"}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {course.category?.slice(0, 2).map((cat) => (
                                    <span
                                      key={cat._id}
                                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded-full dark:text-gray-200"
                                    >
                                      {cat.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Search All Link - Always show when there's search text */}
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleSearchAllClick}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <CiSearch className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          Search "{searchText}" in all courses
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-5">
              <Notifications/>
              {user.role === "student" && (
                <>
                  <WishlistButton />
                  <CartButton />
                </>
              )}
              <AccountDropDown user={user} setUser={setUser} />
            </div>
          ) : (
            <Link to="/sign-in">
              <Button className="px-6">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85%] sm:w-[385px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-white/20 dark:border-white/10"
            >
              <div className="h-full flex flex-col">
                {/* Mobile Search */}
                <div className="py-6" ref={searchRef}>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <CiSearch className="size-6 text-muted-foreground" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search courses..."
                      className="pl-12 pr-12 py-6 h-12 text-base border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-white/80 dark:bg-gray-800/80"
                      value={searchText}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (searchResults.length > 0 || searchText) {
                          setShowDropdown(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchText.trim()) {
                          handleSearchAllClick();
                        }
                      }}
                    />
                    {searchText && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        {isSearching ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <button
                            onClick={handleClearSearch}
                            className="text-muted-foreground hover:text-foreground focus:outline-none"
                            aria-label="Clear search"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mobile Search Results Dropdown */}
                    {showDropdown && searchText && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-[50vh] overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Searching...
                          </div>
                        ) : (
                          <>
                            {searchResults.length > 0 && (
                              <ul className="py-2">
                                {searchResults.map((course) => (
                                  <li key={course._id}>
                                    <button
                                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors"
                                      onClick={() => handleCourseClick(course._id)}
                                    >
                                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        <img
                                          src={
                                            course.thumbnailImage ||
                                            "/placeholder.svg?height=48&width=48"
                                           || "/placeholder.svg"}
                                          alt=""
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.src =
                                              "/placeholder.svg?height=48&width=48";
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm line-clamp-1 dark:text-white">
                                          {course.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                          {course.instructor?.fullName ||
                                            "Unknown Instructor"}
                                        </p>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            {/* Mobile Search All Link */}
                            <div className="border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={handleSearchAllClick}
                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                              >
                                <CiSearch className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium text-primary">
                                  Search "{searchText}" in all courses
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6">
                  <ul className="space-y-1">
                    <li>
                      <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Home className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium dark:text-white">
                          Home
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/search"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium dark:text-white">
                          All Courses
                        </span>
                      </Link>
                    </li>
                    {user && (
                      <li>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium dark:text-white">
                            Profile
                          </span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>

                {/* Footer Actions */}
                <div className="py-6 border-t border-gray-200 dark:border-gray-700">
                  {user ? (
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                      <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium dark:text-white">
                        Log Out
                      </span>
                    </button>
                  ) : (
                    <Link to="/sign-in" className="w-full">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;