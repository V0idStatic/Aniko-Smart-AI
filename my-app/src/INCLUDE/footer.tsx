import React from "react";
import "../CSS/footer.css";

const Footer: React.FC = () => {
  return (
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
                <a href="#" aria-label="Facebook">
                  <i className="bi bi-facebook"></i>               
                </a>
                <a href="#" aria-label="Instagram">
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
                <li><a href="#">Privacy Policy</a></li>

              </ul>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="row">
          <div className="col-12 text-center">
            <div className="footer-copyright">
              Copy Right 2025, Aniko
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
