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

  constructor(size = 4096) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;
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
   * Preloads all layer images in mockup settings
   */
  public async prepareLayers(layers: DesignLayer[]): Promise<void> {
    const promises = layers.map((layer) => this.preloadImage(layer.dataUrl));
    await Promise.all(promises);
  }

  public render(settings: MockupSettings, showUvOverlay = false, uvSvgImage: HTMLImageElement | null = null): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. If user uploaded a full custom texture, draw that as primary base
    if (this.customFullImg) {
      ctx.drawImage(this.customFullImg, 0, 0, width, height);
    } else {
      // Background base fill - covers 100% of the canvas so all meshes are colored
      ctx.fillStyle = settings.baseColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Subtle fabric weave texture
      this.drawFabricWeave(width, height);
    }

    // 2. Render all active design layers from bottom to top
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

    // 3. Optional UV Wireframe overlay
    if (showUvOverlay && uvSvgImage) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.drawImage(uvSvgImage, 0, 0, width, height);
      ctx.restore();
    }

    this.texture.needsUpdate = true;
  }

  private drawFabricWeave(w: number, h: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
    const step = 4;
    for (let x = 0; x < w; x += step * 2) {
      ctx.fillRect(x, 0, step, h);
    }
    for (let y = 0; y < h; y += step * 2) {
      ctx.fillRect(0, y, w, step);
    }
    ctx.restore();
  }
}
