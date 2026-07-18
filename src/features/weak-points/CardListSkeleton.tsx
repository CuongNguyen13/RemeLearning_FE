import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CardListSkeletonProps {
  count?: number
}

// Loading placeholder shaped like the real WeakPointCard/RecommendationCard (icon chip +
// title + badge, then a content row) instead of one generic blob - shared by both features
// so the loading state already looks like the list it's about to become.
export function CardListSkeleton({ count = 3 }: CardListSkeletonProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-5 flex-1 rounded-md" />
              <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
