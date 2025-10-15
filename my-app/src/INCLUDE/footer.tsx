import React, { useState } from "react";
import "../CSS/footer.css";

const Footer: React.FC = () => {
  const [showPolicy, setShowPolicy] = useState(false);

  return (
    <>
      <footer className="footer">
        <div className="container-fluid no-padding">
          <div className="row gx-5">
            {/* Column 1: Logo + Contact + Socials */}
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="footer-logo-section">
                <img
                  src="/PICTURES/Logo-hr.png"
                  alt="Aniko Logo"
                  className="footer-logo img-fluid"
                />
                <div className="footer-contact">
                  Call us at<br />
                  09 125 425 1234
                </div>
                <div className="footer-social">
                 <a 
                        href="https://www.facebook.com/profile.php?id=61582358641412&rdid=CKVpDBUyqF9gPLW1&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1WRFe8y5Yd%2F#" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Facebook"
                      >
                   <i className="bi bi-facebook"></i>
                 </a>
                 <a 
              href="https://www.instagram.com/anikosmartcrop" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
            >
              <i className="bi bi-instagram"></i>
            </a>

                  <a href="#" aria-label="YouTube">
                    <i className="bi bi-youtube"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="footer-links">
                <ul>
                  <li><a href="#">Home</a></li>
                  <li><a href="#about">About</a></li>
                  <li><a href="#features">Feature</a></li>
                  <li><a href="testimonialDisplay">Testimonial</a></li>
                </ul>
              </div>
            </div>

            {/* Column 3 */}
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="footer-links">
                <ul>
                  <li><a href="download">Download</a></li>
                  <li><a href="#why-aniko">Why Aniko</a></li>
                  <li><a href="#team">Team</a></li>
                </ul>
              </div>
            </div>

            {/* Column 4 */}
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="footer-links">
                <ul>
                  <li><a href="compliance">Location</a></li>
                  <li><a href="compliance">Contact Us</a></li>
                  {/* ✅ Privacy Policy Modal Trigger */}
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPolicy(true);
                      }}
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="footer-divider" />

          <div className="row">
            <div className="col-12 text-center">
              <div className="footer-copyright">
                © 2025 Aniko Smart Agriculture. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 🌾 Privacy Policy Modal */}
      {showPolicy && (
        <div className="privacy-modal-overlay" onClick={() => setShowPolicy(false)}>
          <div
            className="privacy-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowPolicy(false)}>
              &times;
            </button>

          <div className="leaf-icon">
          <img 
            src="./PICTURES/Logo-vr.png" 
            alt="Aniko Logo" 
            className="leaf-icon-img"
          />
        </div>

            <h3>Privacy Policy</h3>
            <p>
              At <strong>Aniko Smart Agriculture</strong>, we value your trust and are committed to protecting your data.
              This Privacy Policy explains how we collect, store, and use your information to improve smart farming experiences.
            </p>

            <h5>Data We Collect</h5>
            <p>
              We may collect user information, farm details, and device data to help monitor and optimize soil conditions,
              weather insights, and crop health.
            </p>

            <h5>How We Use Your Data</h5>
            <p>
              Collected data enhances AI-driven insights, automates analysis, and provides personalized recommendations
              for your agricultural needs.
            </p>

            <h5>Data Protection</h5>
            <p>
              We use advanced encryption and secure cloud storage to ensure your information remains private and protected.
            </p>

          
          </div>
        </div>
      )}

   
      <style>{`
     .privacy-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 30, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000; /* stays above header */
  animation: fadeIn 0.3s ease;
}

/* ✨ Base modal styling */
.privacy-modal-content {
  background: linear-gradient(145deg, #1b3d1b, #2b542b);
  color: #f3f7f2;
  border: 2px solid #82d173;
  border-radius: 18px;
  padding: 2rem;
  width: 90%;
  max-width: 650px;
  position: relative;
  box-shadow: 0 0 25px rgba(130, 209, 115, 0.4);
  animation: growUp 0.35s ease;
  overflow-y: auto;
  max-height: 90vh;
}

/* ✨ Scrollbar (subtle for long text) */
.privacy-modal-content::-webkit-scrollbar {
  width: 6px;
}
.privacy-modal-content::-webkit-scrollbar-thumb {
  background: #6bd76b;
  border-radius: 3px;
}
.privacy-modal-content::-webkit-scrollbar-track {
  background: transparent;
}

/* Header + text */
.privacy-modal-content h3 {
  text-align: center;
  color: #b2ffb2;
  margin-bottom: 1rem;
  font-weight: 700;
}

.privacy-modal-content h5 {
  color: #c8ffc8;
  margin-top: 1.5rem;
  font-weight: 600;
}

.privacy-modal-content p {
  color: #e8f5e9;
  line-height: 1.6;
  text-align: justify;
}

/* Logo styling */
.leaf-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.leaf-icon-img {
  width: 60px;
  height: auto;
  filter: drop-shadow(0 0 6px rgba(130, 209, 115, 0.6));
}

/* Close button */
.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #a2f5a2;
  cursor: pointer;
  transition: 0.3s;
}
.close-btn:hover {
  color: #74d874;
  transform: scale(1.1);
}

/* 🌐 RESPONSIVE BREAKPOINTS */

/* 📱 Small phones */
@media (max-width: 480px) {
  .privacy-modal-content {
    width: 90%;
    padding: 1.2rem;
    border-radius: 14px;
  }

  .privacy-modal-content h3 {
    font-size: 1.3rem;
  }

  .privacy-modal-content h5 {
    font-size: 1rem;
  }

  .privacy-modal-content p {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .leaf-icon-img {
    width: 45px;
  }

  .close-btn {
    font-size: 1.4rem;
    top: 8px;
    right: 10px;
  }
}

/* 📲 Medium devices (large phones & small tablets) */
@media (min-width: 481px) and (max-width: 768px) {
  .privacy-modal-content {
    width: 85%;
    padding: 1.5rem;
    border-radius: 16px;
  }

  .privacy-modal-content h3 {
    font-size: 1.4rem;
  }

  .privacy-modal-content h5 {
    font-size: 1.05rem;
  }

  .privacy-modal-content p {
    font-size: 0.95rem;
  }
}

/* 💻 Tablets and small laptops */
@media (min-width: 769px) and (max-width: 1024px) {
  .privacy-modal-content {
    width: 75%;
    padding: 1.8rem;
  }

  .privacy-modal-content p {
    font-size: 1rem;
  }
}

/* 🖥️ Desktops (default looks best as-is) */

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes growUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

      `}</style>
    </>
  );
};

export default Footer;
