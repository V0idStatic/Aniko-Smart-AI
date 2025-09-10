import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-header";

interface User {
  id: number;
  uid: string;
  email: string;
  username: string;
  profile_picture: string;
  last_login: string; // keep as string unless you parse into Date
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  // ✅ Fetch users from Supabase
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users") // ✅ lowercase, matches your table
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Supabase error fetching users:", error);
    } else {
      console.log("📌 Supabase data:", data); // 👈 Debug log
      setUsers(data as User[]);
    }
  };

  // ✅ Delete a user by ID
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting user:", error);
      alert("❌ Failed to delete user: " + error.message);
    } else {
      alert("✅ User deleted successfully!");
      fetchUsers(); // refresh list
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "290px", padding: "20px" }}>
        <h2>👤 Users List</h2>

        <table className="table table-bordered table-striped mt-3">
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
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
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
  );
};

export default AdminUsers;
