import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}
