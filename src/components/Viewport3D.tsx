import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  JerseyModel,
  MockupSettings,
  BackgroundSettings,
  LightingSettings,
  CameraSettings,
  SceneSettings,
  TransformSettings,
  AnimationSettings,
} from '../types';
import { JerseyTextureGenerator } from '../utils/textureGenerator';
import { ViewportGizmo } from './ViewportGizmo';
import { ENVIRONMENT_PRESETS } from '../data/models';
import { Loader2 } from 'lucide-react';

export interface Viewport3DHandle {
  captureScreenshot: (
    format: 'png' | 'jpeg',
    qualityMultiplier?: number,
    ratio?: '16:9' | '1:1' | '9:16' | '4:5',
    transparent?: boolean
  ) => Promise<string>;
  recordTurntableVideo: (
    fps: number,
    durationSec: number,
    format: 'webm' | 'mp4',
    ratio: '16:9' | '1:1' | '9:16' | '4:5',
    transparent: boolean,
    onProgress: (p: number) => void
  ) => Promise<Blob>;
  snapCamera: (view: 'front' | 'back' | 'left' | 'right' | 'top') => void;
}

interface Viewport3DProps {
  currentModel: JerseyModel;
  mockup: MockupSettings;
  background: BackgroundSettings;
  lighting: LightingSettings;
  cameraSettings: CameraSettings;
  sceneSettings: SceneSettings;
  transform: TransformSettings;
  animation: AnimationSettings;
  onChangeAnimation: (updates: Partial<AnimationSettings>) => void;
  onChangeTransform: (updates: Partial<TransformSettings>) => void;
  onChangeCamera?: (updates: Partial<CameraSettings>) => void;
  onLoadedModel?: () => void;
}

