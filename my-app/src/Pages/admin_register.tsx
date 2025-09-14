import React, { useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";

const AdminRegister: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    // Step 1: Create admin account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "admin", username: "superadmin" }, // stored in user_metadata
      },
    });

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    // Step 2: Immediately login admin (so password is stored properly)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setMsg("⚠️ Registered but login failed: " + loginError.message);
      return;
    }

    setMsg("✅ Admin created & logged in! You can now access admin dashboard.");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto" }}>
      <h3>Register Admin</h3>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Create Admin</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
};

export default AdminRegister;
