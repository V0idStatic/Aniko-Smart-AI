import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";
import "../CSS/admin_users.css";


interface User {
  id: number;
  uid: string;
  email: string;
  username: string;
  profile_picture: string;
  last_login: string; 
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users") 
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Supabase error fetching users:", error);
    } else {
      console.log("📌 Supabase data:", data); 
      setUsers(data as User[]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting user:", error);
      alert("❌ Failed to delete user: " + error.message);
    } else {
      alert("✅ User deleted successfully!");
      fetchUsers(); 
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminUsers-header">Account Management</h1>
        <h6 className="adminUsers-subheader">Central hub for managing all user credentials.</h6>
        <div className="card adminUsers-card">
          <h5><i className="bi bi-people-fill"></i>Users List</h5>
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
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>{u.last_login}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm d-flex"
                        onClick={() => handleDelete(u.id)}
                      >
                       <i className="bi bi-trash3-fill"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
     
      </div>
    </div>
  );
};

export default AdminUsers;
