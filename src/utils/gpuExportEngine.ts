import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer';
import {
  BackgroundSettings,
  LightingSettings,
  CameraSettings,
  SceneSettings,
  AnimationSettings,
  MockupSettings,
} from '../types';
import { ENVIRONMENT_PRESETS } from '../data/models';

export interface GpuCapabilities {
  webgl2: boolean;
  webcodecs: boolean;
  h264Supported: boolean;
  vp9Supported: boolean;
  offscreenCanvas: boolean;
  maxTextureSize: number;
}

let cachedCapabilities: GpuCapabilities | null = null;

/**
 * Detect available GPU, rendering, and video encoding hardware capabilities.
 */
export async function detectGpuCapabilities(): Promise<GpuCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  let webgl2 = false;
  let maxTextureSize = 4096;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      webgl2 = true;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    }
  } catch {
    webgl2 = false;
  }

  const webcodecs = typeof window !== 'undefined' && 'VideoEncoder' in window;
  let h264Supported = false;
  let vp9Supported = false;

  if (webcodecs && typeof VideoEncoder.isConfigSupported === 'function') {
    try {
      const resH264 = await VideoEncoder.isConfigSupported({
        codec: 'avc1.420033',
        width: 1920,
        height: 1080,
        bitrate: 16_000_000,
        framerate: 60,
      });
      h264Supported = !!resH264.supported;
    } catch {
      h264Supported = false;
    }

    try {
      const resVp9 = await VideoEncoder.isConfigSupported({
        codec: 'vp09.00.10.08',
        width: 1920,
        height: 1080,
        bitrate: 16_000_000,
        framerate: 60,
      });
      vp9Supported = !!resVp9.supported;
    } catch {
      vp9Supported = false;
    }
  }

  const offscreenCanvas = typeof window !== 'undefined' && 'OffscreenCanvas' in window;

  cachedCapabilities = {
    webgl2,
    webcodecs,
    h264Supported,
    vp9Supported,
    offscreenCanvas,
    maxTextureSize,
  };

  return cachedCapabilities;
}

/**
 * Preload an image URL for background rendering
 */
