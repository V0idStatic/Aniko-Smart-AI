import React, { useEffect, useState } from "react";
import "../CSS/home.css";
import HeaderUnlogged from "../INCLUDE/header-unlogged";
import HeaderLogged from "../INCLUDE/header-logged";
import Footer from "../INCLUDE/footer";
import TeamMembers from "./team";
import Hero from "./hero";
import Feature from "./feature";
import WhyAniko from "./whyaniko";
import WhyAnikoMobile from "../INCLUDE/whyAniko-mobile";
import TeamMobile from "../INCLUDE/team-mobile";
import StatsSlider from "../INCLUDE/statBox-mobile";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Testimonials from "./testimonial";
import ListFeatures from "../INCLUDE/mobile-features";
import BenefitsSlider from "../INCLUDE/mobile-benefits";
import Chatbox from "./Chatbox"; // adjust path as needed


import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// ✅ Type for chat messages
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // ✅ Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

 
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-wrapper" style={{ paddingTop: "80px" }}>
      {/* ✅ Switch header depending on login state */}
      {user ? <HeaderLogged /> : <HeaderUnlogged />}

      {/* HERO SECTION */}
      <section
        className="hero"
        style={{
          backgroundImage: "url('PICTURES/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container hero-container">
          <div className="row align-items-center hero-text-content">
            <div className="col-lg-8 text-center text-lg-start text-white download-col">
              <h1>Smart Soil Monitoring for Modern Farmers</h1>
              <p>
                Transform your farming with real-time soil insights,
                AI-powered plant diagnosis, and climate pattern analysis.
                Join thousands of farmers growing smarter with Aniko.
              </p>
              <a href="#download" className="hero-cta">
                <span>Download Free App</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>
            <div className="col-lg-4 text-center mt-4 mt-lg-0">
              <img
                src="PICTURES/google-play.png"
                alt="Download on Google Play"
                className="hero-img img-fluid"
              />
            </div>
          </div>
        </div>
      </section>

      <Hero />

      {/* ABOUT & STATS SECTION */}
      <div className="container my-5 text-center aboutStats-container">
        <p className="subtext" id="about">
          Aniko revolutionizes agriculture with intelligent soil monitoring
          technology. Track moisture, temperature, sunlight, and humidity in
          real-time while getting AI-powered insights for healthier crops and
          maximum yields.
        </p>
        <hr className="custom-line" />
        <h2 className="section-heading">Trusted by Farmers Worldwide</h2>
        <p className="section-subtext">
          Discover how Aniko is transforming agriculture with data-driven
          insights, from real-time monitoring to improved crop yields.
        </p>
        <div className="row stats-section mt-4">
          <div className="col-md-4 col-12 mb-4">
            <div className="stat-box">
              <img src="PICTURES/soil-monitoring-icon.png" alt="Soil Monitoring" />
              <p>24/7 Continuous Soil Health Monitoring with Real-Time Alerts</p>
            </div>
          </div>
          <div className="col-md-4 col-12 mb-4">
            <div className="stat-box">
              <img src="PICTURES/plant-treatment-icon.png" alt="Plant Treatment" />
              <p>
                AI-Powered Diagnosis for 780+ Plant Diseases with Treatment
                Recommendations
              </p>
            </div>
          </div>
          <div className="col-md-4 col-12 mb-4">
            <div className="stat-box">
              <img src="PICTURES/climate-icon.png" alt="Climate Analysis" />
              <p>
                Advanced Climate Pattern Analysis Detecting 5+ Weather Anomalies
              </p>
            </div>
          </div>
        </div>
        <div className="mobile-stats-section">
          <StatsSlider />
        </div>
      </div>

      {/* SOLUTION / BENEFITS SECTION */}
      <section
        className="farmer-section"
        id="features"
        style={{ zIndex: 1, backgroundColor: "#1D492C" }}
      >
        <div className="container-fluid">
          <h1 className="featBen-header">Precision Agriculture Made Simple</h1>
          <div className="solutionBenefits-con mt-5">
            <div className="row align-items-center solutions-row">
              <div className="col-lg-6 solution-text-side">
                <h3>ANIKO</h3>
                <p className="solText-subheader">Advanced Features for Smart Farming</p>
                <div className="row g-4 list-features-row">
                  <div className="col-6  d-flex list-features">
                    <img
                      src="PICTURES/fc1.png"
                      alt="Climate Analysis"
                      className="me-3 sol-icon"
                      style={{ width: "45px", height: "45px" }}
                    />
                    <p className="mb-0">Climate Pattern Analysis</p>
                  </div>
                  <div className="col-6 d-flex list-features">
                    <img
                      src="PICTURES/fc2.png"
                      alt="Plant Diagnosis"
                      className="me-3 sol-icon"
                      style={{ width: "45px", height: "45px" }}
                    />
                    <p className="mb-0">AI-Powered Plant Diagnosis</p>
                  </div>
                  <div className="col-6  d-flex list-features">
                    <img
                      src="PICTURES/fc3.png"
                      alt="Soil Health"
                      className="me-3 sol-icon"
                      style={{ width: "45px", height: "45px" }}
                    />
                    <p className="mb-0">Real-Time Soil Monitoring</p>
                  </div>
                  <div className="col-6 d-flex list-features">
                    <img
                      src="PICTURES/fc4.png"
                      alt="Health Check"
                      className="me-3 sol-icon"
                      style={{ width: "45px", height: "45px" }}
                    />
                    <p className="mb-0">Intelligent Health Analytics</p>
                  </div>
                </div>
                <div className="mobile-list-features">
                  <ListFeatures />
                </div>
              </div>
              <Feature />
            </div>
            <hr className="custom-line" />
            <div className="row mb-4 benefits-row">
              <div className="col-lg-10 solution-text-side">
                <h3 className="benHeader">ANIKO</h3>
                <p className="benSubheader">Proven Benefits for Your Farm</p>
                <div className="row g-4 desktop-benefit-cards">
                  <div className="col-md-4 col-12">
                    <div className="benefit-card">
                      <h5>Monitor & Protect</h5>
                      <img src="PICTURES/benefits-icon1.png" alt="24/7 Monitoring" />
                      <p>
                        Continuous field monitoring with instant alerts for
                        optimal crop protection and growth management.
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="benefit-card">
                      <h5>Predict & Prevent</h5>
                      <img src="PICTURES/benefits-icon2.png" alt="Climate Prediction" />
                      <p>
                        Advanced climate anomaly prediction helps you prepare
                        and protect your crops from weather threats.
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4 col-12">
                    <div className="benefit-card last-ben-card">
                      <h5>Optimize & Grow</h5>
                      <img src="PICTURES/benefits-icon3.png" alt="AI Features" />
                      <p>
                        AI-powered insights and recommendations to maximize
                        yield and optimize resource usage efficiently.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mobile-benefit-cards">
                  <BenefitsSlider />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL SECTION */}
      <Testimonials />

      {/* WHY ANIKO SECTION */}
      <section id="why-aniko" className="py-5 whyAniko-section">
        <div className="container whyAniko-container">
          <div className="row align-items-center whyAniko-row">
            <div className="col-lg-6 mb-4 mb-lg-0 whyAniko-text-section">
              <h2 className="fw-bold text-dark mb-3">Why Aniko?</h2>
              <p className="lead text-muted">
                We help farmers and agribusinesses save the world by improving
                production efficiency, innovating cultivation techniques, and
                optimizing resource use through market data analysis. Aniko is
                the right solution for more sustainable and advanced
                agriculture.
              </p>
            </div>
            <WhyAniko />
          </div>

          {/* Cards */}
          <div className="row mt-5 g-4 text-center whyAniko-card-parent">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <img
                    src="/PICTURES/why-icon.png"
                    alt="Icon 1"
                    className="mb-3"
                    width="60"
                  />
                  <p className="mb-0 text-muted">
                    The only real-time solution for managing soil and plant
                    health
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <img
                    src="/PICTURES/why-icon.png"
                    alt="Icon 2"
                    className="mb-3"
                    width="60"
                  />
                  <p className="mb-0 text-muted">
                    Over 40% of crop loss are caused by extreme weather
                    conditions
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="last-card">
                <div className="card-body">
                  <img
                    src="/PICTURES/why-icon.png"
                    alt="Icon 3"
                    className="mb-3 last-whyIcon"
                    width="60"
                    style={{ marginTop: "13px" }}
                  />
                  <p className="mb-0 text-muted">
                    Over 40% of crop loss stem from poor plant disease
                    diagnosis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-whyAniko-card-parent">
            <WhyAnikoMobile />
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="team-section position-relative" id="team">
        <div className="container-fluid p-0">
          <img
            src="PICTURES/team-image.png"
            alt="Our Team"
            className="img-fluid team-img w-100"
          />
          <div className="team-overlay text-center text-white">
            <h3 className="fw-bold">Meet the Team</h3>
            <p className="lead">
              We are five 3rd-year IT students who share a passion for
              technology and innovation, each bringing unique skills and
              perspectives to create impactful, real-world solutions together.
            </p>
          </div>
        </div>

        <div className="mobile-team-text">
            <h3 className="fw-bold">Meet the Team</h3>
            <p className="lead">
              We are five 3rd-year IT students who share a passion for
              technology and innovation, each bringing unique skills and
              perspectives to create impactful, real-world solutions together.
            </p>
        </div>
      </section>

      <div className="desktop-team-section">
        <TeamMembers />
      </div>

      <div className="team-mobile-section">
        <TeamMobile />
      </div>
     {/* ✅ Floating Circle Button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
        }}
        onClick={() => setShowChat(true)}
      >
        <img
          src="PICTURES/Logo-noText.png"
          alt="Chat"
          style={{ width: "40px", height: "40px", objectFit: "contain" }}
        />
      </div>

      {/* ✅ Bootstrap Modal */}
      {showChat && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              {/* Modal Header */}
              <div className="modal-header">
                <h5 className="modal-title">Aniko Chatbot</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChat(false)}
                ></button>
              </div>

              {/* Modal Body (Your Chatbox Component) */}
              <div className="modal-body">
               
                <Chatbox />
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

     

  
    </div>
  );
};

export default Home;
