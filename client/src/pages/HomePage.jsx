import HeroCarousel from "@/components/HeroCarousel"
import ThumbnailSkeleton from "@/components/skeltons/Thumbnail"
import Thumbnail from "@/components/Thumbnail"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"
import useAxiosPrivate from "@/hooks/useAxiosPrivate"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { CategorySlider } from "@/components/CategorySlider"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const HomePage = () => {
  const [courses, setCourses] = useState({ allCourses: [], userEnrolledCourses: [] })
  const [loading, setLoading] = useState(false)
  const axios = useAxiosPrivate()
  const [categories, setCategories] = useState([])
  const { cart, setCart, setOpenSheet } = useCart()
  const { wishlist, setWishlist } = useWishlist()
  const { user } = useAuth()
  const [loadingCourseId, setLoadingCourseId] = useState(null)
  const [wishlistProcessingId, setWishlistProcessingId] = useState(null)

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 0,
    totalCourses: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState(null)

  const fetchCourses = async (page = 1, categoryId = null) => {
    setLoading(true)
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: "published",
        sortBy: "newest",
        ...(categoryId && { category: categoryId }),
      })

      const [allCoursesRes, userEnrolledCoursesRes, categoriesRes] = await Promise.all([
        axios.get(`/courses/all?${queryParams}`),
        user?._id ? axios.get(`/users/${user._id}/courses`) : Promise.resolve({ data: { courses: [] } }),
        axios.get("/categories"),
      ])

      setCourses({
        allCourses: allCoursesRes.data.courses || [],
        userEnrolledCourses: userEnrolledCoursesRes.data.courses || [],
      })

      setPagination(allCoursesRes.data.pagination || {})
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses(1, selectedCategory)
  }, [axios, user, selectedCategory])

  const handleAddToCart = async (courseId) => {
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
  }

  const handleAddToWishlist = async (courseId) => {
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
  }

  const handleRemoveFromWishlist = async (courseId) => {
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
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCourses(newPage, selectedCategory)
    }
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page
  }

  const clearCategoryFilter = () => {
    setSelectedCategory(null)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const selectedCategoryName = selectedCategory ? categories.find((cat) => cat._id === selectedCategory)?.name : null

  return (
    <section className="">
      {/* Hero Carousel */}
      <HeroCarousel />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            {selectedCategoryName ? `${selectedCategoryName} Courses` : "Explore Top-Rated Programs"}
          </h2>
          {pagination.totalCourses > 0 && (
            <p className="text-muted-foreground">
              Showing {courses.allCourses.length} of {pagination.totalCourses} courses
              {selectedCategoryName && (
                <Button variant="link" onClick={clearCategoryFilter} className="ml-2 p-0 h-auto text-sm">
                  (Clear filter)
                </Button>
              )}
            </p>
          )}
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {loading ? (
            [...Array(12)].map((_, i) => <ThumbnailSkeleton key={i} />)
          ) : courses.allCourses.length > 0 ? (
            courses.allCourses.map((course) => {
              const {
                _id,
                title,
                description,
                thumbnailImage,
                rating,
                category,
                instructor,
                price,
                offerPrice,
                effectivePrice,
                discountPercentage,
                totalLessons,
                isPopular,
                isFree,
                hasDiscount,
                enrolledCount,
              } = course

              return (
                <Thumbnail
                  key={_id}
                  _id={_id}
                  title={title}
                  description={description}
                  thumbnailImage={thumbnailImage}
                  rating={rating}
                  category={category}
                  instructor={instructor}
                  price={price}
                  offerPrice={offerPrice}
                  effectivePrice={effectivePrice}
                  discountPercentage={discountPercentage}
                  totalLessons={totalLessons}
                  isPopular={isPopular}
                  isFree={isFree}
                  hasDiscount={hasDiscount}
                  enrolledCount={enrolledCount}
                  role={user?.role}
                  isEnrolled={courses.userEnrolledCourses.some((item) => item.course._id === _id)}
                  isInCart={cart.some((item) => item._id === _id)}
                  isInWishlist={wishlist.some((item) => item._id === _id)}
                  addingToCart={loadingCourseId === _id}
                  modifyingWishlist={wishlistProcessingId === _id}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  onRemoveFromWishlist={handleRemoveFromWishlist}
                  openCart={() => setOpenSheet(true)}
                />
              )
            })
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">
                {selectedCategoryName
                  ? `No courses available in ${selectedCategoryName} category.`
                  : "No courses available at the moment."}
              </p>
              {selectedCategoryName && (
                <Button variant="outline" onClick={clearCategoryFilter} className="mt-4">
                  View All Courses
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className="w-10 h-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination.totalCourses > 0 && (
          <div className="text-center text-sm text-muted-foreground mb-8">
            Page {pagination.page} of {pagination.totalPages} • {pagination.totalCourses} total courses
          </div>
        )}
      </div>

      {/* Category Slider */}
      <CategorySlider
        categories={categories}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
    </section>
  )
}

export default HomePage
