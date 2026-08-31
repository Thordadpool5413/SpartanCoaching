export const tokens = {
  colors: {
    background: "#07111F",
    surface: "#0D1B2C",
    surfaceRaised: "#13243A",
    primary: "#F34D59",
    text: "#FAF7F1",
    textMuted: "#B8C2CF",
    border: "rgba(245, 236, 221, 0.14)",
  },
  space: { 2: 8, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64 },
  radius: { 4: 8, 8: 16, 12: 24 },
  shadow: {
    1: "0 8px 24px rgba(0, 0, 0, 0.18)",
    2: "0 18px 48px rgba(0, 0, 0, 0.28)",
  },
  fontSize: { 100: 12, 200: 14, 300: 16, 400: 20, 500: 34 },
  minimumTapTarget: 44,
  brandBackdrop: { size: 330, right: -145, top: 92, opacity: 0.035 },
} as const;

export type SpartanTokens = typeof tokens;
