import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../CONFIG/supabaseClient"; 
import bcrypt from "bcryptjs";
import "../CSS/admin_login.css";



const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("id, username, password")
      .eq("username", username.trim())
      .maybeSingle();

    console.log("Supabase error:", error);
    console.log("Supabase data:", data);

    if (error || !data) {
      setError("Invalid username or password. (User not found)");
      return;
    }

    const hash = data.password.replace(/^\$2y\$/, "$2a$");
    console.log("Stored hash:", hash);
    console.log("Entered password:", password);

    const validPassword = await bcrypt.compare(password, hash);
    console.log("Password valid:", validPassword);

    if (!validPassword) {
      setError("Invalid username or password. (Password mismatch)");
      return;
    }

    localStorage.setItem("adminToken", data.id);
    navigate("/admin_home");
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  }
};


  return (
    <body className="admin-login-body" style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light adminLogin-body">
        <div className="card shadow p-4 adminLog-card" style={{ width: "600px" }}>
          <img src="PICTURES/Logo-noText.png" className="adminLog-logo"/>
          <h3 className="text-center mb-3">Admin Login</h3>
          {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="adminLog-form">
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
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
    </body>
   
  );
};

export default AdminLogin;
