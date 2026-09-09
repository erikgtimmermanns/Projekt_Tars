const supabaseConfig = window.SUPABASE_CONFIG || {};
const configIsReady = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
  && !supabaseConfig.url.includes("YOUR-")
  && !supabaseConfig.anonKey.includes("YOUR-");

window.supabaseClient = configIsReady && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
