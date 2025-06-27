import { Hash, BookOpen, Tag, Play, Clock, FileText, ImageIcon, Image } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FaRupeeSign } from "react-icons/fa"

const ReviewStep = ({ courseData }) => {
  console.log(courseData);

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Calculate total duration
  const totalDuration =
    courseData.lessons?.reduce((total, lesson) => {
      return total + (Number.parseInt(lesson.duration) || 0)
    }, 0) || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Course</h2>
        <p className="text-gray-600">Please review all course details before publishing</p>
      </div>

      {/* Course Overview Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Title */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Course Title</h3>
            <p className="text-gray-700 text-lg leading-relaxed">{courseData.title}</p>
          </div>

          <Separator />

          {/* Course Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{courseData.description}</p>
          </div>

          <Separator />

          {/* Price and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <FaRupeeSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Course Price</p>
              <p className="text-2xl font-bold text-green-700">{formatPrice(courseData.price)}</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Play className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Total Lessons</p>
              <p className="text-2xl font-bold text-blue-700">{courseData.lessons?.length || 0}</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Total Duration</p>
              <p className="text-2xl font-bold text-purple-700">{totalDuration} min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories and Tags Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Tag className="h-5 w-5 text-orange-600" />
            Categories & Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-3">
              {courseData.categoryData?.map((category) => (
                <Badge
                  key={category._id}
                  variant="secondary"
                  className="px-4 py-2 text-sm bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Hashtags */}
          {courseData.hashtags?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hashtags
              </h3>
              <div className="flex flex-wrap gap-2">
                {courseData.hashtags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Features Card */}
      {courseData.features?.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-green-600" />
              Course Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courseData.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Content Card */}
      {courseData.lessons?.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Play className="h-5 w-5 text-purple-600" />
              Course Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseData.lessons.map((lesson, index) => (
                <div
                  key={lesson._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Lesson Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-gray-900 leading-tight">{lesson.title}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                          <Clock className="h-4 w-4" />
                          {lesson.duration} min
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-3">{lesson.description}</p>

                      {/* Lesson Assets */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {lesson.videoUrl && (
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Video
                          </div>
                        )}
                        {lesson.thumbnailImage && (
                          <div className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            Thumbnail
                          </div>
                        )}
                        {lesson.noteUrls?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {lesson.noteUrls.length} Resource{lesson.noteUrls.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Thumbnail */}
      {courseData.thumbnailImage && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-indigo-600" />
              Course Thumbnail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="relative max-w-md w-full">
                <img
                  src={courseData.thumbnailImage || "/placeholder.svg"}
                  alt={courseData.title}
                  className="w-full h-auto rounded-lg shadow-md border border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="shadow-sm border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Course Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Price</p>
                <p className="text-blue-700">{formatPrice(courseData.price)}</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Lessons</p>
                <p className="text-blue-700">{courseData.lessons?.length || 0}</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Duration</p>
                <p className="text-blue-700">{totalDuration} min</p>
              </div>
              <div>
                <p className="font-medium text-blue-800">Categories</p>
                <p className="text-blue-700">{courseData.categoryData?.length || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReviewStep
