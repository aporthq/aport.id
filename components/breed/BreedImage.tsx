"use client";

import { useBreedImage } from "@/lib/hooks/useBreedImage";
import { cn } from "@/lib/utils";

interface BreedImageProps {
  imageApi: string | null;
  breed: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "size-8 text-sm",
  md: "size-12 text-lg",
  lg: "size-24 text-3xl",
};

/**
 * Renders a breed image from dog.ceo, with emoji fallback for non-dog breeds.
 */
export function BreedImage({ imageApi, breed, size = "sm", className }: BreedImageProps) {
  const url = useBreedImage(imageApi);

  const fallback = breed === "Wolf" ? "🐺"
    : breed === "Feral Cat" ? "🐱"
    : breed === "Sled Dog Team" ? "🐕‍🦺"
    : "🐾";

  if (!url) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-white/[0.06] shrink-0",
          sizes[size],
          className,
        )}
        aria-label={breed}
      >
        {imageApi ? (
          <span className="animate-pulse size-full rounded-full bg-white/[0.04]" />
        ) : (
          fallback
        )}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={breed}
      className={cn(
        "rounded-full object-cover shrink-0",
        sizes[size],
        className,
      )}
      loading="lazy"
    />
  );
}
