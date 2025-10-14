import React, { useEffect } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import supabase from "../CONFIG/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Extract redirect destination from router state (default to /home)
  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || "/home";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // ✅ Already logged in → go straight to redirect target
        navigate(redirectTo, { replace: true });
      } else {
        try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const user = result.user;

          // ✅ Save user info to Supabase
          const { error } = await supabase.from("users").upsert([
            {
              uid: user.uid,
              username: user.displayName ?? "",
              email: user.email ?? "",
              profile_picture: user.photoURL ?? "",
              last_login: new Date().toISOString(),
            },
          ]);

          if (error) {
            console.error("❌ Supabase error saving user:", error.message);
          } else {
            console.log("✅ User saved to Supabase:", user.uid);
          }

          // ✅ After successful login, redirect back to testimonialSubmit or whatever was stored
          navigate(redirectTo, { replace: true });
        } catch (e: any) {
          console.error("Login error:", e.message);
          navigate("/");
        }
      }
    });

    return () => unsub();
  }, [navigate, redirectTo]);

  return <div></div>;
};

export default Login;
