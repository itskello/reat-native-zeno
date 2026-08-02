/**
 * Dynamic Island morph geometry.
 *
 * These numbers are extracted verbatim from `prompt1/ANIMIX/Zenocard.lottie`
 * (layers `islande` and `islande model`), authored on a 393 x 852 canvas. They
 * are the design contract for the siphon effect and must not be approximated —
 * the overlap they produce is what generates the liquid neck.
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
  x: 15,
  y: 77.4531,
  w: 377.9955,
  h: 763.2802,
  r: 103.8596,
};
export const MODEL_CLOSED: IslandBox = {
  x: 133,
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