async function preloadBgImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draw background onto a 2D canvas context (transparent, solid, gradient, image)
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  background: BackgroundSettings,
  bgImg: HTMLImageElement | null,
  isTransparent: boolean
) {
  if (isTransparent) {
    ctx.clearRect(0, 0, w, h);
    return;
  }

  if (background.type === 'gradient') {
    const angleRad = ((background.gradientAngle ?? 135) * Math.PI) / 180;
    const x0 = w / 2 - (Math.cos(angleRad) * w) / 2;
    const y0 = h / 2 - (Math.sin(angleRad) * h) / 2;
    const x1 = w / 2 + (Math.cos(angleRad) * w) / 2;
    const y1 = h / 2 + (Math.sin(angleRad) * h) / 2;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, background.color || '#262626');
    grad.addColorStop(1, background.color2 || '#0D0D0D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (background.type === 'image' && bgImg) {
    const imgAspect = bgImg.width / (bgImg.height || 1);
    const canvasAspect = w / h;
    let dw = w;
    let dh = h;
    let dx = 0;
    let dy = 0;
    if (imgAspect > canvasAspect) {
      dw = h * imgAspect;
      dx = (w - dw) / 2;
    } else {
      dh = w / imgAspect;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = background.color || '#0D0D0D';
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Calculate easing for turntable rotation
 */
export function calculateEasedProgress(t: number, easing?: string): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'easeIn':
      return Math.pow(clamped, 2.5);
    case 'easeOut':
      return 1 - Math.pow(1 - clamped, 2.5);
    case 'easeInOut':
      return clamped < 0.5
        ? 4 * Math.pow(clamped, 3)
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case 'linear':
    default:
      return clamped;
  }
}

/**
 * Get export resolution dimensions for specified ratio
 */
export function getExportDimensions(
  ratio: '16:9' | '1:1' | '9:16' | '4:5',
  is4K = true
): { width: number; height: number } {
  if (is4K) {
    switch (ratio) {
      case '16:9':
        return { width: 3840, height: 2160 };
      case '1:1':
        return { width: 2800, height: 2800 };
      case '9:16':
        return { width: 2160, height: 3840 };
      case '4:5':
        return { width: 2160, height: 2700 };
    }
  } else {
    // 1080p standards for high-bitrate video
    switch (ratio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '4:5':
        return { width: 1080, height: 1350 };
    }
  }
}

/**
 * Setup a dedicated offscreen Three.js scene, camera, lights, and floor
 */
function setupDedicatedScene(
  targetW: number,
  targetH: number,
  lighting: LightingSettings,
  cameraSettings: CameraSettings,
  sceneSettings: SceneSettings,
  ratio: '16:9' | '1:1' | '9:16' | '4:5'
) {
  const scene = new THREE.Scene();

  const aspect = targetW / targetH;
  const camera = new THREE.PerspectiveCamera(cameraSettings.fov, aspect, 0.1, 100);

  // Optical distance matching ratio
  const dist = ratio === '9:16' ? 3.9 : ratio === '4:5' ? 3.6 : 3.4;
  camera.position.set(0, 0, dist);
  camera.lookAt(0, 0, 0);

  // Setup studio lighting matching selected preset
  const preset =
    ENVIRONMENT_PRESETS.find((p) => p.id === lighting.environmentPreset) ||
    ENVIRONMENT_PRESETS[0];
  const intensityMult = lighting.environmentIntensity;

  const ambientLight = new THREE.AmbientLight(
    preset.ambientColor,
    preset.ambientIntensity * intensityMult
  );
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(
    preset.keyColor,
    preset.keyIntensity * intensityMult
  );
  const rad = (lighting.environmentRotation * Math.PI) / 180;
  const [kx, ky, kz] = preset.keyPos;
  dirLight.position.set(
    Math.cos(rad) * kx - Math.sin(rad) * kz,
    ky,
    Math.sin(rad) * kx + Math.cos(rad) * kz
  );
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096; // Ultra-crisp 4K shadow map
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.bias = -0.0001;
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(
    preset.rimColor,
    preset.rimIntensity * intensityMult
  );
  rimLight.position.set(...preset.rimPos);
  scene.add(rimLight);

  // Floor Shadow Receiver
  const shadowGeo = new THREE.PlaneGeometry(6, 6);
  const shadowMat = new THREE.ShadowMaterial({
    opacity:
      sceneSettings.shadowIntensity *
      (sceneSettings.floorShadow === 'contact' ? 0.6 : 0.35),
  });
  const floor = new THREE.Mesh(shadowGeo, shadowMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.2;
  floor.receiveShadow = true;
  floor.visible = sceneSettings.floorShadow !== 'none';
  scene.add(floor);

  return { scene, camera, ambientLight, dirLight, rimLight, floor };
}

/**
 * Setup a dedicated offscreen WebGL renderer with ACES Filmic Tone Mapping
 */
function createDedicatedRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, width: number, height: number) {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearAlpha(0);

  return renderer;
}

/**
 * RENDER HIGH-RESOLUTION STILL IMAGE (Offscreen Dedicated Pipeline)
 * Completely separate from viewport canvas.
 */
export async function renderHighResImage(params: {
  modelGroup: THREE.Group;
  background: BackgroundSettings;
  lighting: LightingSettings;
  cameraSettings: CameraSettings;
  sceneSettings: SceneSettings;
  format: 'png' | 'jpeg';
  ratio: '16:9' | '1:1' | '9:16' | '4:5';
  transparent: boolean;
  qualityMultiplier?: number;
}): Promise<string> {
  const {
    modelGroup,
    background,
    lighting,
    cameraSettings,
    sceneSettings,
    format,
    ratio,
    transparent,
    qualityMultiplier = 2,
  } = params;

  const baseDims = getExportDimensions(ratio, true);
  const targetW = Math.round((baseDims.width * qualityMultiplier) / 2);
  const targetH = Math.round((baseDims.height * qualityMultiplier) / 2);

  const bgImg =
    !transparent && background.type === 'image' && background.imageUrl
      ? await preloadBgImage(background.imageUrl)
      : null;

  // 1. Setup Offscreen Canvas & WebGLRenderer
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = targetW;
  offscreenCanvas.height = targetH;

  const renderer = createDedicatedRenderer(offscreenCanvas, targetW, targetH);
  const { scene, camera } = setupDedicatedScene(
    targetW,
    targetH,
    lighting,
    cameraSettings,
    sceneSettings,
    ratio
  );

  // 2. Clone model hierarchy for offscreen rendering
  const cloneGroup = modelGroup.clone(true);
  cloneGroup.position.set(0, 0.05, 0);
  cloneGroup.rotation.set(0, 0, 0); // Front view facing camera
  scene.add(cloneGroup);

  // Ensure materials in clone reference the current maps with maximum sharpness
  cloneGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial && m.map) {
          m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          m.needsUpdate = true;
        }
      });
    }
  });

  // 3. Render 3D Scene
  renderer.render(scene, camera);

  // 4. Composite onto high-res 2D canvas with background
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetW;
  finalCanvas.height = targetH;
  const ctx = finalCanvas.getContext('2d');
  if (!ctx) {
    renderer.dispose();
    throw new Error('Canvas 2D context unavailable');
  }

  drawBackground(ctx, targetW, targetH, background, bgImg, transparent && format === 'png');
  ctx.drawImage(offscreenCanvas, 0, 0, targetW, targetH);

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = finalCanvas.toDataURL(mimeType, 0.96);

  // 5. Clean up temporary GPU and DOM resources
  scene.remove(cloneGroup);
  renderer.dispose();

  return dataUrl;
}

