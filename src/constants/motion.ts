import { Easing } from "react-native-reanimated";

/**
 * ZENO motion tokens.
 *
 * Single source of truth for every Wallet transition so the whole ecosystem
 * moves with one rhythm instead of each screen inventing its own timing.
 * Values follow the motion spec: instant Dynamic Island morph, ~300–400ms
 * surface travel with a slight overshoot on landing.
 */

export const durations = {
  /** Dynamic Island title/width morph. */
  island: 180,
  /** Surface slide-up / collapse. */
  surface: 340,
  /** Floating cards fade-in after the surface lands. */
  floating: 160,
  /** Snap-back when a gesture is released below threshold. */
  cancel: 220,
} as const;

export const easings = {
  out: Easing.bezier(0.5, 0.35, 0.15, 1), // Exact Lottie extracted bezier curve from Zenocard.lottie
  in: Easing.bezier(0.55, 0, 1, 0.45),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

/** Landing spring — tuned to 60 FPS Lottie composition dynamics. */
export const springs = {
  surface: { damping: 22, stiffness: 220, mass: 0.95 },
  island: { damping: 20, stiffness: 260, mass: 0.9 },
  /** Liquid gooey spring — soft elastic tension with liquid wobble. */
  liquid: { damping: 14, stiffness: 180, mass: 0.8 },
} as const;

export const gesture = {
  /** Vertical travel (px) past which the transition completes on release. */
  distanceThreshold: 150,
  /** Velocity (px/s) that completes the transition regardless of distance. */
  velocityThreshold: 1200,
  /** Drag beyond the surface bounds is damped rather than blocked. */
  overdragFactor: 0.35,
  /** Liquid surface stretch factor during downward gesture pull. */
  liquidStretchMax: 1.35,
} as const;
