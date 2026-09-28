export const GRAPHICS_CONFIG = {
  maxPixelRatio: 1.5,
  background: 0x171c1e,
  camera: { fov: 45, near: 0.1, far: 100 },
  previewRotationSpeed: 0.35,
} as const;

export const LOOP_CONFIG = {
  fixedDt: 1 / 60,
  maxFrameDelta: 0.1,
} as const;
