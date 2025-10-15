"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import supabase from "../CONFIG/supabaseClient" // ✅ Changed from firebase
import "bootstrap-icons/font/bootstrap-icons.css"
import "bootstrap/dist/css/bootstrap.min.css"

const HeaderUnlogged: React.FC = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close when clicking outside or pressing ESC
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const navbar = document.getElementById("navbarNav")
      const toggler = document.querySelector(".navbar-toggler")
      if (menuOpen && navbar && !navbar.contains(e.target as Node) && !toggler?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }

    document.addEventListener("click", handleOutsideClick)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("click", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

  const requireLogin = async (e: React.MouseEvent, targetPath: string) => {
    e.preventDefault()
    
    // ✅ Check Supabase session instead of Firebase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      navigate("/login", { state: { redirectTo: targetPath } })
    } else {
      navigate(targetPath)
    }
  }

  return (
    <header className="floating-header">
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand" to="/">
            <img src="/PICTURES/Logo-hr.png" alt="Aniko Logo" height="30" className="d-inline-block align-text-top" />
          </Link>

          {/* Burger Button */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list text-light fs-2"></i>
          </button>

          <div className={`side-panel ${menuOpen ? "open" : ""}`} id="navbarNav">
            {/* Close button inside panel */}
            <button className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <i className="bi bi-x-lg"></i>
            </button>

            <ul className="navbar-nav gap-3 text-center">
              <li className="nav-item">
                <Link className="nav-link" to="/" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-house-door me-2"></i>Home
                </Link>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-info-circle me-2"></i>About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#features" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-star me-2"></i>Features
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="testimonialDisplay" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-chat-quote me-2"></i>Testimonial
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#download" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-download me-2"></i>Download
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#why-aniko" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-question-circle me-2"></i>Why Aniko
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#team" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-people me-2"></i>Team
                </a>
              </li>

              {/* Requires login */}
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/compliance"
                  onClick={(e) => {
                    requireLogin(e, "/compliance")
                    setMenuOpen(false)
                  }}
                >
                  <i className="bi bi-shield-check me-2"></i>Compliance
                </a>
              </li>
            </ul>

            {/* Login Button */}
            <div className="mt-4">
              <Link to="/login" className="btn btn-outline-light w-100 rounded-pill" onClick={() => setMenuOpen(false)}>
                <i className="bi bi-box-arrow-in-right me-2"></i>Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop when side panel open */}
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)}></div>}

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
          z-index: 1060;
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

        /* Side Panel Styles */
        .side-panel {
          position: fixed;
          top: 0;
          right: -320px;
          width: 320px;
          height: 100vh;
          background: #112822;
          padding: 80px 30px 30px;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
          transition: right 0.3s ease-in-out;
          z-index: 1070;
          overflow-y: auto;
          /* Added flexbox centering for side panel content */
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .side-panel.open {
          right: 0;
        }

        .side-panel .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #BDE08A;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px;
          transition: transform 0.2s;
        }

        .side-panel .close-btn:hover {
          transform: rotate(90deg);
          color: #fff;
        }

        .side-panel .nav-item {
          margin-bottom: 8px;
        }

        .side-panel .nav-link {
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          /* Center the content within each nav link */
          justify-content: center;
          transition: all 0.2s;
        }

        .side-panel .nav-link:hover {
          background: rgba(189, 224, 138, 0.1);
          /* Removed left padding shift on hover to maintain center alignment */
        }

      

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Desktop: Show normal navbar */
        @media (min-width: 992px) {
          .navbar-toggler {
            display: none;
          }

          .side-panel {
            position: static;
            width: auto;
            height: auto;
            padding: 0;
            box-shadow: none;
            background: transparent;
            display: flex !important;
            align-items: center;
            flex-direction: row;
            overflow: visible;
            /* Added flex: 1 to allow navbar to take full width */
            flex: 1;
          }

          .side-panel .close-btn {
            display: none;
          }

          .side-panel .navbar-nav {
            flex-direction: row;
            /* Centered the navigation items horizontally */
            margin: 0 auto;
            justify-content: center;
          }

          .side-panel .nav-item {
            margin-bottom: 0;
          }

          .side-panel .nav-link {
            padding: 8px 12px;
          }

          .side-panel .nav-link:hover {
            background: transparent;
            padding-left: 12px;
          }

          .side-panel .nav-link i {
            display: none;
          }

          .side-panel .mt-4 {
            margin-top: 0 !important;
            margin-left: auto;
          }

          .side-panel .btn {
            width: auto !important;
            padding: 8px 24px;
          }

          .backdrop {
            display: none;
          }
        }

        /* Medium Screens (992px - 1081px): Slightly smaller navs and buttons */
        @media (min-width: 992px) and (max-width: 1081px) {
          .floating-header {
            padding: 8px 16px;
          }

          .floating-header .navbar-brand img {
            height: 26px;
          }

          .floating-header .nav-link {
            font-size: 14px;
            padding: 6px 10px;
          }

          .floating-header .btn-outline-light {
            padding: 6px 18px;
            font-size: 14px;
            border-width: 1.5px;
          }

          .navbar-nav.gap-3 {
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </header>
  )
}

export default HeaderUnlogged
