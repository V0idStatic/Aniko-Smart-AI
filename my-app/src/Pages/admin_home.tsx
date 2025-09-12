import React from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../INCLUDE/admin-sidebar";
const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // clear session
    navigate("/admin_login");
  };

  return (
    <div>
      {/* ✅ Floating Sidebar */}
      <AdminHeader />

      {/* ✅ Main Content shifted right */}
      <div style={{ marginLeft: "290px", padding: "20px" }}>
        <h1>Welcome, Admin!</h1>
     
      </div>
    </div>
  );
};

export default AdminHome;
