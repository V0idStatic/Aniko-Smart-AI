import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://cmzhjmfeukwievsgeqoo.supabase.co";

// ⚠️ IMPORTANT: Never commit service_role key to Git!
// Get this from: Supabase Dashboard > Settings > API > service_role key
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceRoleKey) {
  console.error("❌ Missing REACT_APP_SUPABASE_SERVICE_ROLE_KEY environment variable!");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabaseAdmin;