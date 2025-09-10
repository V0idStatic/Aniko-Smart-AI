import React from "react";
import { useNavigate } from "react-router-dom";

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin_login"); // ✅ corrected route
  };

  return (
    <div
      className="position-fixed top-0 start-0 h-100 shadow"
      style={{
        width: "250px",
        borderRadius: "20px",
        margin: "20px",
        padding: "20px",
        zIndex: 1000,
        background: "var(--gradient-secondary)", // ✅ soft green gradient
        color: "var(--white)",
      }}
    >
      <h4 className="text-center mb-4" style={{ color: "var(--c5)" }}>
        Admin Panel
      </h4>
      <ul className="nav flex-column">
        <li className="nav-item mb-2">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--primary-green)",
              color: "var(--white)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/admin_home")}
          >
            Home
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--primary-brown)",
              color: "var(--white)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/admin_testimonial")}
          >
            Testimonial Management
          </button>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--accent-green)",
              color: "var(--dark-green)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/admin_users")}
          >
            Account Management
          </button>
        </li>

        {/* ✅ New Contact Management */}
        <li className="nav-item mb-2">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--pastel-green)",
              color: "var(--dark-green)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/admin_contact")}
          >
            Contact Management
          </button>
        </li>

        {/* ✅ New Content Management */}
        <li className="nav-item mb-2">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--c2)", // beige brownish shade
              color: "var(--c3)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={() => navigate("/content_management")}
          >
            Content Management
          </button>
        </li>

        <li className="nav-item mt-4">
          <button
            className="btn w-100"
            style={{
              backgroundColor: "var(--dark-brown)",
              color: "var(--white)",
              border: "none",
              borderRadius: "10px",
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default AdminHeader;
