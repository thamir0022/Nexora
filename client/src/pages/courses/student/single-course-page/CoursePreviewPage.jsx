import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StarRating } from "@/components/ui/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { CiShoppingCart, CiHeart, CiClock2, CiUser, CiMobile3, CiTrophy, CiPlay1 } from "react-icons/ci"
import { toast } from "sonner"
import PaymentButton from "@/components/PaymentButton"
import CouponInput from "@/components/CouponInput"

const CoursePreviewPage = ({ course }) => {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [couponCode, setCouponCode] = useState("")

  // Manual price data (replace with API data when available)
  const [priceData, setPriceData] = useState({
    originalPrice: 2999,
    offerPrice: 1499,
    offerPercentage: 50,
    currency: "₹",
  })

  const [originalPriceData] = useState({
    originalPrice: 2999,
    offerPrice: 1499,
    offerPercentage: 50,
    currency: "₹",
  })

  const courseStats = {
    duration: "12 hours",
    students: "2,847",
    language: "English",
    level: "Beginner to Advanced",
  }

  const handleAddToCart = () => {
    toast.success("Course added to cart!")
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist")
  }

  const handleCouponSuccess = (couponData) => {
    setCouponCode(couponData.code)
    setPriceData((prev) => ({
      ...prev,
      offerPrice: Math.max(0, couponData.finalPrice), // Ensure price is not negative
      offerPercentage: Math.min(100, Math.round(100 - (couponData.finalPrice / originalPriceData.originalPrice) * 100)),
    }))
  }

  const handleCouponRemove = () => {
    setPriceData(originalPriceData)
  }

  return (
    <div className="min-h-dvh p-5 mt-3">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video */}
          <div
            style={{ backgroundImage: `url(${course.thumbnailImage})` }}
            className="bg-cover bg-center rounded-xl border w-full aspect-video overflow-hidden shadow-lg relative group"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <Button size="lg" className="rounded-full h-16 w-16 p-0">
                <CiPlay1 className="h-8 w-8" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

          {/* Instructor */}
          <Link to="#" className="w-fit flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-12 w-12">
              <AvatarImage src={course.instructor.profilePicture || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{course.instructor.fullName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{course.instructor.fullName}</p>
              <p className="text-sm text-gray-600">Course Instructor</p>
            </div>
          </Link>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full h-12 bg-gray-100">
              <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex-1 data-[state=active]:bg-white">
                Lessons
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 data-[state=active]:bg-white">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-medium">Rating:</span>
                <StarRating value={course.rating.averageRating} readonly />
                <span className="text-gray-600">({course.rating.ratingCount} reviews)</span>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Course Description</h3>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">What You'll Learn</h3>
                <ul className="space-y-3">
                  {course.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <CiTrophy className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-4">Course Content</h3>
                {course.lessons.map((lesson, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    {index !== course.lessons.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="text-center py-12">
                <p className="text-gray-600">Course reviews will be displayed here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right-Side Sticky Card */}
        <div className="max-lg:hidden">
          <Card className="h-[calc(100dvh-2rem)] sticky top-4 overflow-hidden">
            {/* Offer Ribbon */}
            <div className="absolute top-4 -right-12 bg-gradient-to-r from-red-500 to-pink-500 text-white px-12 py-2 text-sm font-bold transform rotate-45 z-10 shadow-lg">
              {priceData.offerPercentage}% OFF
            </div>

            <CardHeader className="pb-4">
              <div className="space-y-4">
                {/* Price Section */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-green-600">
                      {priceData.currency}
                      {priceData.offerPrice}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      {priceData.currency}
                      {priceData.originalPrice}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-sm">
                    Save {priceData.currency}
                    {priceData.originalPrice - priceData.offerPrice}
                  </Badge>
                </div>

                {/* Coupon Input Component */}
                <CouponInput
                  courseId={course._id}
                  originalAmount={originalPriceData.offerPrice}
                  onCouponSuccess={handleCouponSuccess}
                  onCouponRemove={handleCouponRemove}
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <PaymentButton className="w-full py-5" couponCode={couponCode} amount={priceData.offerPrice} description="Course Payment" icon course={course._id} />

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="w-full h-12 text-lg font-semibold border-2 hover:bg-gray-50"
                    >
                      <CiShoppingCart className="mr-2 size-5!" />
                      Add to Cart
                    </Button>

                    <Button
                      onClick={handleWishlist}
                      variant="outline"
                      className={`w-full h-12 text-lg font-semibold ${
                        isWishlisted
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <CiHeart className={`mr-2 size-5! ${isWishlisted ? "fill-current" : ""}`} />
                      {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Separator className="mb-4" />

              {/* Course Stats */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Course Details</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CiClock2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Duration: {courseStats.duration}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CiUser className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{courseStats.students} students enrolled</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CiMobile3 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Mobile & Desktop access</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <CiTrophy className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Certificate of completion</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CoursePreviewPage
