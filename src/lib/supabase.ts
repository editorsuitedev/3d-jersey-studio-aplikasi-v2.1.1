import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Clean and normalize Supabase URL (strip trailing /rest/v1 or slashes)
function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bbikygejajkdradxvbgb.supabase.co';
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiaWt5Z2VqYWprZHJhZHh2YmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTY0NDEsImV4cCI6MjEwNDY5MjQ0MX0.-EYIVDGlglakE7RUqlSLPeQpbsephzqnHVB3SuWpo7g';

const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseJerseyProject {
  id: string;
  user_id: string;
  name: string;
  model_id: string;
  base_color: string;
  accent_color?: string;
  collar_color?: string;
  sleeve_color?: string;
  pattern?: string;
  roughness?: number;
  metalness?: number;
  fabric_sheen?: number;
  layers_count?: number;
  preview_url?: string;
  mockup_state?: any;
  lighting_state?: any;
  camera_state?: any;
  transform_state?: any;
  created_at?: string;
  updated_at?: string;
}
