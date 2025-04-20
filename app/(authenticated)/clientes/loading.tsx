import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[500px] mt-2" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-[400px]" />

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <Skeleton className="h-8 w-[250px]" />

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>

            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-6 w-[180px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
