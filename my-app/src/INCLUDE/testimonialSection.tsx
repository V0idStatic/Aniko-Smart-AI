import "../CSS/testimonialSection.css";
import { Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import 'bootstrap/dist/css/bootstrap.min.css';

const TestimonialSection: React.FC = () => {
  return (
    <section className="testimonial-section py-5">
        <div className="container testimonial-container">
            <div className="row align-items-center mb-4">
                <div className="col">
                <h3 className="fw-bold text-dark" id="download">
                    What Our Farmers Say
                </h3>
                <p className="text-muted mb-0 testimonial-subheader">
                    Real experiences from real farmers who are growing smarter with Aniko.
                </p>
                </div>
            </div>

            <div className="row testimonial-card-row">
                <div className="card testimonial-card">
                    <div className="card-body terst-card-body">
                        <h5 className="mb-0 testimonial-name">Jane Doe</h5>
                        <p className="mb-0 testimonial-email">janeDoe@exmaple.com</p>
                        <p className="card-text testimonial-text">
                            "Aniko has transformed the way I manage my farm. The precision and insights provided have led to a significant increase in my crop yields."
                        </p>
                        <div className="d-flex align-items-center mt-4">
                            <img src="https://via.placeholder.com/50" alt="Farmer Jane" className="rounded-circle me-3 testimonial-avatar" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default TestimonialSection;
