import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, FileText, Clock } from "lucide-react"
import { formatDuration } from "@/lib/utils"

const ReviewStep = ({ courseData }) => {
  // Calculate total duration
  const totalDuration = courseData.lessons.reduce((total, lesson) => {
    return total + (Number.parseInt(lesson.duration) || 0)
  }, 0)

  // Count total notes
  const totalNotes = courseData.lessons.reduce((total, lesson) => {
    return total + (lesson.noteUrls?.length || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review Your Course</h2>
        <p className="text-muted-foreground">Review your course details before creating it</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {courseData.thumbnailImage ? (
                <img
                  src={courseData.thumbnailImage || "/placeholder.svg"}
                  alt={courseData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No thumbnail</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold">{courseData.title}</h3>
              <p className="text-muted-foreground mt-1">{courseData.description}</p>
            </div>

            <div>
              <p className="font-medium">Price: ${Number.parseFloat(courseData.price).toFixed(2)}</p>
            </div>

            <div>
              <p className="font-medium mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {courseData.categoryData?.map((cat) => (
                  <Badge key={cat._id} variant="secondary">
                    {cat.name}
                  </Badge>
                )) ||
                  courseData.category?.map((catId, index) => (
                    <Badge key={index} variant="secondary">
                      {catId}
                    </Badge>
                  ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Features:</p>
              <ul className="list-disc list-inside space-y-1">
                {courseData.features.map((feature, index) => (
                  <li key={index} className="text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lessons ({courseData.lessons.length})</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{totalNotes} notes</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {courseData.lessons.map((lesson, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                      {lesson.thumbnailImage ? (
                        <img
                          src={lesson.thumbnailImage || "/placeholder.svg"}
                          alt={lesson.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <h4 className="font-medium">
                        {index + 1}. {lesson.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lesson.duration)}
                        </Badge>

                        {lesson.videoUrl && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            Video
                          </Badge>
                        )}

                        {lesson.noteUrls?.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {lesson.noteUrls.length} notes
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReviewStep