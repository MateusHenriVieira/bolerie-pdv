import { Skeleton } from "@/components/ui/skeleton"

export default function ReservasLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div>
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[500px] mt-2" />
        </div>

        <div className="flex justify-between items-center mt-6">
          <Skeleton className="h-10 w-[400px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>

        <div className="mt-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2 mt-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
