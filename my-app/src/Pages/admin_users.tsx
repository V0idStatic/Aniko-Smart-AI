import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import supabaseAdmin from "../CONFIG/supabaseAdmin";
import AdminHeader from "../INCLUDE/admin-sidebar";
import bcrypt from "bcryptjs";
import "../CSS/admin_users.css";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; type: "user" | "admin" } | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState(""); 

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUsers = async () => {
    try {
      console.log("🔄 Fetching users from Supabase Auth...");
      const { data: { users: authUsers }, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error("❌ Error fetching users:", error);
      } else {
        console.log("✅ Fetched users:", authUsers?.length || 0);
        setUsers(authUsers as User[] || []);
      }
    } catch (err) {
      console.error("❌ Error in fetchUsers:", err);
    }
  };

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admin_accounts").select("*").order("id", { ascending: true });
    if (!error && data) {
      setAdmins(data as AdminAccount[]);
      console.log("✅ Fetched admins:", data.length);
    }
  };

  const confirmDelete = (id: string | number, type: "user" | "admin") => {
    setDeleteTarget({ id, type });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "user") {
        // Delete user from Supabase Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(deleteTarget.id as string);
        if (error) {
          console.error("❌ Error deleting user:", error);
          alert("Failed to delete user: " + error.message);
        } else {
          console.log("✅ User deleted successfully");
          setSuccessMessage("User deleted successfully!");
          setShowSuccessModal(true);
          fetchUsers();
        }
      } else {
        // Delete admin from admin_accounts table
        const { error } = await supabase.from("admin_accounts").delete().eq("id", deleteTarget.id);
        if (error) {
          console.error("❌ Error deleting admin:", error);
          alert("Failed to delete admin: " + error.message);
        } else {
          console.log("✅ Admin deleted successfully");
          setSuccessMessage("Admin deleted successfully!");
          setShowSuccessModal(true);
          fetchAdmins();
        }
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("An error occurred while deleting.");
    }

    setShowModal(false);
    setDeleteTarget(null);
  };

  const handleRegisterAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      alert("Username and password are required.");
      return;
    }

    if (newAdmin.password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(newAdmin.password, 10);

      const { error } = await supabase.from("admin_accounts").insert([
        {
          username: newAdmin.username,
          password: hashedPassword,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert("Failed to register admin: " + error.message);
      } else {
        setNewAdmin({ username: "", password: "" });
        setConfirmPassword("");
        setShowRegisterModal(false);
        fetchAdmins();
        setSuccessMessage("Admin registered successfully!");
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Hashing error:", err);
      alert("Failed to hash password.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdmins();

    // Real-time subscription for admin_accounts
    const adminsSub = supabase
      .channel("admins-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_accounts" }, () => {
        fetchAdmins();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(adminsSub);
    };
  }, []);

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminUsers-header">Account Management</h1>
        <h6 className="adminUsers-subheader">Central hub for managing all user and admin accounts.</h6>

        <div className="mb-3 adminUsers-toggle">
          <button
            className={`btn adminUsers-userBtn me-2 ${view === "users" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("users")}
          >
            Users ({users.length})
          </button>
          <button
            className={`btn adminUsers-adminBtn me-2 ${view === "admins" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("admins")}
          >
            Admins ({admins.length})
          </button>
        </div>

        {view === "users" && (
          <div className="card adminUsers-card">
            <h5><i className="bi bi-people-fill"></i> Users List</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-striped mt-3 adminUsers-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Avatar</th>
                    <th>Provider</th>
                    <th>Created At</th>
                    <th>Last Sign In</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{u.id}</td>
                        <td>{u.email}</td>
                        <td>{u.user_metadata?.full_name || "—"}</td>
                        <td>
                          {u.user_metadata?.avatar_url ? (
                            <img
                              src={u.user_metadata.avatar_url}
                              alt="avatar"
                              width={40}
                              height={40}
                              style={{ borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#ddd",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <i className="bi bi-person-fill"></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {u.app_metadata?.provider || u.app_metadata?.providers?.[0] || "email"}
                          </span>
                        </td>
                        <td>{new Date(u.created_at).toLocaleString()}</td>
                        <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                            onClick={() => confirmDelete(u.id, "user")}
                          >
                            <i className="bi bi-trash3-fill"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} className="text-center">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "admins" && (
          <button className="btn btn-success adminUsers-regBtn mb-3" onClick={() => setShowRegisterModal(true)}>
            <i className="bi bi-person-plus-fill"></i> Register Admin
          </button>
        )}

        {view === "admins" && (
          <div className="card adminUsers-card">
            <h5><i className="bi bi-person-badge-fill"></i> Admin Accounts</h5>
            <div className="table-responsive">
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
                        <td style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{a.password}</td>
                        <td>{new Date(a.created_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <>
          <div className="adminUsers-backdrop"></div>
          <div className="modal fade show delModal" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered delModal-dialog">
              <div className="modal-content delModal-content">
                <div className="modal-header delModal-header">
                  <h5 className="modal-title delModal-title">
                    <i className="bi bi-person-dash-fill"></i> Confirm Deletion
                  </h5>
                </div>
                <div className="modal-body delModal-body">
                  <p>Are you sure you want to delete this {deleteTarget?.type}?</p>
                  <p className="text-muted small">This action cannot be undone.</p>
                </div>
                <div className="modal-footer delModal-footer">
                  <button className="btn delModal-cancelBtn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn delModal-delBtn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Register Admin Modal */}
      {showRegisterModal && (
        <>
          <div className="adminUsers-backdrop"></div>
          <div className="modal fade show adminUsers-modal" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered adminUsers-modal-dialog">
              <div className="modal-content adminUsers-modal-content">
                <div className="modal-header adminUsers-modal-header">
                  <h5 className="modal-title adminUsers-modal-title">
                    <i className="bi bi-person-add"></i> Register New Admin
                  </h5>
                </div>
                <div className="modal-body adminUsers-modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control adminUsers-fc"
                      value={newAdmin.username}
                      placeholder="Enter username"
                      onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control adminUsers-fc"
                      value={newAdmin.password}
                      placeholder="Enter password"
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control adminUsers-fc"
                      value={confirmPassword}
                      placeholder="Re-enter password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer adminUsers-modal-footer">
                  <button
                    className="btn adminUsers-modal-cancelBtn btn-secondary"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setConfirmPassword("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn adminUsers-modal-regBtn btn-success"
                    onClick={handleRegisterAdmin}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <>
          <div className="adminUsers-backdrop"></div>
          <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-success">
                    <i className="bi bi-check-circle-fill"></i> Success
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowSuccessModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>{successMessage}</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-success" onClick={() => setShowSuccessModal(false)}>OK</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;