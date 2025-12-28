'use client';

import { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface BlurImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  containerClassName?: string;
}

/**
 * Image component with blur-up loading effect
 */
export function BlurImage({
  src,
  alt,
  className,
  containerClassName,
  ...props
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className={cn('overflow-hidden', containerClassName)}>
      <Image
        src={src}
        alt={alt}
        className={cn(
          'duration-700 ease-in-out',
          isLoading
            ? 'scale-110 blur-2xl grayscale'
            : 'scale-100 blur-0 grayscale-0',
          className
        )}
        onLoad={handleLoadingComplete}
        {...props}
      />
    </div>
  );
}

export default BlurImage;
