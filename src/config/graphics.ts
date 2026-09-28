export const GRAPHICS_CONFIG = {
  maxPixelRatio: 1.5,
  background: 0x1c302e,
  fogNear: 22,
  fogFar: 78,
  camera: { fov: 52, near: 0.1, far: 160 },
} as const;

export const LOOP_CONFIG = {
  fixedDt: 1 / 60,
  maxFrameDelta: 0.1,
} as const;
