import React from 'react'

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
      <div className="mb-2 h-4 w-1/2 rounded bg-muted"></div>
      <div className="h-4 w-5/6 rounded bg-muted"></div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="space-y-3">
        <div className="h-6 w-3/4 rounded bg-muted"></div>
        <div className="h-4 w-full rounded bg-muted"></div>
        <div className="h-4 w-2/3 rounded bg-muted"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-1/4 rounded bg-muted"></div>
          <div className="h-4 w-1/6 rounded bg-muted"></div>
        </div>
      </div>
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <article className="group flex flex-col space-y-2">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted"></div>
      <div className="space-y-2">
        <div className="h-4 w-1/4 rounded bg-muted"></div>
        <div className="h-6 w-3/4 rounded bg-muted"></div>
        <div className="h-4 w-full rounded bg-muted"></div>
        <div className="h-4 w-2/3 rounded bg-muted"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-muted"></div>
          <div className="h-4 w-1/6 rounded bg-muted"></div>
          <div className="w-1/8 h-4 rounded bg-muted"></div>
        </div>
      </div>
    </article>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
