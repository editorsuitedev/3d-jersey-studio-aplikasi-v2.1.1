import React, { useState, useRef, useEffect } from 'react';
import { JERSEY_MODELS } from './data/models';
import { createInitialLayers } from './data/defaultAssets';
import {
  JerseyModel,
  MockupSettings,
  BackgroundSettings,
  LightingSettings,
  CameraSettings,
  SceneSettings,
  TransformSettings,
  AnimationSettings,
  ActiveTool,
  DesignLayer,
} from './types';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { ModelsDrawer } from './components/ModelsDrawer';
import { Viewport3D, Viewport3DHandle } from './components/Viewport3D';
import { TimelineBar } from './components/TimelineBar';
import { InspectorPanel } from './components/InspectorPanel';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { LoginModal } from './components/LoginModal';
import { ProModal } from './components/ProModal';
import { generateExportFileName } from './utils/exportUtils';
import {
  UserSubscription,
  getStoredSubscription,
  isProSubscription,
  activateProSubscription,
  expireProSubscription,
  FREE_ALLOWED_MODEL_ID,
  PRO_PRICE_FORMATTED,
} from './utils/subscription';

export default function App() {
  const viewportRef = useRef<Viewport3DHandle>(null);

  // Active 3D Jersey Model (Default to 01. O Neck)
  const [currentModel, setCurrentModel] = useState<JerseyModel>(JERSEY_MODELS[0]);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // SaaS Subscription State (Default: Free Plan)
  const [subscription, setSubscription] = useState<UserSubscription>(() => getStoredSubscription());
  const [proModalReason, setProModalReason] = useState<{ title: string; desc: string } | null>(null);

  const isPro = isProSubscription(subscription);

  // Open Pro modal with optional custom contextual reason
  const handleRequirePro = (title?: string, desc?: string) => {
    if (title) {
      setProModalReason({ title, desc: desc || '' });
    } else {
      setProModalReason(null);
    }
    setIsProModalOpen(true);
  };

  // Upgrade to Pro Plan action (simulates payment of Rp249.000/bulan)
  const handleUpgradeToPro = () => {
    const updated = activateProSubscription(30);
    setSubscription(updated);
  };

  // Expire / Revert Pro Plan action
  const handleExpireSubscription = () => {
    const expired = expireProSubscription();
    setSubscription(expired);
    // Jika subscription Pro berakhir atau tidak aktif, user otomatis kembali ke Free Plan
    if (currentModel.id !== FREE_ALLOWED_MODEL_ID) {
      const freeModel = JERSEY_MODELS.find((m) => m.id === FREE_ALLOWED_MODEL_ID) || JERSEY_MODELS[0];
      setCurrentModel(freeModel);
      setMockup((prev) => ({ ...prev, modelId: freeModel.id }));
    }
  };

  // Auto-validate plan and revert model if Free user somehow has a Pro model
  useEffect(() => {
    const currentSub = getStoredSubscription();
    setSubscription(currentSub);
    if (!isProSubscription(currentSub) && currentModel.id !== FREE_ALLOWED_MODEL_ID) {
      const freeModel = JERSEY_MODELS.find((m) => m.id === FREE_ALLOWED_MODEL_ID) || JERSEY_MODELS[0];
      setCurrentModel(freeModel);
      setMockup((prev) => ({ ...prev, modelId: freeModel.id }));
    }
  }, []);

  // UI Drawers & Modals (Models drawer closed on initial load per user request)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<'jersey' | 'hanger' | 'mannequin'>('jersey');
  const [activeTool, setActiveTool] = useState<ActiveTool>('design');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  // Video recording states
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState(0);

  // Mockup & Layer Settings
  const [mockup, setMockup] = useState<MockupSettings>({
    modelId: JERSEY_MODELS[0].id,
    baseColor: '#2B2B2B', // Initial 3D model color #2B2B2B
    accentColor: '#18181B',
    collarColor: '#18181B',
    sleeveColor: '#18181B',
    pattern: 'solid',
    materialPreset: 'basic',
    roughness: 0.8, // 80% roughness per user request
    metalness: 0.2, // 20% metal per user request
    fabricSheen: 0.2, // 20% sheen per user request
    customTextureUrl: null,
    layers: createInitialLayers(),
    activeLayerId: 'layer-editorsuite-logo',
  });

  // Background Settings
  const [background, setBackground] = useState<BackgroundSettings>({
    type: 'solid',
    color: '#0D0D0D',
    color2: '#181818',
    colorSpace: 'sRGB',
  });

  // Lighting Settings
  const [lighting, setLighting] = useState<LightingSettings>({
    mode: 'environment',
    environmentPreset: 'clean_light', // Clean Whitebox per user request
    environmentIntensity: 1.25,
    environmentRotation: 35,
    directionalIntensity: 1.8,
    directionalColor: '#FFFFFF',
    directionalX: 2,
    directionalY: 4,
    directionalZ: 3,
    ambientIntensity: 0.8,
  });

  // Camera Settings (Default dist 3.4 so 3D model looks sleek, clean, and not too large)
  const [camera, setCamera] = useState<CameraSettings>({
    fov: 40,
    posX: 0,
    posY: 0,
    posZ: 3.4,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
  });

  // Scene Settings
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>({
    floorShadow: 'none', // Floor shadow none per user request
    shadowIntensity: 0.65,
    groundReflection: false,
  });

  // Transform Settings
  const [transform, setTransform] = useState<TransformSettings>({
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    scale: 1,
  });

  // Turntable & Animation Settings
  const [animation, setAnimation] = useState<AnimationSettings>({
    isPlaying: false,
    currentTime: 0,
    duration: 10,
    speed: 1,
    loop: true,
    isHQ: true,
    easing: 'linear',
    fps: 60,
  });

  // Mobile Inspector drawer state
  const [isInspectorOpenMobile, setIsInspectorOpenMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'DESIGN' | 'EFFECTS'>('DESIGN');

  // Model Selection
  const handleSelectModel = (model: JerseyModel) => {
    if (model.id === currentModel.id) return;

    // Sistem harus memeriksa status plan user sebelum mengaktifkan model yang hanya tersedia untuk Pro
    if (!isPro && model.id !== FREE_ALLOWED_MODEL_ID) {
      handleRequirePro(`Model "${model.name}" khusus Pro Plan`);
      return;
    }

    setIsLoadingModel(true);
    setCurrentModel(model);
    setMockup((prev) => ({ ...prev, modelId: model.id }));
    if (window.innerWidth < 768) {
      setIsDrawerOpen(false);
    }
  };

  // Upload New Design Layer with proper aspect ratio detection
  const handleUploadDesign = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        const img = new Image();
        img.onload = () => {
          const naturalW = img.naturalWidth || 1;
          const naturalH = img.naturalHeight || 1;
          const aspect = naturalW / naturalH;

          // Target initial display size (max dimension ~0.35 of UV canvas)
          let width = 0.35;
          let height = 0.35;

          if (aspect >= 1) {
            // Landscape or square: maintain aspect ratio
            height = Math.max(0.04, Math.min(1.0, width / aspect));
          } else {
            // Portrait: maintain aspect ratio
            width = Math.max(0.04, Math.min(1.0, height * aspect));
          }

          const newLayerId = `layer-${Date.now()}`;
          const newLayer: DesignLayer = {
            id: newLayerId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            x: 0.3575, // Centered on front chest area
            y: 0.38,
            width,
            height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            aspectRatio: aspect,
            naturalWidth: naturalW,
            naturalHeight: naturalH,
          };

          setMockup((prev) => ({
            ...prev,
            layers: [newLayer, ...prev.layers],
            activeLayerId: newLayerId,
          }));
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  // Download official UV SVG template directly for the currently selected model
  const handleDownloadSVG = async () => {
    const targetUrl = currentModel.uvMapUrl || currentModel.externalUvMapUrl;
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${currentModel.name.replace(/\s+/g, '_')}_UV_Layout.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `${currentModel.name.replace(/\s+/g, '_')}_UV_Layout.svg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Download customized 3D GLB model with embedded 4K PBR textures
  const handleDownloadGLB = async () => {
    if (!isPro) {
      handleRequirePro('Fitur Export 3D Model GLB khusus Pro Plan');
      return;
    }

    try {
      if (viewportRef.current?.exportGLB) {
        const blob = await viewportRef.current.exportGLB();
        const blobUrl = URL.createObjectURL(blob);
        const filename = generateExportFileName(currentModel.name, 'glb');
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        return;
      }

      // Fallback to official template GLB if viewport not available
      const targetUrl = currentModel.modelUrl;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${currentModel.name.replace(/\s+/g, '_')}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const a = document.createElement('a');
      a.href = currentModel.modelUrl;
      a.download = `${currentModel.name.replace(/\s+/g, '_')}.glb`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Export Image at specified ratio (16:9, 1:1, 9:16, 4:5) with live background/transparency
  const handleExportImage = async (
    format: 'png' | 'jpg',
    ratio: '16:9' | '1:1' | '9:16' | '4:5',
    transparent: boolean
  ) => {
    if (!isPro) {
      handleRequirePro('Fitur Export Image khusus Pro Plan');
      return;
    }

    if (!viewportRef.current) return;

    const dataUrl = await viewportRef.current.captureScreenshot(
      format === 'jpg' ? 'jpeg' : 'png',
      2,
      ratio,
      transparent
    );

    const filename = generateExportFileName(currentModel.name, format);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Instant Snapshot Capture
  const handleQuickCapture = async () => {
    if (!isPro) {
      handleRequirePro('Fitur Export Image khusus Pro Plan');
      return;
    }

    if (!viewportRef.current) return;
    const dataUrl = await viewportRef.current.captureScreenshot('png', 2, '1:1', false);
    const filename = generateExportFileName(currentModel.name, 'png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Video (Turntable 360) with live background, ratio, format
  const handleExportVideo = async (
    fps: number,
    duration: number,
    format: 'webm' | 'mp4',
    ratio: '16:9' | '1:1' | '9:16' | '4:5',
    transparent: boolean
  ) => {
    if (!isPro) {
      handleRequirePro('Fitur Export Video turntable khusus Pro Plan');
      return;
    }

    if (!viewportRef.current) return;
    setIsExportingVideo(true);
    setVideoExportProgress(0);

    try {
      const blob = await viewportRef.current.recordTurntableVideo(
        fps,
        duration,
        format,
        ratio,
        transparent,
        (progress) => setVideoExportProgress(progress)
      );

      setVideoExportProgress(100);
      const ext = format === 'mp4' && blob.type.includes('mp4') ? 'mp4' : 'webm';
      const filename = generateExportFileName(currentModel.name, ext);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Video recording error:', err);
    } finally {
      setIsExportingVideo(false);
      setVideoExportProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0D0D] text-[#ECECEC] font-sans antialiased select-none">
      {/* 1. Header Bar */}
      <Header
        currentModelName={currentModel.name}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenUVEditor={() => {}}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenPro={() => handleRequirePro()}
        currentUser={currentUser}
        isPro={isPro}
      />

      {/* 2. Main Workspace (Sidebars + 3D Center) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop for Models Drawer */}
        <div
          onClick={() => setIsDrawerOpen(false)}
          className={`fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Mobile Backdrop for Inspector Panel */}
        <div
          onClick={() => setIsInspectorOpenMobile(false)}
          className={`fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isInspectorOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Vertical Left Tool Strip on Desktop, or Floating Hamburger on Mobile */}
        <SidebarNav
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          isDrawerOpen={isDrawerOpen}
          drawerCategory={drawerCategory}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onToggleMobileMenu={() => setIsDrawerOpen((prev) => !prev)}
          onOpenDrawerCategory={(cat) => {
            if (isDrawerOpen && drawerCategory === cat) {
              setIsDrawerOpen(false);
            } else {
              setDrawerCategory(cat);
              setIsDrawerOpen(true);
            }
          }}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />

        {/* 3D Models Drawer with Category Dropdown Menu (3D Jersey, 3D Hanger, 3D Mannequin) */}
        <ModelsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedModelId={currentModel.id}
          onSelectModel={handleSelectModel}
          isLoadingModel={isLoadingModel}
          category={drawerCategory}
          onChangeCategory={(cat) => setDrawerCategory(cat)}
          isPro={isPro}
          onRequirePro={(title, desc) => handleRequirePro(title, desc)}
        />

        {/* Center 3D Viewport with OrbitControls & Gizmo */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#0D0D0D]">
          <Viewport3D
            ref={viewportRef}
            currentModel={currentModel}
            mockup={mockup}
            background={background}
            lighting={lighting}
            cameraSettings={camera}
            sceneSettings={sceneSettings}
            transform={transform}
            animation={animation}
            onChangeAnimation={(updates) => setAnimation((prev) => ({ ...prev, ...updates }))}
            onChangeTransform={(updates) => setTransform((prev) => ({ ...prev, ...updates }))}
            onChangeCamera={(updates) => setCamera((prev) => ({ ...prev, ...updates }))}
            onLoadedModel={() => setIsLoadingModel(false)}
          />
        </main>

        {/* Right Inspector Panel with direct 2D UV Live Canvas & Multi-Layer System */}
        <InspectorPanel
          currentModel={currentModel}
          mockup={mockup}
          background={background}
          lighting={lighting}
          camera={camera}
          scene={sceneSettings}
          transform={transform}
          isOpenMobile={isInspectorOpenMobile}
          onCloseMobile={() => setIsInspectorOpenMobile(false)}
          activeTab={inspectorTab}
          onChangeTab={(t) => setInspectorTab(t)}
          onChangeMockup={(updates) => setMockup((prev) => ({ ...prev, ...updates }))}
          onChangeBackground={(updates) => setBackground((prev) => ({ ...prev, ...updates }))}
          onChangeLighting={(updates) => setLighting((prev) => ({ ...prev, ...updates }))}
          onChangeCamera={(updates) => setCamera((prev) => ({ ...prev, ...updates }))}
          onChangeScene={(updates) => setSceneSettings((prev) => ({ ...prev, ...updates }))}
          onChangeTransform={(updates) => setTransform((prev) => ({ ...prev, ...updates }))}
          onUploadDesign={handleUploadDesign}
          onLiveUpdateLayers={(liveLayers) => {
            viewportRef.current?.updateLayersLive(liveLayers);
          }}
          onSnapCamera={(preset) => {
            viewportRef.current?.snapCamera(preset);
          }}
        />
      </div>

      {/* 3. Bottom Animation Timeline Bar with 360 Turntable playback & Mobile Floating Controls */}
      <TimelineBar
        animation={animation}
        onChangeAnimation={(updates) => setAnimation((prev) => ({ ...prev, ...updates }))}
        onQuickCapture={handleQuickCapture}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenEdit={() => {
          setInspectorTab('DESIGN');
          setIsInspectorOpenMobile(true);
        }}
        onOpenSetup={() => {
          setInspectorTab('EFFECTS');
          setIsInspectorOpenMobile(true);
        }}
      />

      {/* 4. Export Modal (Image / Video / 3D Object) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentModel={currentModel}
        animation={animation}
        onExportImage={handleExportImage}
        onExportVideo={handleExportVideo}
        onDownloadGLB={handleDownloadGLB}
        onDownloadSVG={handleDownloadSVG}
        isExportingVideo={isExportingVideo}
        videoExportProgress={videoExportProgress}
        isPro={isPro}
        onOpenPro={() => {
          setIsExportModalOpen(false);
          handleRequirePro('Fitur Export khusus Pro Plan');
        }}
      />

      {/* Help / Shortcuts Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* 5. Login / Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
        subscription={subscription}
        onOpenPro={() => {
          setIsLoginModalOpen(false);
          handleRequirePro();
        }}
      />

      {/* 6. PRO Membership Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => {
          setIsProModalOpen(false);
          setProModalReason(null);
        }}
        onOpenLogin={() => {
          setIsProModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        subscription={subscription}
        onUpgradeToPro={handleUpgradeToPro}
        onExpireSubscription={handleExpireSubscription}
        reasonTitle={proModalReason?.title}
        reasonDesc={proModalReason?.desc}
      />
    </div>
  );
}
