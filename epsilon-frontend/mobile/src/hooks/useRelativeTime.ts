import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/formatRelativeTime";

/** Comme formatRelativeTime, mais se met à jour toute seule au fil du temps
 * (sans ça le texte reste figé sur la valeur calculée au premier rendu —
 * un post publié "à l'instant" resterait "à l'instant" indéfiniment tant
 * que l'écran ne se re-render pas pour une autre raison). */
export function useRelativeTime(isoDate: string): string {
  const [label, setLabel] = useState(() => formatRelativeTime(isoDate));

  useEffect(() => {
    setLabel(formatRelativeTime(isoDate));
    const interval = setInterval(() => setLabel(formatRelativeTime(isoDate)), 30000);
    return () => clearInterval(interval);
  }, [isoDate]);

  return label;
}
