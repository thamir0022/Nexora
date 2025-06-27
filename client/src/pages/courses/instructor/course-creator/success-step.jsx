import { CheckCircle, Eye, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "react-router-dom"

const SuccessStep = ({ courseId, courseData }) => {
  return (
    <div className="text-center py-8">
      <Card className="p-8 max-w-md mx-auto">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Course Created Successfully!</h2>
        <p className="text-muted-foreground mb-6">"{courseData.title}" is now live and ready for students to enroll.</p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to={`/dashboard/courses/${courseId}`} className="flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              View Course
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link to="/dashboard" className="flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default SuccessStep
