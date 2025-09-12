import React from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/admin-sidebar.css";

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin_login");
  };

  return (
    <div className="admin-sidebar position-fixed top-0 start-0 h-100 shadow">
      <img src="PICTURES/Logo-noText.png" alt="logo" className="sidebar-logo"/>
      <h4 className="admin-sidebar-title text-center mb-4">
        Admin Panel
      </h4>
      <ul className="nav flex-column sidebar-ul">
        <li className="nav-item mb-2">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-home"
            onClick={() => navigate("/admin_home")}
          >
            <i className="bi bi-house-door"></i>Home
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-testimonial"
            onClick={() => navigate("/admin_testimonial")}
          >
            <i className="bi bi-chat-dots"></i>Testimonial Management
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-account"
            onClick={() => navigate("/admin_users")}
          >
            <i className="bi bi-person"></i>Account Management
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-contact"
            onClick={() => navigate("/admin_contact")}
          >
            <i className="bi bi-inbox"></i>Contact Management
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-content"
            onClick={() => navigate("/content_management")}
          >
            <i className="bi bi-body-text"></i>Content Management
          </button>
        </li>

        <li className="nav-item mt-4">
          <button
            className="btn w-100 admin-sidebar-btn admin-sidebar-btn-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left"></i>Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AdminHeader;
