"use client";

import { BackButton } from "./back-button";
import { HomeIconButton } from "./home-icon-button";

export function WatchNavigation() {
  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <BackButton />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <HomeIconButton />
      </div>
    </>
  );
}
