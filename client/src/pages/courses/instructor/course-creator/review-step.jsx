import { Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const ReviewStep = ({ courseData }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Review Your Course</h2>

      {/* Course Title */}
      <div>
        <p className="font-medium mb-2">Course Title:</p>
        <p>{courseData.title}</p>
      </div>

      {/* Course Description */}
      <div>
        <p className="font-medium mb-2">Course Description:</p>
        <p>{courseData.description}</p>
      </div>

      {/* Course Category */}
      <div>
        <p className="font-medium mb-2">Category:</p>
        <p>{courseData.category}</p>
      </div>

      {/* Course Price */}
      <div>
        <p className="font-medium mb-2">Price:</p>
        <p>${courseData.price}</p>
      </div>

      {/* Features */}
      <div>
        <p className="font-medium mb-2">Features:</p>
        <ul>
          {courseData.features?.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* Add this section after the Features section */}
      {courseData.hashtags?.length > 0 && (
        <div>
          <p className="font-medium mb-2 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Hashtags:
          </p>
          <div className="flex flex-wrap gap-2">
            {courseData.hashtags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewStep
