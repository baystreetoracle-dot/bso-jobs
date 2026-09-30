import { createClient } from "@supabase/supabase-js";

export async function readSupabaseSnapshot() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return { available: false, jobs: [], companies: [], error: "Supabase read credentials are unavailable." };
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [jobsResult, companiesResult] = await Promise.all([
    client.from("jobs").select("*"),
    client.from("companies").select("*"),
  ]);
  const error = jobsResult.error ?? companiesResult.error;
  if (error) return { available: false, jobs: [], companies: [], error: error.message };
  return { available: true, jobs: jobsResult.data ?? [], companies: companiesResult.data ?? [], error: null };
}
