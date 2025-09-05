import React, { useEffect } from "react";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
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

          // Save user info to Firebase
          await set(ref(db, "users/" + user.uid), {
            username: user.displayName ?? "",
            email: user.email ?? "",
            profile_picture: user.photoURL ?? "",
            last_login: new Date().toISOString(),
          });

          navigate("/testimonialSubmit");
        } catch (e: any) {
          console.error("Login error:", e.message);
          navigate("/");
        }
      }
    });

    return () => unsub();
  }, [navigate]);

  return null; // ✅ Show nothing while logging in
};

export default Login;