export const Viewport3D = forwardRef<Viewport3DHandle, Viewport3DProps>(
  (
    {
      currentModel,
      mockup,
      background,
      lighting,
      cameraSettings,
      sceneSettings,
      transform,
      animation,
      onChangeAnimation,
      onChangeTransform,
      onChangeCamera,
      onLoadedModel,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js Core Refs
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelGroupRef = useRef<THREE.Group | null>(null);
    const currentLoadIdRef = useRef<number>(0);
    const floorMeshRef = useRef<THREE.Mesh | null>(null);

    // Dynamic Materials & Textures
    const activeMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const textureGeneratorRef = useRef<JerseyTextureGenerator | null>(null);

    // Lights
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
    const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

    // Loading & Error States
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadProgress, setLoadProgress] = useState<number>(0);

    // Turntable animation references
    const [currentRotationY, setCurrentRotationY] = useState<number>(0);
    const animationRef = useRef(animation);
    const currentTimeRef = useRef(animation.currentTime);
    const lastTimelineSyncRef = useRef<number>(0);
    const isRecordingRef = useRef<boolean>(false);

    // Helper for easing turntable rotation
    const calculateEasedProgress = (t: number, easing?: string) => {
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
    };

    // Keep animation ref updated
    useEffect(() => {
      animationRef.current = animation;
      if (!animation.isPlaying && modelGroupRef.current) {
        currentTimeRef.current = animation.currentTime;
        const progress = calculateEasedProgress(
          animation.currentTime / animation.duration,
          animation.easing
        );
        const angle = progress * Math.PI * 2;
        modelGroupRef.current.rotation.y = angle;
        setCurrentRotationY(angle);
      }
    }, [animation.isPlaying, animation.currentTime, animation.duration, animation.speed, animation.loop, animation.easing]);

    // Initialize Three.js Scene
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;
      const camera = new THREE.PerspectiveCamera(cameraSettings.fov, width / height, 0.1, 100);
      camera.position.set(0, 0, 3.4);
      cameraRef.current = camera;

      // 3. Renderer with high color fidelity & tone mapping
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;

      // 4. OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.2;
      controls.maxDistance = 7.0;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // 5. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);
      ambientLightRef.current = ambientLight;

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(2, 4, 3);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.bias = -0.0001;
      scene.add(dirLight);
      dirLightRef.current = dirLight;

      const rimLight = new THREE.DirectionalLight(0xe0e7ff, 0.9);
      rimLight.position.set(-3, 2, -3);
      scene.add(rimLight);
      rimLightRef.current = rimLight;

      // 6. Floor Shadow Receiver
      const shadowGeo = new THREE.PlaneGeometry(6, 6);
      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const floor = new THREE.Mesh(shadowGeo, shadowMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.2;
      floor.receiveShadow = true;
      floor.visible = sceneSettings.floorShadow !== 'none';
      scene.add(floor);
      floorMeshRef.current = floor;

      // 7. Texture Generator (4096px x 4096px high resolution UV)
      textureGeneratorRef.current = new JerseyTextureGenerator(4096);

      // Animation Loop
      let animationFrameId: number;
      let lastTime = performance.now();

      const animate = (time: number) => {
        animationFrameId = requestAnimationFrame(animate);

        // While recording video, the export loop has exclusive rendering control to prevent stutter and frame drops
        if (isRecordingRef.current) {
          lastTime = time;
          return;
        }

        const delta = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        controls.update();

        // If turntable animation is playing, advance timeline and spin model smoothly
        const currentAnim = animationRef.current;
        if (currentAnim.isPlaying && modelGroupRef.current) {
          const step = delta * currentAnim.speed;
          currentTimeRef.current += step;

          if (currentTimeRef.current >= currentAnim.duration) {
            if (currentAnim.loop) {
              currentTimeRef.current = currentTimeRef.current % currentAnim.duration;
            } else {
              currentTimeRef.current = currentAnim.duration;
              onChangeAnimation({ isPlaying: false, currentTime: currentAnim.duration });
            }
          }

          // Calculate 360 degree rotation with easing
          const progress = calculateEasedProgress(
            currentTimeRef.current / currentAnim.duration,
            currentAnim.easing
          );
          const angle = progress * Math.PI * 2;
          modelGroupRef.current.rotation.y = angle;
          setCurrentRotationY(angle);

          // Throttled sync to avoid re-rendering entire React app every 16ms
          if (time - lastTimelineSyncRef.current > 100) {
            lastTimelineSyncRef.current = time;
            onChangeAnimation({ currentTime: currentTimeRef.current });
          }
        }

        renderer.render(scene, camera);
      };

      animationFrameId = requestAnimationFrame(animate);

      // ResizeObserver
      const resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      });
      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
      };
    }, []);

    // Load Model (GLB) with Race-Condition & Duplication Prevention
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      const loadId = ++currentLoadIdRef.current;

      setIsLoading(true);
      setLoadError(null);
      setLoadProgress(0);

      // Cleanly dispose and remove a model hierarchy
      const removeModelHierarchy = (obj: THREE.Object3D) => {
        scene.remove(obj);
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      };

      // 1. Remove existing model group if present
      if (modelGroupRef.current) {
        removeModelHierarchy(modelGroupRef.current);
        modelGroupRef.current = null;
      }

      // 2. Also proactively scan and purge any leftover model groups by name tag
      const existingModelObj = scene.getObjectByName('ACTIVE_JERSEY_MODEL');
      if (existingModelObj) {
        removeModelHierarchy(existingModelObj);
      }

      const loader = new GLTFLoader();

      const loadModelWithFallback = (targetUrl: string, isRetry: boolean = false) => {
        loader.load(
          targetUrl,
          (gltf) => {
            // Guard: If another model started loading while this was downloading, ignore this stale result
            if (loadId !== currentLoadIdRef.current) {
              gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.geometry?.dispose();
                  if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                  } else {
                    child.material?.dispose();
                  }
                }
              });
              return;
            }

            // Ensure no other model exists in the scene before mounting
            if (modelGroupRef.current) {
              removeModelHierarchy(modelGroupRef.current);
              modelGroupRef.current = null;
            }
            const lingering = scene.getObjectByName('ACTIVE_JERSEY_MODEL');
            if (lingering) {
              removeModelHierarchy(lingering);
            }

            const root = gltf.scene;
            activeMaterialsRef.current = [];

            // Compute bounding box to normalize scale and center model
            const box = new THREE.Box3().setFromObject(root);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Scale so the jersey is slightly smaller on initial view per user request (~1.62 units)
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.62 / (maxDim || 1);
            root.scale.set(scale, scale, scale);

            // Center geometry at origin
            root.position.x = -center.x * scale;
            root.position.y = -center.y * scale + 0.05;
            root.position.z = -center.z * scale;

            const group = new THREE.Group();
            group.name = 'ACTIVE_JERSEY_MODEL';
            group.add(root);
            scene.add(group);
            modelGroupRef.current = group;

            // Apply transforms
            group.rotation.x = (transform.rotationX * Math.PI) / 180;
            group.rotation.y = (transform.rotationY * Math.PI) / 180;
            group.rotation.z = (transform.rotationZ * Math.PI) / 180;

            // Inspect and prepare materials for all meshes
            root.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((m) => {
                      if (m instanceof THREE.MeshStandardMaterial) {
                        m.color.set('#ffffff'); // pure white so texture colors are 100% accurate
                        activeMaterialsRef.current.push(m);
                      }
                    });
                  } else if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.color.set('#ffffff');
                    activeMaterialsRef.current.push(child.material);
                  }
                }
              }
            });

            // Trigger texture update with current settings across all meshes
            updateTexture();

            setIsLoading(false);
            setLoadProgress(100);
            if (onLoadedModel) onLoadedModel();
          },
          (xhr) => {
            if (xhr.total > 0 && loadId === currentLoadIdRef.current) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (error) => {
            if (loadId !== currentLoadIdRef.current) return;
            console.warn(`Failed to load model from ${targetUrl}:`, error);
            if (!isRetry && currentModel.fallbackUrl && currentModel.fallbackUrl !== targetUrl) {
              console.log(`Retrying with fallback: ${currentModel.fallbackUrl}`);
              loadModelWithFallback(currentModel.fallbackUrl, true);
            } else {
              setLoadError('Failed to load 3D model. Please verify your connection.');
              setIsLoading(false);
            }
          }
        );
      };

      loadModelWithFallback(currentModel.modelUrl);

      return () => {
        // Invalidate in-flight loads when unmounting or switching models
        currentLoadIdRef.current++;
      };
    }, [currentModel.id]);

    // Update Texture Generator whenever mockup settings change
    const updateTexture = async () => {
      const gen = textureGeneratorRef.current;
      if (!gen) return;

      if (mockup.customTextureUrl) {
        await gen.setCustomFullTexture(mockup.customTextureUrl);
      } else {
        await gen.setCustomFullTexture(null);
      }

      // Preload layer images
      if (mockup.layers && mockup.layers.length > 0) {
        await gen.prepareLayers(mockup.layers);
      }

      // Render to texture canvas
      gen.render(mockup);

      // Re-apply to all active mesh materials (ensuring 100% mesh coverage)
      activeMaterialsRef.current.forEach((mat) => {
        mat.map = gen.getTexture();
        mat.color.set('#ffffff');
        mat.roughness = mockup.roughness;
        mat.metalness = mockup.metalness;
        mat.needsUpdate = true;
      });
    };

    useEffect(() => {
      updateTexture();
    }, [
      mockup.baseColor,
      mockup.roughness,
      mockup.metalness,
      mockup.customTextureUrl,
      mockup.layers,
    ]);

    // Update Lighting from ENVIRONMENT_PRESETS
    useEffect(() => {
      const preset =
        ENVIRONMENT_PRESETS.find((p) => p.id === lighting.environmentPreset) ||
        ENVIRONMENT_PRESETS[0];

      const intensityMult = lighting.environmentIntensity;

      if (ambientLightRef.current) {
        ambientLightRef.current.color.set(preset.ambientColor);
        ambientLightRef.current.intensity = preset.ambientIntensity * intensityMult;
      }

      if (dirLightRef.current) {
        dirLightRef.current.color.set(preset.keyColor);
        dirLightRef.current.intensity = preset.keyIntensity * intensityMult;

        const rad = (lighting.environmentRotation * Math.PI) / 180;
        const [kx, ky, kz] = preset.keyPos;
        dirLightRef.current.position.set(
          Math.cos(rad) * kx - Math.sin(rad) * kz,
          ky,
          Math.sin(rad) * kx + Math.cos(rad) * kz
        );
      }

      if (rimLightRef.current) {
        rimLightRef.current.color.set(preset.rimColor);
        rimLightRef.current.intensity = preset.rimIntensity * intensityMult;
        rimLightRef.current.position.set(...preset.rimPos);
      }
    }, [lighting]);

    // Update Floor Shadow
    useEffect(() => {
      if (!floorMeshRef.current) return;
      if (sceneSettings.floorShadow === 'none') {
        floorMeshRef.current.visible = false;
      } else {
        floorMeshRef.current.visible = true;
        const mat = floorMeshRef.current.material as THREE.ShadowMaterial;
        mat.opacity = sceneSettings.shadowIntensity * (sceneSettings.floorShadow === 'contact' ? 0.6 : 0.35);
      }
    }, [sceneSettings]);

    // Update Camera FOV
    useEffect(() => {
      if (cameraRef.current) {
        cameraRef.current.fov = cameraSettings.fov;
        cameraRef.current.updateProjectionMatrix();
      }
    }, [cameraSettings.fov]);

    // Update Transforms (Rotation)
    useEffect(() => {
      if (!modelGroupRef.current) return;
      if (!animation.isPlaying) {
        modelGroupRef.current.rotation.x = (transform.rotationX * Math.PI) / 180;
        modelGroupRef.current.rotation.y = (transform.rotationY * Math.PI) / 180;
        modelGroupRef.current.rotation.z = (transform.rotationZ * Math.PI) / 180;
      }
    }, [transform.rotationX, transform.rotationY, transform.rotationZ, animation.isPlaying]);

    // Smooth Camera Transition (Non-instant easeInOutCubic animation)
    const animateCameraTo = (
      targetPos: THREE.Vector3,
      targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
      duration = 550
    ) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const startPos = cameraRef.current.position.clone();
      const startTarget = controlsRef.current.target.clone();
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth easeInOutCubic
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        cameraRef.current?.position.lerpVectors(startPos, targetPos, ease);
        controlsRef.current?.target.lerpVectors(startTarget, targetLookAt, ease);
        controlsRef.current?.update();

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    // Smooth FOV animation (easeOutCubic) for +/- buttons & reset
    const fovAnimRef = useRef<{
      frameId: number | null;
      targetFov: number;
    }>({
      frameId: null,
      targetFov: cameraSettings.fov || 35,
    });

    const animateFovTo = (targetFov: number, duration = 320) => {
      if (!cameraRef.current) return;
      if (fovAnimRef.current.frameId) {
        cancelAnimationFrame(fovAnimRef.current.frameId);
      }
      fovAnimRef.current.targetFov = targetFov;
      const startFov = cameraRef.current.fov;
      const startTime = performance.now();

      const stepFov = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth cubic ease-out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentFov = startFov + (targetFov - startFov) * ease;
        if (cameraRef.current) {
          cameraRef.current.fov = currentFov;
          cameraRef.current.updateProjectionMatrix();
        }

        if (progress < 1) {
          fovAnimRef.current.frameId = requestAnimationFrame(stepFov);
        } else {
          fovAnimRef.current.frameId = null;
          onChangeCamera?.({ fov: Math.round(targetFov) });
        }
      };

      fovAnimRef.current.frameId = requestAnimationFrame(stepFov);
    };

    // Smooth Reset Camera & Model Rotation
    const handleSmoothReset = () => {
      // 1. Smooth camera translation and target
      animateCameraTo(new THREE.Vector3(0, 0, 3.2), new THREE.Vector3(0, 0, 0), 550);

      // 2. Smooth FOV reset back to 35°
      animateFovTo(35, 550);

      // 3. Smooth model rotation return to 0 (if rotated)
      if (modelGroupRef.current) {
        const startX = modelGroupRef.current.rotation.x;
        const startY = modelGroupRef.current.rotation.y;
        const startZ = modelGroupRef.current.rotation.z;
        const startTime = performance.now();
        const duration = 550;

        const stepRot = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          if (modelGroupRef.current) {
            modelGroupRef.current.rotation.x = startX * (1 - ease);
            modelGroupRef.current.rotation.y = startY * (1 - ease);
            modelGroupRef.current.rotation.z = startZ * (1 - ease);
          }

          if (progress < 1) {
            requestAnimationFrame(stepRot);
          } else {
            onChangeTransform({ rotationX: 0, rotationY: 0, rotationZ: 0 });
          }
        };
        requestAnimationFrame(stepRot);
      } else {
        onChangeTransform({ rotationX: 0, rotationY: 0, rotationZ: 0 });
      }
    };

    const handleSnapCamera = (view: 'front' | 'back' | 'left' | 'right' | 'top') => {
      const dist = 3.4;
      const targetPos = new THREE.Vector3(0, 0, dist);
      if (view === 'front') targetPos.set(0, 0, dist);
      else if (view === 'back') targetPos.set(0, 0, -dist);
      else if (view === 'left') targetPos.set(-dist, 0, 0);
      else if (view === 'right') targetPos.set(dist, 0, 0);
      else if (view === 'top') targetPos.set(0, dist, 0.01);
      animateCameraTo(targetPos, new THREE.Vector3(0, 0, 0), 550);
    };

    // Helper to draw background onto a 2D canvas context
    const drawBackgroundOnCanvas = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      bgImg: HTMLImageElement | null,
      isTransparent: boolean
    ) => {
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
    };

    // Expose Imperative Methods for Captures & Exports
    useImperativeHandle(ref, () => ({
      snapCamera: handleSnapCamera,

      captureScreenshot: async (
        format: 'png' | 'jpeg',
        qualityMultiplier = 2,
        ratio: '16:9' | '1:1' | '9:16' | '4:5' = '1:1',
        transparent: boolean = false
      ): Promise<string> => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer || !scene || !camera) {
          throw new Error('Renderer not initialized');
        }

        // Preload custom background image if applicable
        let bgImg: HTMLImageElement | null = null;
        if (!transparent && background.type === 'image' && background.imageUrl) {
          bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.src = background.imageUrl;
          await new Promise((resolve) => {
            if (!bgImg) return resolve(null);
            if (bgImg.complete) return resolve(null);
            bgImg.onload = () => resolve(null);
            bgImg.onerror = () => resolve(null);
          });
        }

        const originalSize = new THREE.Vector2();
        renderer.getSize(originalSize);
        const originalAspect = camera.aspect;
        const originalClearAlpha = renderer.getClearAlpha();

        // Calculate aspect ratio dimensions (standard high-res base)
        let baseW = 3840;
        let baseH = 2160;
        if (ratio === '16:9') {
          baseW = 3840;
          baseH = 2160;
        } else if (ratio === '1:1') {
          baseW = 2800;
          baseH = 2800;
        } else if (ratio === '9:16') {
          baseW = 2160;
          baseH = 3840;
        } else if (ratio === '4:5') {
          baseW = 2160;
          baseH = 2700;
        }

        const targetW = Math.round((baseW * qualityMultiplier) / 2);
        const targetH = Math.round((baseH * qualityMultiplier) / 2);

        renderer.setSize(targetW, targetH, false);
        camera.aspect = targetW / targetH;
        camera.updateProjectionMatrix();

        renderer.setClearAlpha(0);
        renderer.render(scene, camera);

        // Composite onto high-res 2D canvas with current live background
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetW;
        exportCanvas.height = targetH;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        drawBackgroundOnCanvas(ctx, targetW, targetH, bgImg, transparent && format === 'png');
        ctx.drawImage(renderer.domElement, 0, 0, targetW, targetH);

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = exportCanvas.toDataURL(mimeType, 0.95);

        // Restore original render state
        renderer.setSize(originalSize.x, originalSize.y, true);
        camera.aspect = originalAspect;
        camera.updateProjectionMatrix();
        renderer.setClearAlpha(originalClearAlpha);
        renderer.render(scene, camera);

        return dataUrl;
      },

      recordTurntableVideo: async (
        _fps: number,
        durationSec: number,
        format: 'webm' | 'mp4',
        ratio: '16:9' | '1:1' | '9:16' | '4:5',
        transparent: boolean,
        onProgress: (p: number) => void
      ): Promise<Blob> => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const model = modelGroupRef.current;
        const controls = controlsRef.current;
        if (!scene || !camera || !renderer || !model) {
          throw new Error('Canvas not ready for recording');
        }

        // Follow requested FPS from app settings or passed param (24, 30, 60)
        const targetFps = _fps || animationRef.current.fps || 60;
        const totalFrames = Math.max(targetFps, Math.round(durationSec * targetFps));
        const frameIntervalMs = 1000 / targetFps;

        // Tell the background animation loop to stop rendering while we record
        isRecordingRef.current = true;

        // Preload custom background image if applicable
        let bgImg: HTMLImageElement | null = null;
        if (!transparent && background.type === 'image' && background.imageUrl) {
          bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.src = background.imageUrl;
          await new Promise((resolve) => {
            if (!bgImg) return resolve(null);
            if (bgImg.complete) return resolve(null);
            bgImg.onload = () => resolve(null);
            bgImg.onerror = () => resolve(null);
          });
        }

        // 1. Save original viewport state to restore cleanly after export
        const originalSize = new THREE.Vector2();
        renderer.getSize(originalSize);
        const originalAspect = camera.aspect;
        const originalFov = camera.fov;
        const originalClearAlpha = renderer.getClearAlpha();
        const originalCamPos = camera.position.clone();
        const originalCamRot = camera.rotation.clone();
        const originalControlsTarget = controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0);
        const originalModelRot = { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z };
        const originalModelPos = { x: model.position.x, y: model.position.y, z: model.position.z };

        // 2. Video resolutions matching selected ratio (crisp 1080p standards)
        let recW = 1920;
        let recH = 1080;
        if (ratio === '16:9') {
          recW = 1920;
          recH = 1080;
        } else if (ratio === '1:1') {
          recW = 1080;
          recH = 1080;
        } else if (ratio === '9:16') {
          recW = 1080;
          recH = 1920;
        } else if (ratio === '4:5') {
          recW = 1080;
          recH = 1350;
        }

        renderer.setSize(recW, recH, false);
        camera.aspect = recW / recH;
        camera.fov = 40;
        camera.updateProjectionMatrix();
        renderer.setClearAlpha(0);

        // 3. Setup FRONT angle for camera and model so turntable starts directly from front
        const dist = 3.4;
        camera.position.set(0, 0, dist);
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
        camera.lookAt(0, 0, 0);
        model.position.set(0, 0.05, 0);
        model.rotation.set(0, 0, 0); // 0 rad = directly facing front

        // 4. Pre-render background ONCE to save CPU/GPU cycles during 60fps recording
        const cachedBgCanvas = document.createElement('canvas');
        cachedBgCanvas.width = recW;
        cachedBgCanvas.height = recH;
        const bgCtx = cachedBgCanvas.getContext('2d');
        if (bgCtx) {
          if (transparent && format === 'webm') {
            bgCtx.clearRect(0, 0, recW, recH);
          } else {
            drawBackgroundOnCanvas(bgCtx, recW, recH, bgImg, false);
          }
        }

        // 5. Create recording canvas
        const recCanvas = document.createElement('canvas');
        recCanvas.width = recW;
        recCanvas.height = recH;
        const recCtx = recCanvas.getContext('2d');
        if (!recCtx) {
          isRecordingRef.current = false;
          throw new Error('Record canvas context not available');
        }

        // Draw initial front-angle frame
        if (transparent && format === 'webm') {
          recCtx.clearRect(0, 0, recW, recH);
        } else if (bgCtx) {
          recCtx.drawImage(cachedBgCanvas, 0, 0);
        }
        renderer.render(scene, camera);
        recCtx.drawImage(renderer.domElement, 0, 0, recW, recH);

        // 6. Setup MediaRecorder at 60 FPS with high bitrate for pristine quality
        const stream = recCanvas.captureStream(targetFps);
        const track = stream.getVideoTracks()[0] as any;

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
          videoBitsPerSecond: 16000000, // 16 Mbps for crisp 60fps
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        const restoreViewportState = () => {
          renderer.setSize(originalSize.x, originalSize.y, true);
          camera.aspect = originalAspect;
          camera.fov = originalFov;
          camera.position.copy(originalCamPos);
          camera.rotation.copy(originalCamRot);
          camera.updateProjectionMatrix();
          if (controls) {
            controls.target.copy(originalControlsTarget);
            controls.update();
          }
          model.position.set(originalModelPos.x, originalModelPos.y, originalModelPos.z);
          model.rotation.set(originalModelRot.x, originalModelRot.y, originalModelRot.z);
          renderer.setClearAlpha(originalClearAlpha);
          renderer.render(scene, camera);
          isRecordingRef.current = false;
        };

        return new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () => {
            restoreViewportState();
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
          };

          recorder.onerror = (e) => {
            restoreViewportState();
            reject(e);
          };

          recorder.start();

          // Wait 50ms for recorder to initialize
          setTimeout(() => {
            let currentFrame = 0;
            const startTime = performance.now();

            const renderNextFrame = () => {
              if (currentFrame >= totalFrames) {
                // Done rendering all frames! Small 50ms buffer to finalize last packet
                setTimeout(() => {
                  if (recorder.state === 'recording') {
                    recorder.stop();
                  }
                }, 50);
                return;
              }

              const progressRatio = currentFrame / totalFrames;
              onProgress(Math.min(99, Math.round(progressRatio * 100)));

              // Calculate angle using the configured easing curve
              const easedProgress = calculateEasedProgress(
                progressRatio,
                animationRef.current.easing
              );
              const angle = easedProgress * Math.PI * 2;
              model.rotation.y = angle;
              renderer.render(scene, camera);

              // Composite to record canvas
              if (transparent && format === 'webm') {
                recCtx.clearRect(0, 0, recW, recH);
              } else if (bgCtx) {
                recCtx.drawImage(cachedBgCanvas, 0, 0);
              }
              recCtx.drawImage(renderer.domElement, 0, 0, recW, recH);

              currentFrame++;

              // Precise timing calculation to keep recording completely stutter-free
              const targetTime = startTime + currentFrame * frameIntervalMs;
              const now = performance.now();
              const delay = Math.max(0, targetTime - now);

              setTimeout(renderNextFrame, delay);
            };

            renderNextFrame();
          }, 50);
        });
      },
    }));

    // Background Style calculation (Solid, Gradient, Image)
    const getBackgroundStyle = () => {
      if (background.type === 'gradient') {
        const angle = background.gradientAngle ?? 135;
        const col1 = background.color || '#262626';
        const col2 = background.color2 || '#0D0D0D';
        return {
          background: `linear-gradient(${angle}deg, ${col1} 0%, ${col2} 100%)`,
        };
      } else if (background.type === 'image' && background.imageUrl) {
        return {
          backgroundImage: `url("${background.imageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
      return { backgroundColor: background.color || '#0D0D0D' };
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden flex items-center justify-center select-none"
        style={getBackgroundStyle()}
      >
        <canvas ref={canvasRef} className="w-full h-full outline-none block" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#0D0D0D]/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mb-4 shadow-xl">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">
              Loading {currentModel.name}
            </span>
            <span className="text-xs text-[#737373] mt-1 font-mono">
              Fetching 3D mesh ({loadProgress}%)
            </span>
            {/* Progress Bar */}
            <div className="w-48 h-1 bg-[#222222] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-white transition-all duration-150"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {loadError && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#2D1515] border border-[#EF4444] px-4 py-2 rounded-lg text-xs text-[#FCA5A5] z-30 shadow-xl flex items-center gap-2">
            <span>{loadError}</span>
          </div>
        )}

        {/* Interactive Viewport Gizmo at top right with smooth animated snap & FOV zoom controls */}
        <ViewportGizmo
          onSnapView={handleSnapCamera}
          onReset={handleSmoothReset}
          onZoomIn={() => {
            const currentBase = fovAnimRef.current.frameId
              ? fovAnimRef.current.targetFov
              : (cameraRef.current?.fov || cameraSettings.fov || 35);
            const nextFov = Math.max(15, currentBase - 4);
            animateFovTo(nextFov, 320);
          }}
          onZoomOut={() => {
            const currentBase = fovAnimRef.current.frameId
              ? fovAnimRef.current.targetFov
              : (cameraRef.current?.fov || cameraSettings.fov || 35);
            const nextFov = Math.min(75, currentBase + 4);
            animateFovTo(nextFov, 320);
          }}
          fov={cameraSettings.fov || 35}
          currentRotationY={currentRotationY}
        />
      </div>
    );
  }
);
