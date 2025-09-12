import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient"; // ✅ always default import
import AdminHeader from "../INCLUDE/admin-header";
import bcrypt from "bcryptjs"; // ✅ for password hashing
import "../CSS/admin_users.css";

interface User {
  id: number;
  uid: string;
  email: string;
  username: string;
  profile_picture: string;
  last_login: string;
}

interface AdminAccount {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [view, setView] = useState<"users" | "admins">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: "user" | "admin" } | null>(null);

  // Register admin modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true });
    if (!error && data) setUsers(data as User[]);
  };

  // Fetch Admins
  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admin_accounts").select("*").order("id", { ascending: true });
    if (!error && data) setAdmins(data as AdminAccount[]);
  };

  // Handle Delete
  const confirmDelete = (id: number, type: "user" | "admin") => {
    setDeleteTarget({ id, type });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "user") {
      await supabase.from("users").delete().eq("id", deleteTarget.id);
    } else {
      await supabase.from("admin_accounts").delete().eq("id", deleteTarget.id);
    }

    setShowModal(false);
    setDeleteTarget(null);
  };

  // Handle Register Admin (with password hashing)
  const handleRegisterAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      alert("⚠️ Username and password are required.");
      return;
    }

    try {
      // 🔒 Hash the password before saving
      const hashedPassword = await bcrypt.hash(newAdmin.password, 10);

      const { error } = await supabase.from("admin_accounts").insert([
        {
          username: newAdmin.username,
          password: hashedPassword, // ✅ store hashed password
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert("❌ Failed to register admin: " + error.message);
      } else {
        setNewAdmin({ username: "", password: "" });
        setShowRegisterModal(false);
        fetchAdmins();

        // ✅ Show success modal instead of alert
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Hashing error:", err);
      alert("❌ Failed to hash password.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdmins();

    // Realtime subscriptions
    const usersSub = supabase
      .channel("users-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        fetchUsers();
      })
      .subscribe();

    const adminsSub = supabase
      .channel("admins-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_accounts" }, () => {
        fetchAdmins();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(adminsSub);
    };
  }, []);

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminUsers-header">Account Management</h1>
        <h6 className="adminUsers-subheader">Central hub for managing all user and admin accounts.</h6>

        {/* Toggle Buttons */}
        <div className="mb-3">
          <button
            className={`btn me-2 ${view === "users" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("users")}
          >
            Users
          </button>
          <button
            className={`btn me-2 ${view === "admins" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("admins")}
          >
            Admins
          </button>

          {view === "admins" && (
            <button className="btn btn-success" onClick={() => setShowRegisterModal(true)}>
              <i className="bi bi-person-plus-fill"></i> Register Admin
            </button>
          )}
        </div>

        {/* Users Table */}
        {view === "users" && (
          <div className="card adminUsers-card">
            <h5><i className="bi bi-people-fill"></i> Users List</h5>
            <table className="table table-bordered table-striped mt-3 adminUsers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>UID</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Profile Picture</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.uid}</td>
                      <td>{u.email}</td>
                      <td>{u.username}</td>
                      <td>
                        {u.profile_picture ? (
                          <img
                            src={u.profile_picture}
                            alt="profile"
                            width={40}
                            height={40}
                            style={{ borderRadius: "50%" }}
                          />
                        ) : "N/A"}
                      </td>
                      <td>{new Date(u.last_login).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm d-flex"
                          onClick={() => confirmDelete(u.id, "user")}
                        >
                          <i className="bi bi-trash3-fill"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="text-center">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Admins Table */}
        {view === "admins" && (
          <div className="card adminUsers-card">
            <h5><i className="bi bi-person-badge-fill"></i> Admin Accounts</h5>
            <table className="table table-bordered table-striped mt-3 adminUsers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Password (hashed)</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.length > 0 ? (
                  admins.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.username}</td>
                      <td>{a.password}</td>
                      <td>{new Date(a.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm d-flex"
                          onClick={() => confirmDelete(a.id, "admin")}
                        >
                          <i className="bi bi-trash3-fill"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-center">No admins found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this {deleteTarget?.type}?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Admin Modal */}
      {showRegisterModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Register New Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowRegisterModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleRegisterAdmin}>Register</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Success</h5>
                <button type="button" className="btn-close" onClick={() => setShowSuccessModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>✅ Admin registered successfully!</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => setShowSuccessModal(false)}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
