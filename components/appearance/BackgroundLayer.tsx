"use client";

import { useEffect, useState } from "react";

type Appearance = { imageUrl: string | null; fit: "cover" | "contain"; position: string; overlayStrength: number; blur: number };
export function BackgroundLayer() {
  const [appearance, setAppearance] = useState<Appearance | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings/appearance", { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => data && setAppearance(data)).catch(() => undefined);
    return () => controller.abort();
  }, []);
  if (!appearance?.imageUrl) return null;
  return <div className="app-background" aria-hidden="true"><div className="app-background-image" style={{ backgroundImage: `url(${appearance.imageUrl})`, backgroundSize: appearance.fit, backgroundPosition: appearance.position, filter: `blur(${appearance.blur}px)` }} /><div className="app-background-overlay" style={{ opacity: appearance.overlayStrength }} /></div>;
}
