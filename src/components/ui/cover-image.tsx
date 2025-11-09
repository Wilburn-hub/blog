'use client'

import Image from 'next/image'
import React from 'react'

interface CoverImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function CoverImage({
  src,
  alt,
  width = 800,
  height = 450,
  className = '',
  priority = false,
}: CoverImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`object-cover transition-all duration-300 ${isLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0'} `}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {isLoading && <div className="absolute inset-0 animate-pulse bg-muted" />}
    </div>
  )
}
