"use client";

import { useEffect, useState } from "react";
import { BattlePreview } from "./BattlePreview";
import type { CardDisplay as CardType } from "@/types/card";

interface ArenaPreviewProps {
  player: CardType;
  enemy: CardType;
}

const VIDEO_SRC = "/arena-preview.mp4";

/**
 * Shows the real arena screen-recording (looping, muted) on the landing page.
 * Drop a compressed clip at /public/arena-preview.mp4. We probe for it on mount;
 * if it's missing we gracefully fall back to the live ClashCard-driven preview,
 * so the section always renders something good.
 */
export function ArenaPreview({ player, enemy }: ArenaPreviewProps) {
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(VIDEO_SRC, { method: "HEAD" })
      .then((res) => { if (alive) setHasVideo(res.ok); })
      .catch(() => { if (alive) setHasVideo(false); });
    return () => { alive = false; };
  }, []);

  if (!hasVideo) return <BattlePreview player={player} enemy={enemy} />;

  return (
    <div className="relative z-10">
      <video className="w-full h-auto block" autoPlay loop muted playsInline preload="metadata">
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}
