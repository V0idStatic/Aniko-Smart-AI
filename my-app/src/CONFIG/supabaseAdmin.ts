import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cmzhjmfeukwievsgeqoo.supabase.co";

// ⚠️ Get this from: Supabase Dashboard > Settings > API > service_role key
// This key has FULL admin access - keep it secret!
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtemhqbWZldWt3aWV2c2dlcW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NjE0MywiZXhwIjoyMDcyMDUyMTQzfQ.seuB_V029uWXOeVcdZMPHezDfgHaJ-TMTBccu_8bx_w"; // 🔴 Replace with your actual service_role key

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabaseAdmin;