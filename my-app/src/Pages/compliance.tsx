import React from "react";
import { Link } from "react-router-dom";
import '../CSS/compliance.css';
import Header from "../INCLUDE/header-logged";
import Footer from "../INCLUDE/footer";

const Compliance: React.FC = () => {
  return (
    <div className="page-wrapper">
      <Header />

      <div className="main-content">
        <section className="contact-section">
            <div className="contact-wrapper">
              {/* Contact Info */}
              <div className="contact-info-section">
                <h3>Get In Touch</h3>
                <div className="contact-item">
                  <i className="bi bi-geo-alt-fill"></i>
                  <div className="contact-item-content">
                    Olongapo City, Zambales, Philippines
                  </div>
                </div>
                <div className="contact-item">
                  <i className="bi bi-phone"></i>
                  <div className="contact-item-content">
                    0912-123-1234
                  </div>
                </div>
                <div className="contact-item">
                  <i className="bi bi-envelope"></i>
                  <div className="contact-item-content">
                    anikosmartcropsystem@gmail.com
                  </div>
                </div>
                <div className="contact-item">
                  <i className="bi bi-clock"></i>
                  <div className="contact-item-content">
                    9:00 AM - 10:00 PM
                  </div>
                </div>
                <div className="social-links">
                  <a href="#"><i className="bi bi-facebook"></i></a>
                  <a href="#"><i className="bi bi-twitter"></i></a>
                  <a href="#"><i className="bi bi-instagram"></i></a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-section">
                <form action="process_contact.php" method="POST">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="text" className="form-control" id="firstName" name="firstName" placeholder="First Name" required />
                        <label htmlFor="firstName">First Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="text" className="form-control" id="lastName" name="lastName" placeholder="Last Name" required />
                        <label htmlFor="lastName">Last Name</label>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="email" className="form-control" id="email" name="email" placeholder="Email Address" required />
                        <label htmlFor="email">Email Address</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input type="tel" className="form-control" id="phone" name="phone" placeholder="Phone Number" />
                        <label htmlFor="phone">Phone Number</label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <select className="form-select" id="subject" name="subject" required>
                      <option value="disable" disabled selected>Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales Question</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-floating mb-4">
                    <textarea className="form-control" id="message" name="message" placeholder="Your message" style={{ height: "120px" }} required></textarea>
                    <label htmlFor="message">Tell us how we can help you...</label>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="newsletter" name="newsletter" />
                      <label className="form-check-label" htmlFor="newsletter">
                        I'd like to receive updates and news
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-submit w-100">
                    <i className="fas fa-paper-plane me-2"></i>Send Message
                  </button>
                </form>
              </div>
            </div>
        </section>

        {/* Success Modal */}
        <div className="modal fade" id="successModal" tabIndex={-1} aria-labelledby="successModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "20px", border: "2px solid var(--dark-green)" }}>
              <div className="modal-header bg-success text-white" style={{
                background: "var(--gradient-secondary)",
                color: "var(--light-green)",
                border: "0",
                borderTop: "2px solid var(--dark-green)",
                borderTopRightRadius: "20px",
                borderTopLeftRadius: "20px"
              }}>
                <h5 className="modal-title" id="successModalLabel"><i className="fas fa-check-circle me-2"></i>Message Sent</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body text-center" style={{
                backgroundColor: "var(--light-green)",
                color: "var(--primary-green)",
                fontWeight: "500",
                padding: "30px"
              }}>
                Your message has been successfully sent. <br /> We'll get back to you soon!
              </div>
              <div className="modal-footer" style={{ padding: "0px !important" }}>
                <button type="button" className="btn btn-success ok-btn" data-bs-dismiss="modal"
                  style={{
                    borderRadius: "10px",
                    backgroundColor: "var(--pastel-green)",
                    border: "2px solid var(--primary-green)",
                    color: "var(--primary-green)",
                    fontWeight: "500",
                    padding: "5px 20px !important",
                    margin: "10px"
                  }}>OK</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Compliance;
