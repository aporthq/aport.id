"use client";

import { useState, useEffect } from "react";

interface DogCeoResponse {
  status: string;
  message: string;
}

const cache = new Map<string, string>();

/**
 * Fetches a breed image from dog.ceo API.
 * Caches results in memory so the same breed always shows the same image per session.
 */
export function useBreedImage(imageApi: string | null): string | null {
  const [url, setUrl] = useState<string | null>(
    imageApi ? cache.get(imageApi) ?? null : null,
  );

  useEffect(() => {
    if (!imageApi) return;
    if (cache.has(imageApi)) {
      setUrl(cache.get(imageApi)!);
      return;
    }

    let cancelled = false;
    fetch(`https://dog.ceo/api/breed/${imageApi}/images/random`)
      .then((r) => r.json() as Promise<DogCeoResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.status === "success" && data.message) {
          cache.set(imageApi, data.message);
          setUrl(data.message);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [imageApi]);

  return url;
}

/** Prefetch images for a list of breed API paths (fire and forget) */
export function prefetchBreedImages(imageApis: (string | null)[]) {
  for (const api of imageApis) {
    if (!api || cache.has(api)) continue;
    fetch(`https://dog.ceo/api/breed/${api}/images/random`)
      .then((r) => r.json() as Promise<DogCeoResponse>)
      .then((data) => {
        if (data.status === "success" && data.message) {
          cache.set(api, data.message);
        }
      })
      .catch(() => {});
  }
}