/**
 * TURNTABLE 360° VIDEO RENDERING (GPU-Accelerated WebCodecs + Muxer Pipeline)
 * Falls back automatically to MediaRecorder if WebCodecs is not supported.
 */
export async function renderTurntableVideo(params: {
  modelGroup: THREE.Group;
  background: BackgroundSettings;
  lighting: LightingSettings;
  cameraSettings: CameraSettings;
  sceneSettings: SceneSettings;
  animation: AnimationSettings;
  fps: number;
  durationSec: number;
  format: 'webm' | 'mp4';
  ratio: '16:9' | '1:1' | '9:16' | '4:5';
  transparent: boolean;
  onProgress: (p: number) => void;
}): Promise<Blob> {
  const {
    modelGroup,
    background,
    lighting,
    cameraSettings,
    sceneSettings,
    animation,
    fps,
    durationSec,
    format,
    ratio,
    transparent,
    onProgress,
  } = params;

  const dims = getExportDimensions(ratio, false);
  const targetW = dims.width;
  const targetH = dims.height;
  const targetFps = fps || animation.fps || 60;
  const totalFrames = Math.max(targetFps, Math.round(durationSec * targetFps));

  const bgImg =
    !transparent && background.type === 'image' && background.imageUrl
      ? await preloadBgImage(background.imageUrl)
      : null;

  // 1. Setup Offscreen Render Surface
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = targetW;
  offscreenCanvas.height = targetH;

  const renderer = createDedicatedRenderer(offscreenCanvas, targetW, targetH);
  const { scene, camera } = setupDedicatedScene(
    targetW,
    targetH,
    lighting,
    cameraSettings,
    sceneSettings,
    ratio
  );

  // 2. Clone model for independent turntable rotation
  const cloneGroup = modelGroup.clone(true);
  cloneGroup.position.set(0, 0.05, 0);
  cloneGroup.rotation.set(0, 0, 0);
  scene.add(cloneGroup);

  cloneGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 3. Pre-render static background on cached 2D canvas once
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = targetW;
  bgCanvas.height = targetH;
  const bgCtx = bgCanvas.getContext('2d');
  if (bgCtx) {
    if (transparent && format === 'webm') {
      bgCtx.clearRect(0, 0, targetW, targetH);
    } else {
      drawBackground(bgCtx, targetW, targetH, background, bgImg, false);
    }
  }

  // 4. Composite 2D canvas that combines background + 3D frame
  const compCanvas = document.createElement('canvas');
  compCanvas.width = targetW;
  compCanvas.height = targetH;
  const compCtx = compCanvas.getContext('2d');
  if (!compCtx) {
    renderer.dispose();
    throw new Error('Composition canvas 2D context unavailable');
  }

  // Check WebCodecs availability
  const caps = await detectGpuCapabilities();
  const canUseWebCodecs =
    caps.webcodecs &&
    ((format === 'mp4' && caps.h264Supported) || (format === 'webm' && caps.vp9Supported));

  if (canUseWebCodecs) {
    try {
      return await encodeWithWebCodecs({
        format,
        targetW,
        targetH,
        targetFps,
        totalFrames,
        transparent,
        animation,
        cloneGroup,
        renderer,
        scene,
        camera,
        compCanvas,
        compCtx,
        bgCanvas,
        offscreenCanvas,
        onProgress,
      });
    } catch (err) {
      console.warn('WebCodecs encoding encountered error, falling back to MediaRecorder:', err);
    }
  }

  // Tier 2: MediaRecorder Fallback Pipeline
  return await encodeWithMediaRecorder({
    format,
    targetW,
    targetH,
    targetFps,
    totalFrames,
    transparent,
    animation,
    cloneGroup,
    renderer,
    scene,
    camera,
    compCanvas,
    compCtx,
    bgCanvas,
    offscreenCanvas,
    onProgress,
  });
}

