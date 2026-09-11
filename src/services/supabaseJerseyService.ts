import { supabase, isSupabaseConfigured, SupabaseJerseyProject } from '../lib/supabase';
import { MockupSettings, LightingSettings, CameraSettings, TransformSettings } from '../types';

export interface SavedJerseyProject {
  id: string;
  userId: string;
  name: string;
  modelId: string;
  baseColor: string;
  accentColor: string;
  collarColor: string;
  sleeveColor: string;
  pattern: string;
  roughness: number;
  metalness: number;
  fabricSheen: number;
  layersCount: number;
  previewUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  mockupState?: MockupSettings;
  lightingState?: LightingSettings;
  cameraState?: CameraSettings;
  transformState?: TransformSettings;
}

const LOCAL_STORAGE_PREFIX = 'supabase_saved_jerseys_';

function getLocalProjects(userId: string): SavedJerseyProject[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(userId: string, projects: SavedJerseyProject[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(projects));
  } catch (err) {
    console.warn('[Supabase] Failed to write to local storage backup:', err);
  }
}

function mapRowToProject(row: SupabaseJerseyProject): SavedJerseyProject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    modelId: row.model_id,
    baseColor: row.base_color,
    accentColor: row.accent_color || '#FFFFFF',
    collarColor: row.collar_color || '#1A1A1A',
    sleeveColor: row.sleeve_color || '#FFFFFF',
    pattern: row.pattern || 'none',
    roughness: row.roughness ?? 0.8,
    metalness: row.metalness ?? 0.2,
    fabricSheen: row.fabric_sheen ?? 0.2,
    layersCount: row.layers_count ?? 0,
    previewUrl: row.preview_url || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mockupState: row.mockup_state,
    lightingState: row.lighting_state,
    cameraState: row.camera_state,
    transformState: row.transform_state,
  };
}

/**
 * Save or update a 3D jersey design into Supabase (with automatic local storage backup)
 */
export interface SaveJerseyResult {
  id: string;
  isLocal: boolean;
  warning?: string;
}

export async function saveJerseyToSupabase(
  userId: string,
  project: {
    id?: string;
    name: string;
    mockup: MockupSettings;
    lighting?: LightingSettings;
    camera?: CameraSettings;
    transform?: TransformSettings;
    previewUrl?: string;
  }
): Promise<SaveJerseyResult> {
  const jerseyId = project.id || `jersey_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullProject: SavedJerseyProject = {
    id: jerseyId,
    userId,
    name: project.name.trim() || 'Desain Jersey Kustom',
    modelId: project.mockup.modelId,
    baseColor: project.mockup.baseColor,
    accentColor: project.mockup.accentColor,
    collarColor: project.mockup.collarColor,
    sleeveColor: project.mockup.sleeveColor,
    pattern: project.mockup.pattern,
    roughness: Number(project.mockup.roughness ?? 0.8),
    metalness: Number(project.mockup.metalness ?? 0.2),
    fabricSheen: Number(project.mockup.fabricSheen ?? 0.2),
    layersCount: project.mockup.layers?.length || 0,
    previewUrl: project.previewUrl || '',
    updatedAt: now,
    mockupState: project.mockup,
    lightingState: project.lighting,
    cameraState: project.camera,
    transformState: project.transform,
  };

  // Always update local cache for instant UI feedback and zero data loss
  const locals = getLocalProjects(userId).filter((p) => p.id !== jerseyId);
  saveLocalProjects(userId, [fullProject, ...locals]);

  if (!isSupabaseConfigured() || userId.startsWith('guest_')) {
    return {
      id: jerseyId,
      isLocal: true,
      warning: 'Desain berhasil disimpan di penyimpanan browser lokal.',
    };
  }

  try {
    const payload: SupabaseJerseyProject = {
      id: jerseyId,
      user_id: userId,
      name: fullProject.name,
      model_id: fullProject.modelId,
      base_color: fullProject.baseColor,
      accent_color: fullProject.accentColor,
      collar_color: fullProject.collarColor,
      sleeve_color: fullProject.sleeveColor,
      pattern: fullProject.pattern,
      roughness: fullProject.roughness,
      metalness: fullProject.metalness,
      fabric_sheen: fullProject.fabricSheen,
      layers_count: fullProject.layersCount,
      preview_url: fullProject.previewUrl,
      mockup_state: fullProject.mockupState,
      lighting_state: fullProject.lightingState,
      camera_state: fullProject.cameraState,
      transform_state: fullProject.transformState,
      updated_at: now,
    };

    const { error } = await supabase
      .from('jersey_projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Warning saat menyimpan ke tabel jersey_projects:', error.message);
      return {
        id: jerseyId,
        isLocal: true,
        warning: error.code === '42501'
          ? 'Tersimpan di browser lokal. (Catatan: Kebijakan RLS Supabase membatasi akses insert cloud untuk sesi ini)'
          : `Tersimpan di browser lokal (${error.message})`,
      };
    }

    return {
      id: jerseyId,
      isLocal: false,
    };
  } catch (err: any) {
    console.warn('[Supabase] Error saat menghubungi Supabase:', err?.message || err);
    return {
      id: jerseyId,
      isLocal: true,
      warning: 'Tersimpan di browser lokal.',
    };
  }
}

/**
 * Fetch all jersey designs of a user from Supabase
 */
export async function fetchUserJerseys(userId: string): Promise<SavedJerseyProject[]> {
  const localList = getLocalProjects(userId);

  if (!isSupabaseConfigured()) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from('jersey_projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Error fetchUserJerseys:', error.message);
      return localList;
    }

    if (data && data.length > 0) {
      const mapped = data.map((row) => mapRowToProject(row as SupabaseJerseyProject));
      saveLocalProjects(userId, mapped);
      return mapped;
    }

    return localList;
  } catch (err: any) {
    console.warn('[Supabase] Gagal mengambil daftar jersey dari cloud:', err?.message || err);
    return localList;
  }
}

/**
 * Subscribe to real-time changes of user's jerseys
 */
export function subscribeUserJerseys(
  userId: string,
  onUpdate: (projects: SavedJerseyProject[]) => void,
  onError?: (err: unknown) => void
): () => void {
  // Immediately dispatch cached local records
  const initialLocal = getLocalProjects(userId);
  onUpdate(initialLocal);

  // Fetch initial remote data
  fetchUserJerseys(userId)
    .then((projects) => onUpdate(projects))
    .catch((err) => onError?.(err));

  if (!isSupabaseConfigured()) {
    return () => {};
  }

  // Set up Supabase Realtime channel
  const channel = supabase
    .channel(`public:jersey_projects:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jersey_projects',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchUserJerseys(userId).then((projects) => onUpdate(projects));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Delete a jersey project from Supabase & local storage
 */
export async function deleteJerseyFromSupabase(userId: string, jerseyId: string): Promise<void> {
  // Remove from local storage
  const updated = getLocalProjects(userId).filter((p) => p.id !== jerseyId);
  saveLocalProjects(userId, updated);

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('jersey_projects')
      .delete()
      .eq('id', jerseyId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase] Error deleting jersey:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] Exception saat menghapus jersey:', err?.message || err);
  }
}
