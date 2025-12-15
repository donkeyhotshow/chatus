
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const backgroundImages = PlaceHolderImages.filter(img => img.id.startsWith('background-'));
const CHANGE_INTERVAL = 2.5 * 60 * 1000; // 2.5 minutes

export function BackgroundChanger() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        setIsFading(false);
      }, 1000); // Fade duration
    }, CHANGE_INTERVAL);

    // Initial fade in
    setTimeout(() => setIsFading(false), 100);

    return () => clearInterval(timer);
  }, []);

  // Background images are managed by the map below

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {backgroundImages.map((image, index) => (
        <div
          key={image.id}
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-1000",
            index === currentIndex ? 'opacity-30' : 'opacity-0'
          )}
          style={{ backgroundImage: `url(${image.imageUrl})` }}
        />
      ))}
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-white/10 blur-[100px] rounded-full transition-opacity duration-1000"
        style={{ opacity: isFading ? 0 : 1 }}
      />
    </div>
  );
}
