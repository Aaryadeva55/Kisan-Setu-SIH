import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

export function TableLoadingSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="p-4 flex gap-4 items-center">
                {Array.from({ length: cols }).map((_, c) => (
                  <Skeleton key={c} className="h-5 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}
