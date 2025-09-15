import React, { useEffect } from "react";
import { auth } from "../firebase"; // ✅ keep Firebase Auth for Google login
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import supabase  from "../CONFIG/supabaseClient"; // ✅ make sure you have this client
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // ✅ Already logged in → redirect
        navigate("/testimonialSubmit");
      } else {
        // ✅ Only try Google login when auth is ready and user is null
        try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          const user = result.user;

          // ✅ Save user info to Supabase (instead of Firebase)
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

          navigate("/home");
        } catch (e: any) {
          console.error("Login error:", e.message);
          navigate("/");
        }
      }
    });

    return () => unsub();
  }, [navigate]);

  return <div></div>; // ✅ better UX than `null`
};

export default Login;
