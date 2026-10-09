/**
 * Dynamic Island morph geometry.
 *
 * These numbers come from `prompt1/ANIMIX/Zenocard.lottie` (layers `islande`
 * and `islande model`), authored on a 393 x 852 canvas. They are the design
 * contract for the siphon effect and must not be approximated — the overlap
 * they produce is what generates the liquid neck.
 *
 * Three deliberate corrections to the Lottie's own values, all on the open
 * model — see MODEL_OPEN for the numbers:
 *
 * 1. Centring. The Lottie places the open model at x=15 with a width of 378 on
 *    a 393 canvas, so it touches the right edge (margins 15 | 0). Both states
 *    are centred here instead.
 * 2. Separation. The Lottie leaves 2.45px between the pill's bottom (y=75) and
 *    the open model's top (y=77.45). The fuse blur is 14px, so at that distance
 *    the two bodies can never come apart and the card reads as permanently
 *    welded to the pill. The open model is pushed to y=105 — clear of NECK_BAND
 *    (90), where the metaball has no source to fuse with. The siphon still
 *    plays through the morph; it only releases at full openness.
 * 3. Corner radius. The Lottie's open model uses r=103.86 on a 378-wide shape
 *    (ratio 0.275 — nearly an oval). The locked design system tops out at
 *    "Large 28–32px", so the open state uses r=32. The closed radius stays at
 *    the Lottie's 13.09, which is exactly half its 26px height: a true pill,
 *    and hidden behind the capsule anyway.
 *
 * `openness`: 1 = ZENO Card fully open (Lottie t0), 0 = closed (Lottie t60).
 */

/** The canvas the Lottie was authored on — everything scales from this width. */
export const ISLAND_CANVAS_WIDTH = 393;

export type IslandBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius. */
  r: number;
};

/** `islande` — the persistent pill. It widens as the card closes. */
export const PILL_OPEN: IslandBox = { x: 114, y: 0, w: 165, h: 75, r: 37.5 };
export const PILL_CLOSED: IslandBox = { x: 12, y: 0, w: 370, h: 75, r: 37.5 };

/** `islande model` — the card surface. It shrinks in behind the pill. */
export const MODEL_OPEN: IslandBox = {
  x: 7.5,
  y: 105,
  w: 377.9955,
  h: 736,
  r: 32,
};
export const MODEL_CLOSED: IslandBox = {
  x: 129.5,
  y: 25,
  w: 134.06,
  h: 26.1836,
  r: 13.0918,
};

/**
 * Interpolate one box between its closed and open state, in device pixels.
 *
 * Runs on the UI thread: it is called from both the Skia shape and the RN
 * content layers so they stay on exactly the same geometry, frame for frame.
 */
export function mixIslandBox(
  closed: IslandBox,
  open: IslandBox,
  openness: number,
  scale: number
): IslandBox {
  "worklet";
  const mix = (a: number, b: number) => (a + (b - a) * openness) * scale;
  return {
    x: mix(closed.x, open.x),
    y: mix(closed.y, open.y),
    w: mix(closed.w, open.w),
    h: mix(closed.h, open.h),
    r: mix(closed.r, open.r),
  };
}

export function pillBox(openness: number, scale: number): IslandBox {
  "worklet";
  return mixIslandBox(PILL_CLOSED, PILL_OPEN, openness, scale);
}

export function modelBox(openness: number, scale: number): IslandBox {
  "worklet";
  return mixIslandBox(MODEL_CLOSED, MODEL_OPEN, openness, scale);
}
