import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../CSS/testimonialSubmit.css";
import HeaderLogged from "../INCLUDE/header-logged";
import HeaderUnlogged from "../INCLUDE/header-unlogged";
import Footer from "../INCLUDE/footer";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import supabase from "../CONFIG/supabaseClient";
import Modal from "bootstrap/js/dist/modal";

const TestimonialSubmit: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [testimonialText, setTestimonialText] = useState("");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      alert("⚠️ You must be logged in to submit a testimonial.");
      return;
    }

    try {
      const { error } = await supabase.from("testimonials").insert([
        {
          user_id: user.uid,
          testimonial: testimonialText,
          status: "pending",
        },
      ]);

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      alert("✅ Testimonial submitted successfully!");
      setTestimonialText("");

      const modalEl = document.getElementById("confirmModal");
      if (modalEl) {
        const modalInstance = Modal.getInstance(modalEl);
        modalInstance?.hide();
      }
    } catch (err: any) {
      console.error("❌ Submission failed:", err.message);
      alert("❌ Failed to submit testimonial: " + err.message);
    }
  };

  return (
    <div className="testimonialCol-container">
      {/* ✅ Conditional Header */}
      {user ? <HeaderLogged /> : <HeaderUnlogged />}

      <div className="row testimonialCol-row align-items-stretch g-0">
        {/* Left CTA Section */}
        <div className="col-6 testDisplay-col">
          <div className="card testDisplay-cta-card">
            <div className="testDisplay-ctaHeader-wrapper">
              <img src="PICTURES/Logo-noText.png" alt="Aniko Logo" className="testDisplay-headerLogo" />
              <h2 className="testDisplay-ctaHeader">Trusted by Our Community</h2>
            </div>
            <h6 className="testDisplay-ctaSubheader">
              Discover how we've helped farmers achieve better harvests and smarter decisions.
            </h6>

            <ul className="feature-list">
              <li>
                <i className="bi bi-check-circle-fill"></i> Help other farmers
                learn from your success
              </li>
              <li>
                <i className="bi bi-people-fill"></i> Build a stronger farming
                community
              </li>
              <li>
                <i className="bi bi-star-fill"></i> Share your authentic
                experience
              </li>
              <li>
                <i className="bi bi-heart-fill"></i> Inspire others to grow
                better
              </li>
            </ul>
            <button className="testDisplay-ctaBtn">
              <Link to="/testimonialDisplay">View Testimonials</Link>
            </button>
          </div>
        </div>

        {/* Right Testimonial Submit Section */}
        <div className="col-6 testSubmit-col">
          <h2>Share Your Experience</h2>
          <p className="subtitle">
            Your feedback is valuable! Tell us how Aniko has helped improve
            your farming practices and let others learn from your experience.
          </p>

          <div className="form-section">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const modalEl = document.getElementById("confirmModal");
                if (modalEl) {
                  const confirmModal = new Modal(modalEl);
                  confirmModal.show();
                }
              }}
            >
              <label className="form-label" htmlFor="testimonial">
                <i className="bi bi-chat-dots"></i> Your Testimonial
              </label>
              <textarea
                name="testimonial"
                id="testimonial"
                rows={7}
                value={testimonialText}
                onChange={(e) => {
                  setTestimonialText(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                placeholder="Share your story... How has Aniko transformed your farming experience? What specific benefits have you seen?"
                required
                maxLength={1000}
              />
              <div className="character-count" id="charCount">
                {charCount} / 1000 characters
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="submit-btn d-flex align-items-center justify-content-center"
                  id="submitBtn"
                >
                  <i className="bi bi-send me-2"></i>
                  <span>Submit Testimonial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <div
        className="modal fade submit-modal testSub-modal"
        id="confirmModal"
        tabIndex={-1}
        aria-labelledby="confirmModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered submit-mod-dialog">
          <div className="modal-content text-center submit-mod-content">
            <div className="modal-header submit-mod-header">
              <h5 className="modal-title submit-mod-title" id="confirmModalLabel">
                <i className="bi bi-exclamation-triangle me-2"></i> Confirm Submission
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              Are you sure you want to submit your testimonial?
              <br />
              Once submitted, it will be reviewed by the admin before approval.
            </div>
            <div className="modal-footer justify-content-center testSub-modalFooter">
              <button
                type="button"
                className="btn btn-secondary testSub-modalFooter-cancelBtn"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success testSub-modalFooter-confirmBtn"
                id="confirmSubmit"
                onClick={handleSubmit}
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TestimonialSubmit;
