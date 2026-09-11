import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Save,
  Trash2,
  FolderOpen,
  Check,
  AlertCircle,
  Database,
  Shirt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  SavedJerseyProject,
  saveJerseyToSupabase,
  subscribeUserJerseys,
  deleteJerseyFromSupabase,
} from '../services/supabaseJerseyService';
import { MockupSettings, LightingSettings, CameraSettings, TransformSettings } from '../types';

interface SavedJerseysModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMockup: MockupSettings;
  currentLighting: LightingSettings;
  currentCamera: CameraSettings;
  currentTransform: TransformSettings;
  onLoadProject: (project: SavedJerseyProject) => void;
}

export const SavedJerseysModal: React.FC<SavedJerseysModalProps> = ({
  isOpen,
  onClose,
  currentMockup,
  currentLighting,
  currentCamera,
  currentTransform,
  onLoadProject,
}) => {
  const { currentUser, isDatabaseConnected, loginWithGoogle } = useAuth();
  const [projects, setProjects] = useState<SavedJerseyProject[]>([]);
  const [projectName, setProjectName] = useState('Desain Jersey Kustom');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveNotice, setSaveNotice] = useState('Desain berhasil disimpan!');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const effectiveUserId = currentUser?.id;

  // Real-time Supabase sync
  useEffect(() => {
    if (!isOpen || !effectiveUserId) {
      setProjects([]);
      return;
    }

    const unsubscribe = subscribeUserJerseys(
      effectiveUserId,
      (items) => {
        setProjects(items);
      },
      (err) => {
        console.warn('[Supabase] Subscription notice:', err);
      }
    );

    return () => unsubscribe();
  }, [isOpen, effectiveUserId]);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId) {
      setStatusError('Silakan login atau masuk sebagai Tamu terlebih dahulu untuk menyimpan desain.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setStatusError(null);
    setSaveSuccess(false);

    try {
      const res = await saveJerseyToSupabase(effectiveUserId, {
        name: projectName.trim() || 'Desain Jersey Kustom',
        mockup: currentMockup,
        lighting: currentLighting,
        camera: currentCamera,
        transform: currentTransform,
      });

      if (res.isLocal) {
        setSaveNotice(res.warning || 'Desain berhasil disimpan di penyimpanan browser lokal!');
      } else {
        setSaveNotice('Desain berhasil disimpan ke Supabase Cloud!');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setStatusError(err.message || 'Gagal menyimpan ke Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (jerseyId: string) => {
    if (!effectiveUserId || deletingId) return;
    setDeletingId(jerseyId);
    try {
      await deleteJerseyFromSupabase(effectiveUserId, jerseyId);
    } catch (err: any) {
      setStatusError(err.message || 'Gagal menghapus proyek dari Supabase.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Supabase Jersey Projects
              </h2>
              <p className="text-[11px] text-[#737373]">
                Simpan dan kelola desain jersey di cloud database Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-[#737373] hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* Status notices */}
          {statusError && (
            <div className="p-3 rounded-xl bg-[#2A1414] border border-[#EF4444]/40 text-[#FCA5A5] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{statusError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#142A19] border border-[#22C55E]/40 text-[#86EFAC] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>{saveNotice}</span>
            </div>
          )}

          {/* Notice if not signed in */}
          {!currentUser && (
            <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#333333] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-[#A3A3A3]">
                  Masuk ke akun Anda untuk mengaktifkan sinkronisasi database cloud Supabase.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setStatusError(null);
                  const res = await loginWithGoogle();
                  if (!res.success && !res.cancelled) {
                    setStatusError(res.error || 'Gagal login dengan Google');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] border border-[#444444] text-xs font-medium text-white flex items-center gap-2 shrink-0 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          )}

          {/* Form to Save Current Design */}
          <div className="p-4 rounded-xl bg-[#181818] border border-[#262626]">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Desain Jersey</span>
            </h3>

            <form onSubmit={handleSaveCurrent} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nama desain jersey..."
                disabled={isSaving || !effectiveUserId}
                className="flex-1 bg-[#121212] border border-[#2E2E2E] focus:border-[#555] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-[#555] focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSaving || !effectiveUserId}
                className="px-4 py-2 rounded-xl bg-[#262626] border border-[#595959] hover:bg-[#333] hover:border-white text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Simpan Desain</span>
                  </>
                )}
              </button>
            </form>
            {!currentUser && (
              <p className="text-[11px] text-amber-400 mt-2">
                * Masuk ke akun Anda terlebih dahulu untuk mengaktifkan sinkronisasi cloud.
              </p>
            )}
          </div>

          {/* Saved Projects in Supabase */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
                Desain Tersimpan ({projects.length})
              </h3>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Realtime
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#262626] text-[#666]">
                <Shirt className="w-8 h-8 mx-auto mb-2 text-[#444]" />
                <p className="text-xs">Belum ada desain jersey yang disimpan.</p>
                <p className="text-[11px] text-[#555] mt-1">
                  Beri nama pada form di atas dan klik &apos;Simpan ke Supabase&apos;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#161616] border border-[#262626] hover:border-[#444] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                            style={{ backgroundColor: p.baseColor }}
                            title={`Base: ${p.baseColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                            style={{ backgroundColor: p.accentColor }}
                            title={`Accent: ${p.accentColor}`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#777] mb-3">
                        <span className="capitalize">{p.modelId}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{p.pattern}</span>
                        <span>&middot;</span>
                        <span>{p.layersCount} Layer</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                      <button
                        onClick={() => {
                          onLoadProject(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-white hover:text-black text-[11px] font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Buka Desain</span>
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-[#777] hover:text-[#EF4444] hover:bg-[#2A1414] transition-colors cursor-pointer"
                        title="Hapus dari Supabase"
                      >
                        {deletingId === p.id ? (
                          <div className="w-3.5 h-3.5 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#222222] bg-[#0E0E0E] flex items-center justify-between text-[11px] text-[#666]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-400" />
            Database: <span className="text-white font-mono">{isDatabaseConnected ? 'Supabase Connected' : 'Supabase (Local Mode)'}</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