/**
 * WebCodecs Dedicated GPU Encoder (Frame-controlled, zero dropped frames)
 */
async function encodeWithWebCodecs(params: {
  format: 'webm' | 'mp4';
  targetW: number;
  targetH: number;
  targetFps: number;
  totalFrames: number;
  transparent: boolean;
  animation: AnimationSettings;
  cloneGroup: THREE.Group;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  compCanvas: HTMLCanvasElement;
  compCtx: CanvasRenderingContext2D;
  bgCanvas: HTMLCanvasElement;
  offscreenCanvas: HTMLCanvasElement;
  onProgress: (p: number) => void;
}): Promise<Blob> {
  const {
    format,
    targetW,
    targetH,
    targetFps,
    totalFrames,
    transparent,
    animation,
    cloneGroup,
    renderer,
    scene,
    camera,
    compCanvas,
    compCtx,
    bgCanvas,
    offscreenCanvas,
    onProgress,
  } = params;

  if (format === 'mp4') {
    const muxer = new Mp4Muxer({
      target: new Mp4Target(),
      video: {
        codec: 'avc',
        width: targetW,
        height: targetH,
      },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error:', e),
    });

    await videoEncoder.configure({
      codec: 'avc1.420033', // H.264 Baseline Level 5.1
      width: targetW,
      height: targetH,
      bitrate: 18_000_000,
      framerate: targetFps,
    });

    for (let i = 0; i < totalFrames; i++) {
      const progressRatio = i / totalFrames;
      onProgress(Math.min(99, Math.round(progressRatio * 100)));

      const easedProgress = calculateEasedProgress(progressRatio, animation.easing);
      cloneGroup.rotation.y = easedProgress * Math.PI * 2;
      renderer.render(scene, camera);

      compCtx.drawImage(bgCanvas, 0, 0);
      compCtx.drawImage(offscreenCanvas, 0, 0);

      const timestampMicros = Math.round((i * 1_000_000) / targetFps);
      const videoFrame = new VideoFrame(compCanvas, { timestamp: timestampMicros });
      videoEncoder.encode(videoFrame, { keyFrame: i % (targetFps * 2) === 0 });
      videoFrame.close();

      // Yield execution periodically to maintain browser UI smoothness
      if (i % 4 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    muxer.finalize();

    renderer.dispose();
    onProgress(100);

    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  } else {
    // WebM container with VP9
    const muxer = new WebmMuxer({
      target: new WebmTarget(),
      video: {
        codec: 'V_VP9',
        width: targetW,
        height: targetH,
        alpha: transparent,
      },
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VP9 VideoEncoder error:', e),
    });

    await videoEncoder.configure({
      codec: 'vp09.00.10.08',
      width: targetW,
      height: targetH,
      bitrate: 18_000_000,
      framerate: targetFps,
      alpha: transparent ? 'keep' : 'discard',
    });

    for (let i = 0; i < totalFrames; i++) {
      const progressRatio = i / totalFrames;
      onProgress(Math.min(99, Math.round(progressRatio * 100)));

      const easedProgress = calculateEasedProgress(progressRatio, animation.easing);
      cloneGroup.rotation.y = easedProgress * Math.PI * 2;
      renderer.render(scene, camera);

      if (transparent) {
        compCtx.clearRect(0, 0, targetW, targetH);
      } else {
        compCtx.drawImage(bgCanvas, 0, 0);
      }
      compCtx.drawImage(offscreenCanvas, 0, 0);

      const timestampMicros = Math.round((i * 1_000_000) / targetFps);
      const videoFrame = new VideoFrame(compCanvas, { timestamp: timestampMicros });
      videoEncoder.encode(videoFrame, { keyFrame: i % (targetFps * 2) === 0 });
      videoFrame.close();

      if (i % 4 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    muxer.finalize();

    renderer.dispose();
    onProgress(100);

    return new Blob([muxer.target.buffer], { type: 'video/webm' });
  }
}

/**
 * MediaRecorder Fallback Pipeline (Frame-by-frame with exact angle control)
 */
async function encodeWithMediaRecorder(params: {
  format: 'webm' | 'mp4';
  targetW: number;
  targetH: number;
  targetFps: number;
  totalFrames: number;
  transparent: boolean;
  animation: AnimationSettings;
  cloneGroup: THREE.Group;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  compCanvas: HTMLCanvasElement;
  compCtx: CanvasRenderingContext2D;
  bgCanvas: HTMLCanvasElement;
  offscreenCanvas: HTMLCanvasElement;
  onProgress: (p: number) => void;
}): Promise<Blob> {
  const {
    format,
    targetW,
    targetH,
    targetFps,
    totalFrames,
    transparent,
    animation,
    cloneGroup,
    renderer,
    scene,
    camera,
    compCanvas,
    compCtx,
    bgCanvas,
    offscreenCanvas,
    onProgress,
  } = params;

  const stream = compCanvas.captureStream(targetFps);

  let mimeType = 'video/webm;codecs=vp9';
  if (format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    mimeType = 'video/webm;codecs=vp9';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    mimeType = 'video/webm;codecs=vp8';
  } else {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 18_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      renderer.dispose();
      onProgress(100);
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.onerror = (e) => {
      renderer.dispose();
      reject(e);
    };

    recorder.start();

    // Initial render
    renderer.render(scene, camera);
    if (transparent && format === 'webm') {
      compCtx.clearRect(0, 0, targetW, targetH);
    } else {
      compCtx.drawImage(bgCanvas, 0, 0);
    }
    compCtx.drawImage(offscreenCanvas, 0, 0);

    setTimeout(async () => {
      const frameInterval = 1000 / targetFps;
      const startTime = performance.now();

      for (let i = 0; i < totalFrames; i++) {
        const progressRatio = i / totalFrames;
        onProgress(Math.min(99, Math.round(progressRatio * 100)));

        const easedProgress = calculateEasedProgress(progressRatio, animation.easing);
        cloneGroup.rotation.y = easedProgress * Math.PI * 2;
        renderer.render(scene, camera);

        if (transparent && format === 'webm') {
          compCtx.clearRect(0, 0, targetW, targetH);
        } else {
          compCtx.drawImage(bgCanvas, 0, 0);
        }
        compCtx.drawImage(offscreenCanvas, 0, 0);

        const targetTime = startTime + (i + 1) * frameInterval;
        const now = performance.now();
        const delay = Math.max(0, targetTime - now);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 60);
    }, 40);
  });
}

/**
 * 3D MODEL EXPORT: Professional glTF/GLB Exporter
 * - Preserves original mesh geometry & UV layout
 * - Bakes and embeds high-resolution 4096px PBR canvas texture
 * - Maintains roughness, metalness, and proper sRGB color space
 */
export async function exportCustomizedGLB(params: {
  modelGroup: THREE.Group;
  textureCanvas: HTMLCanvasElement;
  mockup: MockupSettings;
}): Promise<Blob> {
  const { modelGroup, textureCanvas, mockup } = params;

  const exporter = new GLTFExporter();

  // 1. Create a clean isolated clone of the model hierarchy
  const clone = modelGroup.clone(true);
  clone.position.set(0, 0, 0);
  clone.rotation.set(0, 0, 0);

  // 2. Prepare embedded CanvasTexture with exact UV settings
  const exportTexture = new THREE.CanvasTexture(textureCanvas);
  exportTexture.colorSpace = THREE.SRGBColorSpace;
  exportTexture.flipY = false;
  exportTexture.wrapS = THREE.ClampToEdgeWrapping;
  exportTexture.wrapT = THREE.ClampToEdgeWrapping;
  exportTexture.offset.set(0, 0);
  exportTexture.repeat.set(1, 1);
  exportTexture.center.set(0, 0);
  exportTexture.rotation = 0;
  exportTexture.generateMipmaps = true;
  exportTexture.minFilter = THREE.LinearMipmapLinearFilter;
  exportTexture.magFilter = THREE.LinearFilter;
  exportTexture.needsUpdate = true;

  // 3. Attach PBR material to every mesh while preserving geometry and UVs
  const createdMaterials: THREE.MeshStandardMaterial[] = [];
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const pbrMat = new THREE.MeshStandardMaterial({
        name: 'JerseyPBRMaterial',
        color: 0xffffff,
        map: exportTexture,
        roughness: mockup.roughness ?? 0.7,
        metalness: mockup.metalness ?? 0.1,
      });
      child.material = pbrMat;
      createdMaterials.push(pbrMat);
    }
  });

  // 4. Export binary glTF (GLB) with embedded textures
  const glbBuffer = (await exporter.parseAsync(clone, {
    binary: true,
    embedImages: true,
    maxTextureSize: 4096,
  })) as ArrayBuffer;

  // 5. Clean up memory
  exportTexture.dispose();
  createdMaterials.forEach((m) => m.dispose());

  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
}
