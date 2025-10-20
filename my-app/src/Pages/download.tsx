"use client"

import type React from "react"
import { useEffect, useState } from "react"
import supabase from "../CONFIG/supabaseClient"
import HeaderLogged from "../INCLUDE/header-logged"
import HeaderUnlogged from "../INCLUDE/header-unlogged"
import Footer from "../INCLUDE/footer"

const Download: React.FC = () => {
  const [user, setUser] = useState<any>(null)

  // ✅ Use Supabase auth instead of Firebase
  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      {/* ✅ Conditionally render header based on Supabase auth state */}
      {user ? <HeaderLogged /> : <HeaderUnlogged />}
      
      <div className="download-page-wrapper" style={{ paddingTop: "80px" }}>
        {/* Hero Section */}
        <section className="download-hero">
          <div className="container ">
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
                <img src="/PICTURES/device1.png" alt="Aniko App" className="img-fluid download-hero-img" />
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

            <div className="row mt-5 g-4">
              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h4>Tap the Download from Github Button</h4>
                  <p>It will proceed you to the github repository of AniKo</p>
                 
                </div>
              </div>

              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h4>Tap the Download button.</h4>
                  <p> Wait for the file to finish downloading. (Check your browser’s downloads or notification tray.)</p>
              
                </div>
              </div>  

              <div className="col-md-4">
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h4>Install the APK </h4>
                  <p>Locate the downloaded APK file on your device and tap to install (After that you are ready to go)</p>

                </div>
              </div>

            

              

              
            </div>
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="getting-started-guide">
          <div className="container">
            <h2 className="section-title text-center">Getting Started Guide</h2>
            <p className="section-subtitle text-center">Learn the basics to make the most of Aniko</p>

            <div className="row mt-5 g-4">
              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <h4>Create Your Account</h4>
                  <p>Sign up with your email or social media account to access all features and save your data.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <i className="bi bi-gear"></i>
                  </div>
                  <h4>Configure Settings</h4>
                  <p>Set up your farm profile, add your fields, and configure monitoring preferences.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <i className="bi bi-wifi"></i>
                  </div>
                  <h4>Connect Sensors</h4>
                  <p>Pair your soil monitoring sensors with the app to start receiving real-time data.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="guide-card">
                  <div className="guide-icon">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <h4>Monitor & Analyze</h4>
                  <p>View live data, track trends, and get AI-powered recommendations for better yields.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Requirements */}
        <section className="system-requirements">
          <div className="container">
            <h2 className="section-title text-center">System Requirements</h2>
            <p className="section-subtitle text-center">Ensure your device meets these minimum specifications</p>

            <div className="row mt-5">
              <div className="col-md-6">
                <div className="requirement-card">
                  <h4>
                    <i className="bi bi-phone me-2"></i>Mobile Requirements
                  </h4>
                  <ul>
                    <li>Android 8.0 or higher / iOS 12.0 or higher</li>
                    <li>Minimum 2GB RAM</li>
                    <li>50MB free storage space</li>
                    <li>Internet connection for real-time updates</li>
                    <li>Bluetooth 4.0+ for sensor connectivity</li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="requirement-card">
                  <h4>
                    <i className="bi bi-laptop me-2"></i>Desktop Requirements
                  </h4>
                  <ul>
                    <li>Windows 10+, macOS 10.14+, or Linux</li>
                    <li>Minimum 4GB RAM</li>
                    <li>100MB free storage space</li>
                    <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                    <li>Stable internet connection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

     

        {/* Support Section */}
        <section className="support-section">
          <div className="container">
            <div className="support-box text-center">
              <h3>Need Help?</h3>
              <p>Our support team is here to assist you with installation, setup, and troubleshooting.</p>
              <div className="support-buttons mt-4">
                <a href="/compliance" className="btn btn-outline-primary me-3">
                  <i className="bi bi-chat-dots me-2"></i>Contact Support
                </a>
                <a href="#" className="btn btn-outline-secondary">
                  <i className="bi bi-file-text me-2"></i>View Documentation
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ✅ Footer moved outside the wrapper for proper placement */}
      <Footer />

      <style>{`
        /* Import Google Fonts - matching home.tsx */
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap');

        .download-page-wrapper {
          background: #CFC4B2;
          min-height: calc(100vh - 80px);
          margin-top: -80px;
          font-family: 'Lexend', system-ui, sans-serif;
          color: #374151;
        }
  

        .download-hero {
          padding: 120px 20px 100px;
          background: linear-gradient(135deg, #1d492c 0%, #2e7d32 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .download-hero-title {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          margin-bottom: 32px;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: #f0fdf4;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .download-hero-subtitle {
          font-family: 'Lexend', sans-serif;
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          font-weight: 300;
          margin-bottom: 40px;
          opacity: 0.95;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.95);
        }

        .download-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 20px 40px;
          background: #bde08a;
          color: #1d492c;
          text-decoration: none;
          border-radius: 60px;
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(189, 224, 138, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .download-primary-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.6s;
        }

        .download-primary-btn:hover::before {
          left: 100%;
        }

        .download-primary-btn:hover {
          background: #a8d176;
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 35px rgba(189, 224, 138, 0.5);
          color: #143820;
        }

        .download-hero-img {
          max-width: 400px;
          filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.3));
          transition: all 0.4s ease;
        }

        .download-hero-img:hover {
          transform: scale(1.05);
        }

        .installation-guide,
        .getting-started-guide,
        .system-requirements,
        .support-section {
          padding: 80px 0;
        }

        .section-title {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #4D2D18;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
          position: relative;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 4px;
          background: linear-gradient(135deg, #1d492c, #84cc16);
          border-radius: 2px;
        }

        .section-subtitle {
          font-family: 'Lexend', sans-serif;
          font-size: 1.2rem;
          font-weight: 300;
          color: #8A6440;
          margin-bottom: 3rem;
          line-height: 1.8;
        }

        .step-card,
        .guide-card,
        .requirement-card {
          background: white;
          padding: 50px 32px;
          border-radius: 20px;
          border-top-right-radius: 80px;
          border-bottom-left-radius: 80px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          border: 2px solid #84cc16;
          position: relative;
          overflow: hidden;
        }

        /* ✅ Removed all green line hover effects (::before pseudo-elements) */

        .step-card:hover,
        .guide-card:hover,
        .requirement-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 40px rgba(21, 128, 61, 0.15);
          border-color: #84cc16;
        }

        .step-card h4,
        .guide-card h4 {
          font-family: 'Lexend', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1d492c;
          margin-bottom: 15px;
        }

        .step-card p,
        .guide-card p {
          font-family: 'Lexend', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #374151;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #1d492c, #2e7d32);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Lexend', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(29, 73, 44, 0.3);
        }

        .code-block {
          background: #1e293b;
          color: #10b981;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          overflow-x: auto;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .code-block code {
          color: #10b981;
          font-family: 'Courier New', monospace;
        }

        .guide-icon {
          font-size: 3rem;
          color: #2e7d32;
          margin-bottom: 20px;
        }

        .requirement-card h4 {
          font-family: 'Lexend', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1d492c;
          margin-bottom: 20px;
        }

        .requirement-card ul {
          list-style: none;
          padding-left: 0;
        }

        .requirement-card ul li {
          font-family: 'Lexend', sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #374151;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          line-height: 1.7;
        }

        .requirement-card ul li:last-child {
          border-bottom: none;
        }

        .support-box {
          background: linear-gradient(135deg, #1d492c, #2e7d32);
          color: white;
          padding: 60px 40px;
          border-radius: 32px;
          box-shadow: 0 20px 40px rgba(21, 128, 61, 0.2);
          position: relative;
          overflow: hidden;
        }

        .support-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="support-pattern" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23support-pattern)"/></svg>') repeat;
        }

        .support-box h3 {
          font-family: 'Zalando Sans Expanded', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 2;
        }

        .support-box p {
          font-family: 'Lexend', sans-serif;
          font-size: 1.2rem;
          font-weight: 300;
          opacity: 0.95;
          line-height: 1.8;
          position: relative;
          z-index: 2;
        }

        .support-buttons {
          position: relative;
          z-index: 2;
        }

        .support-buttons .btn {
          font-family: 'Lexend', sans-serif;
          padding: 15px 30px;
          font-weight: 600;
          border-radius: 50px;
          transition: all 0.4s ease;
          font-size: 1rem;
        }

        .support-buttons .btn-outline-primary {
          color: white;
          border-color: white;
          border-width: 2px;
        }

        .support-buttons .btn-outline-primary:hover {
          background: white;
          color: #1d492c;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
        }

        .support-buttons .btn-outline-secondary {
          color: white;
          border-color: rgba(255, 255, 255, 0.5);
          border-width: 2px;
        }

        .support-buttons .btn-outline-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: white;
          transform: translateY(-2px);
        }

        @media (max-width: 991px) {
          .download-hero {
            padding: 80px 20px 60px;
          }

          .download-hero-title {
            font-size: 2.5rem;
            margin-bottom: 24px;
          }

          .download-hero-subtitle {
            font-size: 1.1rem;
            margin-bottom: 32px;
          }

          .download-primary-btn {
            padding: 16px 32px;
            font-size: 1rem;
          }

          .section-title {
            font-size: 2rem;
            margin-bottom: 20px;
          }

          .section-subtitle {
            font-size: 1rem;
            margin-bottom: 2rem;
          }

          .step-card,
          .guide-card,
          .requirement-card {
            padding: 40px 25px;
          }

          .support-box {
            padding: 40px 30px;
          }

          .support-box h3 {
            font-size: 2rem;
          }

          .support-box p {
            font-size: 1rem;
          }
        }

        @media (max-width: 768px) {
          .download-hero {
            padding: 60px 20px 40px;
          }

          .installation-guide,
          .getting-started-guide,
          .system-requirements,
          .support-section {
            padding: 60px 0;
          }

          .step-card,
          .guide-card,
          .requirement-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </>
  )
}

export default Download