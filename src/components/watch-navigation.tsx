"use client";

import { BackButton } from "./back-button";
import { HomeIconButton } from "./home-icon-button";

export function WatchNavigation() {
  return (
    <div className="absolute top-4 left-4 flex gap-2 z-10">
      <BackButton />
      <HomeIconButton />
    </div>
  );
}
