import * as THREE from 'three';
import { MockupSettings, DesignLayer } from '../types';

/**
 * Creates or updates an HTML Canvas and turns it into a THREE.CanvasTexture
 * mapped to the UV coordinate space of the jersey models.
 */
export class JerseyTextureGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private customFullImg: HTMLImageElement | null = null;

  // Cached base background (base color + fabric weave)
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private lastBaseColor: string | null = null;
  private lastCustomImg: HTMLImageElement | null = null;
  private weavePattern: CanvasPattern | null = null;

  constructor(size = 4096) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;

    // Initialize base background canvas cache
    this.baseCanvas = document.createElement('canvas');
    this.baseCanvas.width = size;
    this.baseCanvas.height = size;
    const baseContext = this.baseCanvas.getContext('2d');
    if (!baseContext) {
      throw new Error('Could not get base canvas 2D context');
    }
    this.baseCtx = baseContext;

    // Create 8x8 micro fabric weave pattern once
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 8;
    patternCanvas.height = 8;
    const pCtx = patternCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = 'rgba(0, 0, 0, 0.025)';
      pCtx.fillRect(0, 0, 4, 8);
      pCtx.fillRect(0, 0, 8, 4);
      this.weavePattern = this.baseCtx.createPattern(patternCanvas, 'repeat');
    }

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.flipY = false;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Preload an image URL and store in cache
   */
  public async preloadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        resolve(img);
      };
      img.src = url;
    });
  }

  public async setCustomFullTexture(url: string | null): Promise<void> {
    if (!url) {
      this.customFullImg = null;
      return;
    }
    const img = await this.preloadImage(url);
    this.customFullImg = img;
  }

  /**
   * Preloads all layer images in mockup settings (skips already cached images immediately)
   */
  public async prepareLayers(layers: DesignLayer[]): Promise<void> {
    const unready = layers.filter((l) => !this.imageCache.has(l.dataUrl));
    if (unready.length === 0) return;
    const promises = unready.map((layer) => this.preloadImage(layer.dataUrl));
    await Promise.all(promises);
  }

  public render(settings: MockupSettings, showUvOverlay = false, uvSvgImage: HTMLImageElement | null = null): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    const currentBaseColor = settings.baseColor || '#FFFFFF';
    const isBaseDirty =
      this.lastBaseColor !== currentBaseColor ||
      this.lastCustomImg !== this.customFullImg;

    // 1. Update cached base background canvas only when base color or custom full texture actually changed
    if (isBaseDirty) {
      this.lastBaseColor = currentBaseColor;
      this.lastCustomImg = this.customFullImg;

      this.baseCtx.clearRect(0, 0, width, height);

      if (this.customFullImg) {
        this.baseCtx.drawImage(this.customFullImg, 0, 0, width, height);
      } else {
        // Base fill
        this.baseCtx.fillStyle = currentBaseColor;
        this.baseCtx.fillRect(0, 0, width, height);

        // Fast fabric weave pattern fill
        if (this.weavePattern) {
          this.baseCtx.fillStyle = this.weavePattern;
          this.baseCtx.fillRect(0, 0, width, height);
        }
      }
    }

    // 2. Clear main canvas and blit the cached base canvas in a single instant operation
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.baseCanvas, 0, 0, width, height);

    // 3. Render all active design layers from bottom to top
    if (settings.layers && settings.layers.length > 0) {
      for (const layer of settings.layers) {
        if (!layer.visible) continue;

        const img = this.imageCache.get(layer.dataUrl);
        if (!img || !img.complete || img.naturalWidth === 0) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;

        // Position in UV pixel coordinates
        const cx = layer.x * width;
        const cy = layer.y * height;
        const layerW = layer.width * width;
        const layerH = layer.height * height;

        ctx.translate(cx, cy);

        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180);
        }

        ctx.drawImage(img, -layerW / 2, -layerH / 2, layerW, layerH);
        ctx.restore();
      }
    }

    // 4. Optional UV Wireframe overlay
    if (showUvOverlay && uvSvgImage) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.drawImage(uvSvgImage, 0, 0, width, height);
      ctx.restore();
    }

    this.texture.needsUpdate = true;
  }
}
