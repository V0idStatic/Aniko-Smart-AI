import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../CONFIG/supabaseClient";
import "../CSS/admin_login.css";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ Login with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Auth error:", authError.message);
        setError("Invalid email or password");
        return;
      }

      // ✅ Check if the logged-in user has admin role
      const user = data?.user;
      if (!user) {
        setError("No user found.");
        return;
      }

      const role = user.user_metadata?.role;
      if (role !== "admin") {
        setError("Access denied: Not an admin.");
        await supabase.auth.signOut(); // logout immediately
        return;
      }

      // ✅ Save session locally (optional)
      localStorage.setItem("adminToken", user.id);

      // ✅ Redirect to admin dashboard
      navigate("/admin_home");
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light adminLogin-body">
      <div className="card shadow p-4 adminLog-card" style={{ width: "600px" }}>
        <img src="PICTURES/Logo-noText.png" className="adminLog-logo" />
        <h3 className="text-center mb-3">Admin Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="adminLog-form">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              placeholder="Enter your admin email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
