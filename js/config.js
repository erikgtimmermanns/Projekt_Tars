const defaultSupabaseConfig = {
  url: "https://lybzifzwgvttyhwqpaig.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YnppZnp3Z3Z0dHlod3FwYWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTMwNDcsImV4cCI6MjEwNDUyOTA0N30.LaRdl7zXgNX_GE3jOMfZ085tGcdFNFxpDIuhbLfoqgk",
  bucketName: "visitor-assets",
  tableName: "visitor_profiles"
};

export const supabaseConfig = {
  ...defaultSupabaseConfig,
  ...(window.SUPABASE_CONFIG || {})
};
