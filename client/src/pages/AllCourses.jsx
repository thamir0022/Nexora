import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useDebounce } from "use-debounce"
import { CiSearch, CiFilter, CiGrid41 } from "react-icons/ci"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import Thumbnail from "@/components/Thumbnail"
import ThumbnailSkeleton from "@/components/skeltons/Thumbnail"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import { BookOpen, ChevronDown, ChevronUp, X, Plus } from "lucide-react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"

// Simple Filter Section Component
const FilterSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} />
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

const CoursesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const axios = useAxiosPrivate()
  const { user } = useAuth()
  const { cart, setCart, setOpenSheet } = useCart()
  const { wishlist, setWishlist } = useWishlist()

  // Basic state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Simple filters
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Data
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 0,
    totalCourses: 0,
  })

  // Processing states
  const [loadingCourseId, setLoadingCourseId] = useState(null)
  const [wishlistProcessingId, setWishlistProcessingId] = useState(null)

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "popular", label: "Most Popular" },
    { value: "rating-high", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ]

  // Fetch categories - memoized to prevent re-renders
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get("/categories")
      if (response.data.success) {
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }, [axios])

  // Fetch courses - memoized to prevent re-renders
  const fetchCourses = useCallback(
    async (page = 1) => {
      setLoading(true)
      setError(null)

      try {
        const params = {
          page: page.toString(),
          limit: "12",
          sortBy,
          status: "published",
        }

        if (debouncedQuery) params.query = debouncedQuery
        if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory

        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`/courses/all?${queryString}`)

        if (response.data.success) {
          setCourses(response.data.courses || [])
          setPagination(response.data.pagination || {})
        }
      } catch (error) {
        console.error("Search failed:", error)
        setError("Failed to load courses")
        toast.error("Failed to load courses")
      } finally {
        setLoading(false)
      }
    },
    [axios, debouncedQuery, selectedCategory, sortBy],
  )

  // Initial data fetch
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses(1)
  }, [fetchCourses])

  // Update URL when search changes
  useEffect(() => {
    if (debouncedQuery) {
      navigate(`/courses?q=${encodeURIComponent(debouncedQuery)}`, { replace: true })
    } else {
      navigate("/courses", { replace: true })
    }
  }, [debouncedQuery, navigate])

  // Cart handlers - memoized to prevent re-renders
  const handleAddToCart = useCallback(
    async (courseId) => {
      if (!user?._id) {
        toast.error("Please login to add courses to cart")
        return
      }

      setLoadingCourseId(courseId)
      try {
        const { data } = await axios.post(`/users/${user._id}/cart/${courseId}`)
        setCart(data.cart)
        toast.success("Course added to cart")
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to add to cart")
      } finally {
        setLoadingCourseId(null)
      }
    },
    [axios, user, setCart],
  )

  const handleAddToWishlist = useCallback(
    async (courseId) => {
      if (!user?._id) {
        toast.error("Please login to add courses to wishlist")
        return
      }

      setWishlistProcessingId(courseId)
      try {
        const { data } = await axios.post(`/users/${user._id}/wishlist/${courseId}`)
        setWishlist(data.wishlist)
        toast.success("Course added to wishlist")
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to add to wishlist")
      } finally {
        setWishlistProcessingId(null)
      }
    },
    [axios, user, setWishlist],
  )

  const handleRemoveFromWishlist = useCallback(
    async (courseId) => {
      if (!user?._id) return

      setWishlistProcessingId(courseId)
      try {
        await axios.delete(`/users/${user._id}/wishlist/${courseId}`)
        setWishlist((prev) => prev.filter((item) => item._id !== courseId))
        toast.success("Removed from wishlist")
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to remove from wishlist")
      } finally {
        setWishlistProcessingId(null)
      }
    },
    [axios, user, setWishlist],
  )

  // Check if course is in cart/wishlist - memoized
  const isInCart = useCallback((courseId) => cart.some((item) => item._id === courseId), [cart])
  const isInWishlist = useCallback((courseId) => wishlist.some((item) => item._id === courseId), [wishlist])

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("all")
    setSortBy("newest")
    setSearchQuery("")
  }

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory && selectedCategory !== "all") count++
    return count
  }, [selectedCategory])

  // Handle category toggle
  const handleCategoryToggle = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory("all")
    } else {
      setSelectedCategory(categoryId)
    }
  }

  return (
    <div className="min-h-screen bg-background mt-4">
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-6 min-h-[calc(100vh-8rem)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CiFilter size={20} />
                    <h3 className="font-semibold">Search & Filters</h3>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Search Input */}
                <div className="mb-6">
                  <div className="relative">
                    <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      type="text"
                      placeholder="Search for courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-3"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {/* {debouncedQuery && (
                    <p className="text-sm text-gray-600 mt-2">
                      {loading ? "Searching..." : `${pagination.totalCourses || 0} results for "${debouncedQuery}"`}
                    </p>
                  )} */}
                </div>

                {/* Sort */}
                <FilterSection title="Sort By" icon={CiGrid41}>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSection>

                {/* Categories */}
                <FilterSection title="Categories" icon={BookOpen}>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* All Categories Badge */}
                    <Badge
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      className="cursor-pointer flex items-center gap-1 justify-center py-2 px-3 w-full"
                      onClick={() => setSelectedCategory("all")}
                    >
                      {selectedCategory === "all" ? (
                        <>
                          <X size={12} />
                          All Categories
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          All Categories
                        </>
                      )}
                    </Badge>

                    {/* Category Badges */}
                    {categories.map((category) => (
                      <Badge
                        key={category._id}
                        variant={selectedCategory === category._id ? "default" : "outline"}
                        className="cursor-pointer flex items-center gap-1 justify-center py-2 px-3 w-full"
                        onClick={() => handleCategoryToggle(category._id)}
                      >
                        {selectedCategory === category._id ? (
                          <>
                            <X size={12} />
                            {category.name}
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            {category.name}
                          </>
                        )}
                      </Badge>
                    ))}
                  </div>
                </FilterSection>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Search & Filters */}
            <div className="lg:hidden mb-6">
              <Card className="p-4 mb-4">
                <div className="relative mb-4">
                  <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Search for courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {debouncedQuery && (
                  <p className="text-sm text-gray-600 mb-4">
                    {loading ? "Searching..." : `${pagination.totalCourses || 0} results for "${debouncedQuery}"`}
                  </p>
                )}
              </Card>

              <div className="flex gap-2 flex-wrap">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{debouncedQuery ? `Search Results` : "All Courses"}</h2>
                <p className="text-gray-600 text-sm">
                  {pagination.totalCourses > 0 && `${pagination.totalCourses} courses found`}
                </p>
              </div>

              {/* Active Filter Tags */}
              {activeFiltersCount > 0 && (
                <div className="flex gap-2">
                  {selectedCategory && selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find((c) => c._id === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory("all")}>
                        <X size={12} />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Error State */}
            {error && (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => fetchCourses(1)}>Try Again</Button>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <ThumbnailSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Results Grid */}
            {!loading && !error && (
              <>
                {courses.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {courses.map((course) => (
                      <Thumbnail
                        key={course._id}
                        {...course}
                        role={user?.role}
                        isEnrolled={false}
                        isInCart={isInCart(course._id)}
                        isInWishlist={isInWishlist(course._id)}
                        addingToCart={loadingCourseId === course._id}
                        modifyingWishlist={wishlistProcessingId === course._id}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                        onRemoveFromWishlist={handleRemoveFromWishlist}
                        openCart={() => setOpenSheet(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <CiSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                    <p className="text-gray-600 mb-4">
                      {debouncedQuery
                        ? `No courses match your search for "${debouncedQuery}"`
                        : "No courses match your current filters"}
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </Card>
                )}

                {/* Simple Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCourses(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <FaChevronLeft size={16} />
                      Previous
                    </Button>

                    <span className="px-4 py-2 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCourses(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      Next
                      <FaChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoursesPage
