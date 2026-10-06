import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client for the BSO News Intelligence Supabase project, which holds the
// Intelligence waitlist. It is a separate project from the jobs database.
let intelligenceClient: SupabaseClient | null = null;

export function getIntelligenceAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.INTELLIGENCE_SUPABASE_URL;
  const supabaseSecretKey = process.env.INTELLIGENCE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) return null;

  intelligenceClient ??= createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return intelligenceClient;
}
