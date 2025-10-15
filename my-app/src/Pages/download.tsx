"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import HeaderLogged from "../INCLUDE/header-logged"
import HeaderUnlogged from "../INCLUDE/header-unlogged"

const Download: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  return (
    <>
      {user ? <HeaderLogged /> : <HeaderUnlogged />}
      <div className="download-page-wrapper" style={{ paddingTop: "80px" }}>
        {/* Hero Section */}
        <section className="download-hero">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 text-center text-lg-start">
                <h1 className="download-hero-title">Get Started with Aniko</h1>
                <p className="download-hero-subtitle">
                  Download our smart soil monitoring application and transform your farming experience with real-time
                  insights and AI-powered recommendations.
                </p>
                <a
                  href="https://github.com/your-repo/aniko-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-primary-btn"
                >
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Download from GitHub
                </a>
              </div>
              <div className="col-lg-6 text-center mt-4 mt-lg-0">
                <img src="/PICTURES/github.png" alt="Aniko App" className="img-fluid download-hero-img" />
              </div>
            </div>
          </div>
        </section>

        {/* Installation Guide Section */}
        <section className="installation-guide">
          <div className="container">
            <h2 className="section-title text-center">How to Download & Install</h2>
            <p className="section-subtitle text-center">
              Follow these simple steps to get Aniko up and running on your device
            </p>

            <div className="row mt-5">
              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h4>Clone from GitHub</h4>
                  <p>Visit our GitHub repository and clone the project to your local machine</p>
                  <div className="code-block">
                    <code>git clone https://github.com/your-repo/aniko-app.git</code>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h4>Install Dependencies</h4>
                  <p>Navigate to the project directory and install all required packages</p>
                  <div className="code-block">
                    <code>
                      cd aniko-app
                      <br />
                      npm install
                    </code>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h4>Run the Application</h4>
                  <p>Start the development server and access the app in your browser</p>
                  <div className="code-block">
                    <code>npm start</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Setup */}
            <div className="setup-info mt-5">
              <div className="row">
                <div className="col-lg-6">
                  <div className="info-box">
                    <h4>
                      <svg className="inline-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                      </svg>
                      System Requirements
                    </h4>
                    <ul>
                      <li>Node.js 14.x or higher</li>
                      <li>npm or yarn package manager</li>
                      <li>Modern web browser (Chrome, Firefox, Safari)</li>
                      <li>Stable internet connection</li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="info-box">
                    <h4>
                      <svg className="inline-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                      </svg>
                      Mobile App
                    </h4>
                    <ul>
                      <li>Android 8.0 or higher</li>
                      <li>iOS 12.0 or higher</li>
                      <li>Bluetooth 4.0+ for device pairing</li>
                      <li>Location services enabled</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="getting-started">
          <div className="container">
            <h2 className="section-title text-center">Getting Started Guide</h2>
            <div className="row mt-5 g-3">
              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <h5>Create Account</h5>
                  <p>Sign up with your email and set up your farmer profile</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <h5>Connect Device</h5>
                  <p>Pair your soil monitoring device via Bluetooth or WiFi</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <h5>Set Location</h5>
                  <p>Mark your field locations and assign devices to zones</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                    </svg>
                  </div>
                  <h5>Monitor & Grow</h5>
                  <p>Start receiving real-time data and AI-powered insights</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="support-section">
          <div className="container">
            <div className="support-box">
              <h3>Need Help?</h3>
              <p>Our team is here to support you every step of the way</p>
              <div className="support-links">
                <a href="#" className="support-link">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                  Documentation
                </a>
                <a href="#" className="support-link">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  FAQ
                </a>
                <a href="#" className="support-link">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                  </svg>
                  Community Forum
                </a>
                <a href="#" className="support-link">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </section>

        <style>{`
        .download-page-wrapper {
          background: #cfc4b2;
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -15px;
        }

        .col-lg-6, .col-lg-4, .col-lg-3, .col-md-6, .col-md-4 {
          padding: 0 15px;
        }

        .col-lg-6 { flex: 0 0 50%; max-width: 50%; }
        .col-lg-4 { flex: 0 0 33.333%; max-width: 33.333%; }
        .col-lg-3 { flex: 0 0 25%; max-width: 25%; }
        .col-md-6 { flex: 0 0 50%; max-width: 50%; }
        .col-md-4 { flex: 0 0 33.333%; max-width: 33.333%; }

        .g-4 { gap: 1.5rem; }
        .mt-4 { margin-top: 1.5rem; }
        .mt-5 { margin-top: 3rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        .me-2 { margin-right: 0.5rem; }
        .text-center { text-align: center; }
        .text-lg-start { text-align: left; }
        .align-items-center { align-items: center; }
        .img-fluid { max-width: 100%; height: auto; }

        /* Hero Section */
        .download-hero {
          background: linear-gradient(135deg, #1D492C, #84cc16);
          padding: 100px 20px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .download-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(189, 224, 138, 0.1) 0%, transparent 70%);
          animation: rotate 30s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .download-hero-title {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 24px;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .download-hero-subtitle {
          font-size: 1.3rem;
          margin-bottom: 32px;
          line-height: 1.7;
          opacity: 0.95;
        }

        .download-primary-btn {
          display: inline-flex;
          align-items: center;
          background: white;
          color: #1D492C;
          padding: 16px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .download-primary-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
          color: #1D492C;
        }

        .download-hero-img {
          max-width: 400px;
          filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.3));
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Device Highlights */
        .device-highlights {
          padding: 100px 20px;
          background: white;
        }

        .section-title {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          color: #1D492C;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 1.2rem;
          color: #6b7280;
          max-width: 800px;
          margin: 0 auto 40px;
        }

        .highlight-card {
          background: #f0fdf4;
          border: 2px solid #84cc16;
          border-radius: 20px;
          padding: 40px 30px;
          text-align: center;
          height: 100%;
          transition: all 0.3s ease;
        }

        .highlight-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(132, 204, 22, 0.2);
        }

        .highlight-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1D492C, #84cc16);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 2rem;
          color: white;
        }

        .highlight-card h4 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1D492C;
          margin-bottom: 12px;
        }

        .highlight-card p {
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .device-features-box {
          background: linear-gradient(135deg, #1D492C, #143820);
          border-radius: 30px;
          padding: 60px;
          color: white;
        }

        .device-img {
          max-width: 400px;
          filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3));
        }

        .features-title {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 32px;
        }

        .features-list {
          list-style: none;
          padding: 0;
          font-size: 1.1rem;
        }

        .features-list li {
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }

        .check-icon {
          color: #BDE08A;
          margin-right: 12px;
          flex-shrink: 0;
        }

        /* Installation Guide */
        .installation-guide {
          padding: 100px 20px;
          background: #f9fafb;
        }

        .step-card {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          text-align: center;
          height: 100%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #1D492C, #84cc16);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
        }

        .step-card h4 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1D492C;
          margin-bottom: 16px;
        }

        .step-card p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .code-block {
          background: #1e293b;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
        }

        .code-block code {
          color: #BDE08A;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .setup-info {
          margin-top: 60px;
        }

        .info-box {
          background: white;
          border-radius: 20px;
          padding: 40px;
          height: 100%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .info-box h4 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1D492C;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
        }

        .inline-icon {
          margin-right: 12px;
        }

        .info-box ul {
          list-style: none;
          padding: 0;
        }

        .info-box li {
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .info-box li:last-child {
          border-bottom: none;
        }

        /* Getting Started */
        .getting-started {
          padding: 100px 20px;
          background: white;
        }

        .guide-card {
          background: #f0fdf4;
          border-radius: 20px;
          padding: 40px 30px;
          text-align: center;
          height: 100%;
          transition: all 0.3s ease;
        }

        .guide-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(132, 204, 22, 0.15);
        }

        .guide-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #1D492C, #84cc16);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 1.8rem;
          color: white;
        }

        .guide-card h5 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1D492C;
          margin-bottom: 12px;
        }

        .guide-card p {
          color: #6b7280;
          margin: 0;
        }

        /* Support Section */
        .support-section {
          padding: 100px 20px;
          background: #f9fafb;
        }

        .support-box {
          background: linear-gradient(135deg, #1D492C, #84cc16);
          border-radius: 30px;
          padding: 60px;
          text-align: center;
          color: white;
        }

        .support-box h3 {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .support-box p {
          font-size: 1.2rem;
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .support-links {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
        }

        .support-link {
          background: white;
          color: #1D492C;
          padding: 14px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
        }

        .support-link:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          color: #1D492C;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .col-lg-6, .col-lg-4, .col-lg-3 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          
          .text-lg-start {
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .col-md-6, .col-md-4 {
            flex: 0 0 100%;
            max-width: 100%;
          }

          .download-hero-title {
            font-size: 2.5rem;
          }

          .download-hero-subtitle {
            font-size: 1.1rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .device-features-box {
            padding: 40px 30px;
          }

          .features-title {
            font-size: 2rem;
          }

          .support-box {
            padding: 40px 30px;
          }

          .support-box h3 {
            font-size: 2rem;
          }
        }
      `}</style>
      </div>
    </>
  )
}

export default Download
