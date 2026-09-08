import React, { useState, useRef, useEffect } from 'react';
import { JERSEY_MODELS, FREE_MODEL_ID } from './data/models';
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
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { VerifyEmailPage } from './components/VerifyEmailPage';
import { AccountPage } from './components/AccountPage';
import { useAuth } from './context/AuthContext';
import { generateExportFileName } from './utils/exportUtils';

export default function App() {
  const { currentUser, isLoading: isAuthLoading, logout } = useAuth();
  const viewportRef = useRef<Viewport3DHandle>(null);

  // Client-side route synchronization
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname : '/studio';
    return p === '/' ? '/studio' : p;
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p === '/' ? '/studio' : p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  // Route synchronization and protection
  useEffect(() => {
    if (isAuthLoading) return;

    if (currentUser) {
      if (currentPath === '/login' || currentPath === '/register') {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/studio');
        }
        setCurrentPath('/studio');
      }
    } else {
      if (currentPath === '/account') {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/login');
        }
        setCurrentPath('/login');
      }
    }
  }, [currentUser, isAuthLoading, currentPath]);

  // Active 3D Jersey Model (Free plan restricted to POLO V2, PRO accesses all)
  const defaultModel = JERSEY_MODELS.find((m) => m.id === FREE_MODEL_ID) || JERSEY_MODELS[0];
  const [currentModel, setCurrentModel] = useState<JerseyModel>(defaultModel);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // UI Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<'jersey' | 'hanger' | 'mannequin'>('jersey');
  const [activeTool, setActiveTool] = useState<ActiveTool>('design');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [lockedModelAttempt, setLockedModelAttempt] = useState<string | null>(null);

  // Video recording states
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState(0);

  // Mockup & Layer Settings
  const [mockup, setMockup] = useState<MockupSettings>({
    modelId: defaultModel.id,
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
    duration: 8,
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

  // Enforce Free Plan restriction: only POLO V2 can be active for free/unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && currentUser?.plan !== 'pro') {
      if (currentModel.id !== FREE_MODEL_ID) {
        const freeModel = JERSEY_MODELS.find((m) => m.id === FREE_MODEL_ID);
        if (freeModel) {
          setCurrentModel(freeModel);
          setMockup((prev) => ({ ...prev, modelId: freeModel.id }));
        }
      }
    }
  }, [currentUser, isAuthLoading, currentModel.id]);

  // Model Selection
  const handleSelectModel = (model: JerseyModel) => {
    // Check if free user is trying to access locked model
    if (currentUser?.plan !== 'pro' && model.id !== FREE_MODEL_ID) {
      setLockedModelAttempt(model.name);
      setIsProModalOpen(true);
      return;
    }

    if (model.id === currentModel.id) return;
    setIsLoadingModel(true);
    setCurrentModel(model);
    setMockup((prev) => ({ ...prev, modelId: model.id }));
    if (window.innerWidth < 768) {
      setIsDrawerOpen(false);
    }
  };

  // Upload New Design Layer (Multi-layer support)
  const handleUploadDesign = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        const newLayerId = `layer-${Date.now()}`;
        const newLayer: DesignLayer = {
          id: newLayerId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl,
          x: 0.28,
          y: 0.42,
          width: 0.3,
          height: 0.3,
          rotation: 0,
          opacity: 1,
          visible: true,
        };
        setMockup((prev) => ({
          ...prev,
          layers: [newLayer, ...prev.layers],
          activeLayerId: newLayerId,
        }));
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

  // Download official 3D GLB model directly for the currently selected model
  const handleDownloadGLB = async () => {
    const targetUrl = currentModel.modelUrl;
    try {
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
      a.href = targetUrl;
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

  // Loading screen
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0D0D0D] text-[#ECECEC] select-none">
        <img
          src="/logo-editorsuite.svg"
          alt="EDITOR SUITE"
          className="h-9 w-auto object-contain mb-4 animate-pulse"
          onError={(e) => {
            e.currentTarget.src = 'https://editorsuite.cloud/logo-editorsuite.svg';
          }}
        />
        <div className="w-6 h-6 border-2 border-[#da0a2c] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#737373] tracking-wide">Memuat 3D Jersey Studio...</p>
      </div>
    );
  }

  // Explicit subpage routing
  if (currentPath === '/register') {
    return <RegisterPage onNavigate={navigate} />;
  }
  if (currentPath.startsWith('/verify-email')) {
    return <VerifyEmailPage onNavigate={navigate} />;
  }
  if (currentPath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }
  if (currentPath === '/account') {
    if (currentUser) {
      return <AccountPage onNavigate={navigate} />;
    }
    return <LoginPage onNavigate={navigate} />;
  }

  // Authenticated: Render Protected 3D Jersey Studio
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0D0D] text-[#ECECEC] font-sans antialiased select-none">
      {/* 1. Header Bar */}
      <Header
        currentModelName={currentModel.name}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenUVEditor={() => {}}
        onOpenLogin={() => navigate('/account')}
        onOpenPro={() => setIsProModalOpen(true)}
        onNavigate={navigate}
        onLogout={async () => {
          await logout();
          navigate('/login');
        }}
        currentUser={currentUser}
      />

      {/* 2. Main Workspace (Sidebars + 3D Center) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop for Models Drawer */}
        {isDrawerOpen && (
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
        )}

        {/* Mobile Backdrop for Inspector Panel */}
        {isInspectorOpenMobile && (
          <div
            onClick={() => setIsInspectorOpenMobile(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
        )}

        {/* Vertical Left Tool Strip on Desktop, or Hamburger Drawer on Mobile */}
        <SidebarNav
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          isDrawerOpen={isDrawerOpen}
          drawerCategory={drawerCategory}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
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

        {/* Clothing Mockups Drawer with direct 3D thumbnails */}
        <ModelsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedModelId={currentModel.id}
          onSelectModel={handleSelectModel}
          isLoadingModel={isLoadingModel}
          category={drawerCategory}
          userPlan={currentUser?.plan || 'free'}
          onUpgradePro={(modelName) => {
            setLockedModelAttempt(modelName || null);
            setIsProModalOpen(true);
          }}
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
      />

      {/* Help / Shortcuts Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* 5. Login / Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={() => {}}
        onLogout={async () => {
          await logout();
          navigate('/login');
        }}
      />

      {/* 6. PRO Membership Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => {
          setIsProModalOpen(false);
          setLockedModelAttempt(null);
        }}
        onOpenLogin={() => {
          setIsProModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        lockedModelName={lockedModelAttempt}
      />
    </div>
  );
}
