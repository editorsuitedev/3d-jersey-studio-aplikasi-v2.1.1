export interface JerseyModel {
  id: string;
  name: string;
  modelUrl: string;
  fallbackUrl?: string;
  thumbnailUrl?: string;
  uvMapUrl: string;
  externalUvMapUrl?: string;
  category: string;
  description: string;
  tier?: 'free' | 'pro';
}

export type MaterialPreset = 'basic' | 'matte' | 'glossy' | 'fabric' | 'metallic';

export interface DesignLayer {
  id: string;
  name: string;
  dataUrl: string;
  x: number; // 0 to 1 relative to UV canvas width (center X)
  y: number; // 0 to 1 relative to UV canvas height (center Y)
  width: number; // 0 to 1 relative to UV canvas width
  height: number; // 0 to 1 relative to UV canvas height
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  visible: boolean;
}

export interface MockupSettings {
  modelId: string;
  baseColor: string; // Applied to all meshes
  accentColor: string;
  collarColor: string;
  sleeveColor: string;
  pattern: 'solid' | 'stripes' | 'camo' | 'cyber_hex' | 'retro_slash' | 'gradient' | 'carbon';
  materialPreset: MaterialPreset;
  roughness: number;
  metalness: number;
  fabricSheen: number;
  customTextureUrl: string | null;
  layers: DesignLayer[];
  activeLayerId: string | null;
}

export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string; // Base / Color 1
  color2: string; // Gradient Color 2
  gradientAngle?: number; // In degrees, default 135
  imageUrl?: string | null; // Uploaded custom background image
  colorSpace: 'sRGB' | 'Display-P3';
}

export interface LightingSettings {
  mode: 'environment' | 'directional';
  environmentPreset: string;
  environmentIntensity: number;
  environmentRotation: number;
  directionalIntensity: number;
  directionalColor: string;
  directionalX: number;
  directionalY: number;
  directionalZ: number;
  ambientIntensity: number;
}

export interface CameraSettings {
  fov: number;
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface SceneSettings {
  floorShadow: 'none' | 'soft' | 'contact';
  shadowIntensity: number;
  groundReflection: boolean;
}

export interface TransformSettings {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  scale: number;
}

export interface AnimationSettings {
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // total turntable duration (e.g. 10s)
  speed: number; // 0.5x, 1x, 1.5x, 2x
  loop: boolean;
  isHQ: boolean;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  fps?: 24 | 30 | 60;
}

export type ActiveTool = 'mockups' | 'hanger' | 'mannequin' | 'design' | 'uv_editor';
