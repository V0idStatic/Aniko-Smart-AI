import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import '../CSS/testimonialSubmit.css';
import Header from "../INCLUDE/header-logged";
import Footer from "../INCLUDE/footer";

const TestimonialSubmit: React.FC = () => {
  return (
    <div style={{ paddingTop: "80px" }}>
      <Header />
        <div className="testimonial-card">
          <div className="row g-0">
            <div className="col-lg-5 d-flex flex-column justify-content-center">
              <div className="content-section">
                <h2>Share Your Experience</h2>
                <p className="subtitle">
                  Your feedback is valuable! Tell us how Aniko has helped improve your farming practices and let others learn from your experience.
                </p>

                <ul className="feature-list">
                  <li><i className="bi bi-check-circle-fill"></i>Help other farmers learn from your success</li>
                  <li><i className="bi bi-people-fill"></i> Build a stronger farming community</li>
                  <li><i className="bi bi-star-fill"></i> Share your authentic experience</li>
                  <li><i className="bi bi-heart-fill"></i>Inspire others to grow better</li>
                </ul>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="form-section">
                <form action="save_testimonial.php" method="POST" id="testimonialForm">
                  <label className="form-label" htmlFor="testimonial">
                    <i className="fas fa-quote-left"></i> Your Testimonial
                  </label>
                  <textarea
                    name="testimonial"
                    id="testimonial"
                    rows={7}
                    placeholder="Share your story... How has Aniko transformed your farming experience? What specific benefits have you seen?"
                    required
                    maxLength={1000}
                  />
                  <div className="character-count" id="charCount">
                    0 / 1000 characters
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button type="submit" className="submit-btn" id="submitBtn">
                     <i className="bi bi-send"></i>
                      Submit Testimonial
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
     

      {/* Confirmation Modal */}
      <div
        className="modal fade submit-modal"
        id="confirmModal"
        tabIndex={-1}
        aria-labelledby="confirmModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered submit-mod-dialog">
          <div className="modal-content text-center submit-mod-content">
            <div className="modal-header submit-mod-header">
              <h5 className="modal-title submit-mod-title" id="confirmModalLabel">
                <i className="fas fa-exclamation-triangle me-2"></i> Confirm Submission
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
            <div className="modal-footer justify-content-center">
              <button
                type="button"
                className="btn btn-secondary cancel-btn"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success confirm-btn"
                id="confirmSubmit"
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
