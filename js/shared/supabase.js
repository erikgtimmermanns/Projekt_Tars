import { supabaseConfig } from "../config.js";

const hasValidConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
  && !supabaseConfig.url.includes("YOUR-")
  && !supabaseConfig.anonKey.includes("YOUR-");

// Expose expected exports used by admin.js
export const configIsReady = hasValidConfig;
export const bucketName = supabaseConfig.bucketName || 'visitor-assets';
export const tableName = supabaseConfig.tableName || 'visitor_profiles';
// Attempt to instantiate a supabase client when possible:
let supabaseClient = null;
try {
  // If a global supabase library is loaded via CDN and config is valid, create client
  if (hasValidConfig && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    // also expose on window for other scripts that expect window.supabase to be the client
    window.supabase = supabaseClient;
  } else if (typeof window !== 'undefined' && window.supabase && window.supabase.auth && hasValidConfig) {
    // if window.supabase already appears to be a client (auth exists), reuse it
    supabaseClient = window.supabase;
  }
} catch (e) {
  console.warn('Failed to create Supabase client automatically:', e);
}

export const supabase = supabaseClient;

export function initSupabaseClient(client) {
  // allow runtime injection of a supabase client
  if (typeof window !== 'undefined') window.supabase = client;
  return client;
}
