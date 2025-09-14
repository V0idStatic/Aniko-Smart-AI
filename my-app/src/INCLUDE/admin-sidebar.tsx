import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/admin-sidebar.css";

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin_login");
  };

  return (
    <>
      {/* Sidebar */}
      <div className="admin-sidebar position-fixed top-0 start-0 h-100 shadow">
        <img
          src="PICTURES/Logo-noText.png"
          alt="logo"
          className="sidebar-logo"
        />
        <h4 className="admin-sidebar-title text-center mb-4">Admin Panel</h4>
        <ul className="nav flex-column sidebar-ul">
          <li className="nav-item mb-2">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-home"
              onClick={() => navigate("/admin_home")}
            >
              <i className="bi bi-house-door"></i> Home
            </button>
          </li>

          <li className="nav-item mb-2">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-testimonial"
              onClick={() => navigate("/admin_testimonial")}
            >
              <i className="bi bi-chat-dots"></i> Testimonial Management
            </button>
          </li>

          <li className="nav-item mb-2">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-account"
              onClick={() => navigate("/admin_users")}
            >
              <i className="bi bi-person"></i> Account Management
            </button>
          </li>

          <li className="nav-item mb-2">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-contact"
              onClick={() => navigate("/admin_contact")}
            >
              <i className="bi bi-inbox"></i> Contact Management
            </button>
          </li>

          <li className="nav-item mb-2">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-content"
              onClick={() => navigate("/admin_cms")}
            >
              <i className="bi bi-body-text"></i> Content Management
            </button>
          </li>

          <li className="nav-item mt-4">
            <button
              className="btn w-100 admin-sidebar-btn admin-sidebar-btn-logout"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-box-arrow-left"></i> Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to logout?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
