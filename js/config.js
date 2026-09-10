const supabaseConfig = window.SUPABASE_CONFIG || {};
const configIsReady = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
  && !supabaseConfig.url.includes("YOUR-")
  && !supabaseConfig.anonKey.includes("YOUR-");

window.supabaseClient = configIsReady && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

const kioskConfig = window.SUPABASE_CONFIG || {};
const kioskSupabaseUrl = kioskConfig.url || "";
const kioskSupabaseKey = kioskConfig.anonKey || "";
const kioskBucketName = kioskConfig.bucketName || "visitor-assets";
const kioskTableName = kioskConfig.tableName || "visitor_profiles";
const kioskSupabase = kioskSupabaseUrl && kioskSupabaseKey && !kioskSupabaseUrl.includes("YOUR-") && !kioskSupabaseKey.includes("YOUR-")
    ? window.supabase.createClient(kioskSupabaseUrl, kioskSupabaseKey)
    : null;
