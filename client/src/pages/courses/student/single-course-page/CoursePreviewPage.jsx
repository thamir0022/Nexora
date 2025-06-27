"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  CiShoppingCart,
  CiHeart,
  CiClock2,
  CiUser,
  CiMobile3,
  CiTrophy,
} from "react-icons/ci";
import { toast } from "sonner";
import PaymentButton from "@/components/PaymentButton";
import CouponInput from "@/components/CouponInput";
import Reviews from "@/components/Reviews";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { useUserCart } from "@/hooks/useUserCart";

const CoursePreviewPage = ({ course }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [reviews, setReviews] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(course.effectivePrice);
  const axios = useAxiosPrivate();
  const { addToCart } = useUserCart();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/reviews?targetId=${course._id}`);
        setReviews(res.data.reviews);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };

    if (course._id) {
      fetchReviews();
    }
  }, [course._id, axios]);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleCouponSuccess = (couponData) => {
    setCouponCode(couponData.code);
    setCurrentPrice(Math.max(0, couponData.finalPrice));
  };

  const handleCouponRemove = () => {
    setCurrentPrice(course.effectivePrice);
    setCouponCode("");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const savings = course.price - currentPrice;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Thumbnail */}
            <div className="relative">
              <img
                src={course.thumbnailImage || "/placeholder.svg"}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-2xl shadow-lg"
              />
            </div>

            {/* Course Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {course.category.map((cat) => (
                  <Badge key={cat._id} variant="secondary" className="text-sm">
                    {cat.name}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {course.title}
              </h1>

              <div className="flex items-center gap-4">
                <StarRating value={course.rating.averageRating} readonly />
                <span className="text-gray-600">
                  ({course.rating.ratingCount} reviews)
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">
                  {course.enrolledCount} students
                </span>
              </div>
            </div>

            {/* Instructor */}
            <Link
              to="#"
              className="w-fit flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={course.instructor.profilePicture || "/placeholder.svg"}
                />
                <AvatarFallback className="text-lg">
                  {course.instructor.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {course.instructor.fullName}
                </p>
                <p className="text-sm text-gray-600">Course Instructor</p>
              </div>
            </Link>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full h-12 bg-gray-100">
                <TabsTrigger
                  value="overview"
                  className="flex-1 data-[state=active]:bg-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="lessons"
                  className="flex-1 data-[state=active]:bg-white"
                >
                  Lessons
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="flex-1 data-[state=active]:bg-white"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Rating:</span>
                  <StarRating value={course.rating.averageRating} readonly />
                  <span className="text-gray-600">
                    ({course.rating.ratingCount} reviews)
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Course Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    What You'll Learn
                  </h3>
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
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                      {index !== course.lessons.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Reviews reviews={reviews} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Purchase Card */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="relative overflow-hidden shadow-lg min-h-[calc(100vh-9rem)]">
              {/* Offer Banner */}
              {course.hasDiscount && course.offer && (
                <div className="absolute top-4 -right-12 bg-gradient-to-r from-red-500 to-pink-500 text-white px-12 py-2 text-sm font-bold transform rotate-45 z-10 shadow-lg">
                  {course.offer.name}
                </div>
              )}

              <CardHeader className="pb-4 space-y-6">
                {/* Price Section */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(currentPrice)}
                    </span>
                    {course.hasDiscount && (
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(course.price)}
                      </span>
                    )}
                  </div>

                  {savings > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-sm font-semibold"
                    >
                      Save {formatPrice(savings)}
                    </Badge>
                  )}
                </div>

                {/* Coupon Input */}
                <CouponInput
                  courseId={course._id}
                  originalAmount={course.effectivePrice}
                  onCouponSuccess={handleCouponSuccess}
                  onCouponRemove={handleCouponRemove}
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <PaymentButton
                    className="w-full py-4 text-lg font-semibold"
                    couponCode={couponCode}
                    amount={currentPrice}
                    description="Course Payment"
                    icon
                    course={course._id}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => addToCart(course._id)}
                      variant="outline"
                      className="w-full h-12 font-medium border-2 hover:bg-gray-50"
                    >
                      <CiShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>

                    <Button
                      onClick={handleWishlist}
                      variant="outline"
                      className={`w-full h-12 font-medium border-2 ${
                        isWishlisted
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          : "hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                      }`}
                    >
                      <CiHeart
                        className={`mr-2 h-5 w-5 ${
                          isWishlisted ? "fill-current" : ""
                        }`}
                      />
                      Wishlist
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Separator className="mb-6" />

                {/* Course Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    Course Includes
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CiClock2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        {course.totalLessons} lessons
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CiUser className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        {course.enrolledCount} students enrolled
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CiMobile3 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        Mobile & Desktop access
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CiTrophy className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        Certificate of completion
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewPage;
