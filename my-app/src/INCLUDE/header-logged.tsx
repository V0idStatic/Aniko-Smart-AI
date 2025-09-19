import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link"; // ✅ Smooth scrolling
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <header className="floating-header">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img
              src="/PICTURES/Logo-hr.png"
              alt="Aniko Logo"
              height="30"
              className="d-inline-block align-text-top"
            />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav gap-3 mx-auto text-center">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <HashLink smooth className="nav-link" to="/#about">About</HashLink>
              </li>
              <li className="nav-item">
                <HashLink smooth className="nav-link" to="/#features">Features</HashLink>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/testimonialSubmit">Testimonial</Link>
              </li>
              <li className="nav-item">
                <HashLink smooth className="nav-link" to="/#download">Download</HashLink>
              </li>
              <li className="nav-item">
                <HashLink smooth className="nav-link" to="/#why-aniko">Why Aniko</HashLink>
              </li>
              <li className="nav-item">
                <HashLink smooth className="nav-link" to="/#team">Team</HashLink>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/compliance">Compliance</Link>
              </li>
            </ul>

            {/* Right Side */}
            <div className="ms-lg-auto text-center mt-3 mt-lg-0">
              {!user ? (
                <Link to="/login" className="btn btn-outline-light px-4 rounded-pill">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Login
                </Link>
              ) : (
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center dropdown-toggle"
                    id="profileDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ background: "transparent", border: "none", color: "white" }}
                  >
                    <img
                      src={user.photoURL || "/IMG/profile.png"}
                      alt="Profile"
                      width="40"
                      height="40"
                      className="rounded-circle border border-light me-2"
                    />
                    <span className="fw-semibold">{user.displayName || "User"}</span>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        .floating-header {
          background: #112822;
          color: white;
          padding: 10px 20px;
          width: calc(100% - 40px);
          margin: 0 auto;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }
        .floating-header .nav-link {
          color: #fff !important;
          font-weight: 500;
          transition: 0.3s;
        }
        .floating-header .nav-link:hover {
          color: #BDE08A !important;
        }
        .dropdown-menu {
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
      `}</style>
    </header>
  );
};

export default Header;
