export const colors = {
  zenoBlue: "#0057FF",
  zenoBlueLight: "#EAF6FF",
  zenoGreen: "#C7FF4A",
  /**
   * ZENO Green is unreadable on white — it is a highlight, not a text colour.
   * This is the same hue darkened to carry link text and icons on light
   * surfaces (the "See all" link on the ZENO Card sheet).
   */
  zenoGreenDeep: "#7DBB2E",
  /** App Shell behind the ZENO Card hero — the room's light green family. */
  zenoCardShell: "#E4F4C6",
  zenoDark: "#0A1712",
  zenoIntro: "#1B2812",
  zenoBackground: "#F4FAFF",
  zenoAuthBackground: "#FAFEF0",
  zenoSky: "#EAF6FF",
  zenoSurface: "#FFFFFF",
  zenoSurfaceSoft: "#F1F7FF",
  zenoBorder: "#D9E4FF",
  zenoTextPrimary: "#071706",
  zenoTextSecondary: "#6b6f75",
  zenoLinkBlue: "#1C64E8",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  shadowSoft: "rgba(10, 23, 18, 0.08)",
  shadowStrong: "rgba(10, 23, 18, 0.12)",
} as const;
