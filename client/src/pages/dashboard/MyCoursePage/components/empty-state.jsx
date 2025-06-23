import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import emptyCourse from "@/assets/images/no-data.svg"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-64 h-64 mb-8 flex items-center justify-center">
        <img
          src={emptyCourse}
          alt="No courses found"
          className="w-full h-full object-contain opacity-50 pointer-events-none"
        />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">Start Your Learning Journey</h3>
        <p className="text-gray-600 mb-8">
          Discover amazing courses and unlock your potential. Your first course is just a click away!
        </p>
        <Link to="/courses">
          <Button size="lg" className="px-8">
            Browse Courses
          </Button>
        </Link>
      </div>
    </div>
  )
}
