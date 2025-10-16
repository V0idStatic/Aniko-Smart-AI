import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../CSS/compliance.css";
import "bootstrap/dist/css/bootstrap.min.css";
import HeaderLogged from "../INCLUDE/header-logged";
import HeaderUnlogged from "../INCLUDE/header-unlogged";
import Footer from "../INCLUDE/footer";
import supabase from "../CONFIG/supabaseClient";
import Modal from "bootstrap/js/dist/modal";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Compliance: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    newsletter: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // ✅ Use Supabase auth instead of Firebase
  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ Autofill email + name if user logged in
  useEffect(() => {
    if (user) {
      const fullName = user.user_metadata?.full_name || "";
      const nameParts = fullName.split(" ");
      
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : prev.lastName,
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          newsletter: formData.newsletter ? 1 : 0,
          submitted_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("❌ Error inserting message:", error);
        setModalMessage("❌ Failed to send message. Please try again.");
      } else {
        setModalMessage("✅ Your message has been successfully sent!");
        
        // Reset form but keep user info if logged in
        const fullName = user?.user_metadata?.full_name || "";
        const nameParts = fullName.split(" ");
        
        setFormData({
          firstName: nameParts[0] || "",
          lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
          email: user?.email || "",
          phone: "",
          subject: "",
          message: "",
          newsletter: false,
        });
      }

      // ✅ Trigger Bootstrap modal
      const modalEl = document.getElementById("successModal");
      if (modalEl) {
        const modal = new Modal(modalEl);
        modal.show();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* ✅ Conditionally render header based on Supabase auth state */}
      {user ? <HeaderLogged /> : <HeaderUnlogged />}

      <div className="main-content">
        <section className="contact-section">
          <div className="contact-wrapper">
            {/* mobile contact info */}
            <div className="mobile-contact-info">
              <h3>Get In Touch</h3>
              <p className="mobile-conSubtext">Need help or have an issue? Our team's ready to assist.</p>
              <div className="mobile-contact-item-row row">
                <div className="col-12 col-md-6">
                  <div className="mobile-contact-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    <div className="contact-item-content">Olongapo City, Zambales, Philippines</div>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="bi bi-phone"></i>
                    <div className="contact-item-content">0912-123-1234</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="mobile-contact-item">
                    <i className="bi bi-envelope"></i>
                    <div className="contact-item-content">anikosmartcropsystem@gmail.com</div>
                  </div>
                  <div className="mobile-contact-item">
                    <i className="bi bi-clock"></i>
                    <div className="contact-item-content">9:00 AM - 10:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
              
            {/* Contact Info */}
            <div className="contact-info-section">
              <h3>Get In Touch</h3>
              <div className="contact-item">
                <i className="bi bi-geo-alt-fill"></i>
                <div className="contact-item-content">Olongapo City, Zambales, Philippines</div>
              </div>
              <div className="contact-item">
                <i className="bi bi-phone"></i>
                <div className="contact-item-content">0912-123-1234</div>
              </div>
              <div className="contact-item">
                <i className="bi bi-envelope"></i>
                <div className="contact-item-content">anikosmartcropsystem@gmail.com</div>
              </div>
              <div className="contact-item">
                <i className="bi bi-clock"></i>
                <div className="contact-item-content">9:00 AM - 10:00 PM</div>
              </div>
              <div className="social-links">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-twitter"></i></a>
                <a href="#"><i className="bi bi-instagram"></i></a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        required
                        readOnly={!!user && !!user.user_metadata?.full_name}
                      />
                      <label htmlFor="firstName">First Name</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        required
                        readOnly={!!user && !!user.user_metadata?.full_name}
                      />
                      <label htmlFor="lastName">Last Name</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        required
                        readOnly={!!user}
                      />
                      <label htmlFor="email">Email Address</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-floating">
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number"
                      />
                      <label htmlFor="phone">Phone Number</label>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <select
                    className="form-select"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales Question</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-floating mb-4">
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message"
                    style={{ height: "120px" }}
                    required
                  ></textarea>
                  <label htmlFor="message">Tell us how we can help you...</label>
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newsletter"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="newsletter">
                      I'd like to receive updates and news
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-submit w-100"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
            <div className="mobile-social-links">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-twitter"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
            </div>
          </div>
        </section>
        
        <div
          className="modal fade compModal"
          id="successModal"
          tabIndex={-1}
          aria-labelledby="successModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered comp-modDialog">
            <div className="modal-content success-modal comp-modContent">
              <div className="modal-header success-modal-header comp-modHeader">
                <h5 className="modal-title" id="successModalLabel comp-modTitle">
                  <i className="bi bi-check-circle me-2"></i>Message Status
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center success-modal-body comp-modBody">
                {modalMessage}
              </div>
              <div className="modal-footer comp-modFooter">
                <button
                  type="button"
                  className="btn btn-success comp-modOkBtn"
                  data-bs-dismiss="modal"
                >
                  OK
                </button>
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