import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cmzhjmfeukwievsgeqoo.supabase.co";

// ⚠️ For development only - normally this would come from environment variables
// This is the service_role key for admin operations
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtemhqbWZldWt3aWV2c2dlcW9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NjE0MywiZXhwIjoyMDcyMDUyMTQzfQ.sGCpWubBLMLhHAP_bODpYFrBh8xskR1QerZykU_xBGU";

// Validate the key exists
console.log("✅ Supabase admin client initialized successfully");

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabaseAdmin;