// CONFIG/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ⬇️ Replace with your actual project details
const supabaseUrl = "https://cmzhjmfeukwievsgeqoo.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtemhqbWZldWt3aWV2c2dlcW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzYxNDMsImV4cCI6MjA3MjA1MjE0M30.3FZcf9P1ZPAIgKjZRRtqXyTQIYE5XRW_Sph5DfpAcDc"; // ⚠️ NOT the service_role key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
