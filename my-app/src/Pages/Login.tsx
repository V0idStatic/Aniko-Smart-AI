
// src/Pages/Login.tsx
import React, { useEffect, useState } from "react";
import "../App.css";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { ref, set } from "firebase/database";


const Login: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const googleLogin = async () => {
    setStatus("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      await set(ref(db, "users/" + u.uid), {
        username: u.displayName ?? "",
        email: u.email ?? "",
        profile_picture: u.photoURL ?? "",
        last_login: new Date().toISOString(),
      });

      setStatus("Logged in!");
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || e.toString()}`);
    }
  };

  const logout = async () => {
    setStatus("");
    try {
      await signOut(auth);
      setStatus("Logged out");
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || e.toString()}`);
    }
  };

  return (
    <div className="App" style={{ padding: 24 }}>
      <h1>Aniko Smart Monitoring System</h1>

      {!user ? (
        <>

          <button onClick={googleLogin}>Sign in with Google</button>
        </>
      ) : (
        <div style={{ marginTop: 16 }}>
          <img
            src={user.photoURL || ""}
            alt="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "2px solid #4285F4",
            }}
          />
          <h2>Welcome, {user.displayName}</h2>
          <p>
            <b>Email:</b> {user.email}
          </p>
          <p>
            <b>User ID:</b> {user.uid}
          </p>
          <button onClick={logout} style={{ marginTop: 12 }}>
            Log Out
          </button>
        </div>
      )}

      {status && (
        <p
          style={{
            marginTop: 16,
            color: status.toLowerCase().includes("error") ? "#c5221f" : "#137333",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
};

export default Login;