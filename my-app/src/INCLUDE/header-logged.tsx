import React from "react";
import { Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import 'bootstrap/dist/css/bootstrap.min.css';




const Header: React.FC = () => {
  return (
    <header className="floating-header">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img
              src="/PICTURES/logo-hr.png"
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
                <li className="nav-item"><Link className="nav-link" to="/testimonialDisplay">Testimonial</Link></li>
              <li className="nav-item"><a className="nav-link" href="#download">Download</a></li>
              <li className="nav-item"><a className="nav-link" href="#why-aniko">Why Aniko</a></li>
              <li className="nav-item"><a className="nav-link" href="#team">Team</a></li>
              <li className="nav-item"><Link className="nav-link" to="/compliance">Compliance</Link></li>
            </ul>

            {/* Example user dropdown (replace with Firebase/Context auth state) */}
            {/* If user logged in, show this */}
            {false && (
              <div className="dropdown ms-auto">
                <a
                  className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                  href="#"
                  role="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src="/IMG/profile.png"
                    alt="Profile"
                    width="40"
                    height="40"
                    className="rounded-circle me-2"
                  />
                  <span>Welcome, User</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li><a className="dropdown-item" href="/logout">Logout</a></li>
                </ul>
              </div>
            )}
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
      `}</style>
    </header>
  );
};

export default Header;
