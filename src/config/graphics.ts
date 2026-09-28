export const GRAPHICS_CONFIG = {
  maxPixelRatio: 1.5,
  background: 0x2d211b,
  fogNear: 26,
  fogFar: 100,
  camera: { fov: 58, near: 0.1, far: 160 },
} as const;

export const LOOP_CONFIG = {
  fixedDt: 1 / 60,
  maxFrameDelta: 0.1,
} as const;
