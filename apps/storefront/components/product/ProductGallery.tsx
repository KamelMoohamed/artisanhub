"use client";

import { useState } from "react";
import Image from "next/image";
import type { Image as ShopifyImage } from "@/lib/shopify/types";

interface ProductGalleryProps {
  images: ShopifyImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center
                      rounded-2xl bg-stone-100 text-stone-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1} stroke="currentColor" className="h-16 w-16">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5
               1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3.75
               3.75h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75
               A2.25 2.25 0 0 1 1.5 18V6A2.25 2.25 0 0 1 3.75 3.75Z" />
        </svg>
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-50">
        <Image
          key={active.url}
          src={active.url}
          alt={active.altText ?? title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-opacity duration-200"
        />
      </div>

      {/* Thumbnails — only shown when there are multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2
                          transition-colors
                          ${i === activeIndex
                            ? "border-amber-500"
                            : "border-transparent hover:border-stone-300"}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
