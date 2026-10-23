export interface ChartAnchor {
  x: number;
  y: number;
}
/** Flip around the anchor at viewport edges, without covering the selected point. */
export function tooltipPosition(
  anchor: ChartAnchor,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const margin = 8;
  const gap = 12;
  const right = anchor.x + gap;
  const left = right + size.width <= viewport.width - margin ? right : anchor.x - size.width - gap;
  const above = anchor.y - size.height - gap;
  const top = above >= margin ? above : anchor.y + gap;
  return {
    left: Math.max(margin, Math.min(left, viewport.width - size.width - margin)),
    top: Math.max(margin, Math.min(top, viewport.height - size.height - margin)),
  };
}
