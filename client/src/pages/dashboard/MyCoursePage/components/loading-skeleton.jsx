import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function LoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-1 flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-2 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
