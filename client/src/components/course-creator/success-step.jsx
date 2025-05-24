import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const SuccessStep = ({ courseId }) => {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Course Created Successfully!</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Your course has been created with all lessons. Students can now enroll in your course.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild>
          <Link to={`/courses/${courseId}`} className="flex items-center gap-2">
            View Course
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export default SuccessStep
