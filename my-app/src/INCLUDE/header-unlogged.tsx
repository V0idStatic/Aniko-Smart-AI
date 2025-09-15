import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // ✅ adjust path if needed
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";

const HeaderUnlogged: React.FC = () => {
  const navigate = useNavigate();

  const requireLogin = (e: React.MouseEvent, targetPath: string) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      // Not logged in → send to login
      navigate("/login", { state: { redirectTo: targetPath } });
    } else {
      // Already logged in → go to target page
      navigate(targetPath);
    }
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
              <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
              <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link" href="#features">Features</a></li>

              {/* Require login for Testimonial */}
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/testimonialDisplay"
                  onClick={(e) => requireLogin(e, "/testimonialDisplay")}
                >
                  Testimonial
                </a>
              </li>

              <li className="nav-item"><a className="nav-link" href="#download">Download</a></li>
              <li className="nav-item"><a className="nav-link" href="#why-aniko">Why Aniko</a></li>
              <li className="nav-item"><a className="nav-link" href="#team">Team</a></li>

              {/* Require login for Compliance */}
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/compliance"
                  onClick={(e) => requireLogin(e, "/compliance")}
                >
                  Compliance
                </a>
              </li>
            </ul>

            {/* LOGIN BUTTON on the right side */}
            <div className="ms-lg-auto text-center mt-3 mt-lg-0">
              <Link to="/login" className="btn btn-outline-light px-4 rounded-pill">
                <i className="bi bi-box-arrow-in-right me-2"></i>Login
              </Link>
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
        .floating-header .btn-outline-light {
          border: 2px solid #BDE08A;
          color: #BDE08A;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .floating-header .btn-outline-light:hover {
          background: #BDE08A;
          color: #112822;
        }
      `}</style>
    </header>
  );
};

export default HeaderUnlogged;
