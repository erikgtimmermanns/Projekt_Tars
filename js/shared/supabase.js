import { supabaseConfig } from "../config.js";

const hasValidConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
  && !supabaseConfig.url.includes("YOUR-")
  && !supabaseConfig.anonKey.includes("YOUR-");

export const configIsReady = hasValidConfig && Boolean(window.supabase);
export const supabase = configIsReady
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
export const bucketName = supabaseConfig.bucketName || "visitor-assets";
export const tableName = supabaseConfig.tableName || "visitor_profiles";
