import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../CONFIG/supabaseClient";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the session from the URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error("No user session found");
      }

      console.log("✅ Auth successful:", session.user.email);

      // Save/update user in database
      const { error: dbError } = await supabase
        .from("users")
        .upsert([
          {
            auth_id: session.user.id,
            username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            profile_picture: session.user.user_metadata?.avatar_url || null,
            last_login: new Date().toISOString(),
          },
        ], {
          onConflict: 'auth_id'
        });

      if (dbError) {
        console.error("❌ Database error:", dbError);
      } else {
        console.log("✅ User saved to database");
      }

      // Redirect to home or intended page
      navigate("/home", { replace: true });

    } catch (err: any) {
      console.error("❌ Auth callback error:", err);
      setError(err.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    }
  };

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;