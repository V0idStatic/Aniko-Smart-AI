import React, { useEffect, useState } from "react"
import HeaderLogged from "../INCLUDE/header-logged"
import HeaderUnlogged from "../INCLUDE/header-unlogged"
import Footer from "../INCLUDE/footer"
import supabase from "../CONFIG/supabaseClient"
import "../CSS/how-to-use.css"

const HowToUse: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkAuthStatus()
    window.scrollTo(0, 0)
  }, [])

  const checkAuthStatus = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  const modules = [
    {
      id: 1,
      title: "Dashboard",
      icon: "bi-speedometer2",
      description:
        "Your central hub for monitoring your farm's health. View real-time weather data, crop conditions, and get instant notifications about your plants.",
      features: [
        "Real-time weather monitoring",
        "Crop health overview",
        "Quick access to all modules",
        "Personalized farm insights",
      ],
      image: "/PICTURES/dashboard.png",
    },
    {
      id: 2,
      title: "Plant Dashboard",
      icon: "bi-flower3",
      description:
        "Track individual plants and crops with detailed monitoring. Get specific recommendations for each plant type and monitor their growth stages.",
      features: [
        "Individual plant tracking",
        "Growth stage monitoring",
        "Plant-specific care tips",
        "Historical growth data",
      ],
      image: "/PICTURES/plantDashboard.png",
    },
    {
      id: 3,
      title: "Sensor Integration",
      icon: "bi-broadcast",
      description:
        "Connect IoT sensors to monitor soil moisture, temperature, humidity, and other critical environmental factors in real-time.",
      features: [
        "Real-time sensor data",
        "Multi-sensor support",
        "Automated alerts",
        "Data visualization graphs",
      ],
      image: "/PICTURES/sensor.png",
    },
    {
      id: 4,
      title: "Disease Diagnosis",
      icon: "bi-shield-check",
      description:
        "Use AI-powered image recognition to identify plant diseases instantly. Take a photo of affected leaves and get immediate diagnosis with treatment recommendations.",
      features: [
        "AI-powered disease detection",
        "Instant photo analysis",
        "Treatment recommendations",
        "Disease prevention tips",
      ],
      image: "/PICTURES/diagnosis.png",
    },
    {
      id: 5,
      title: "Data Analysis",
      icon: "bi-graph-up",
      description:
        "Analyze your farm's performance with comprehensive reports, charts, and trends. Make data-driven decisions to improve yield and efficiency.",
      features: [
        "Performance analytics",
        "Trend visualization",
        "Export reports",
        "Predictive insights",
      ],
      image: "/PICTURES/analysis.png",
    },
    {
      id: 6,
      title: "AI Chatbot Assistant",
      icon: "bi-chat-dots",
      description:
        "Get instant farming advice 24/7 from our AI assistant. Ask questions about crop care, pest control, fertilization, and more.",
      features: [
        "24/7 availability",
        "Expert farming knowledge",
        "Personalized recommendations",
        "Multi-language support",
      ],
      image: "/PICTURES/chatbot.png",
    },
  ]

  return (
    <div className="how-to-use-page">
      {isLoggedIn ? <HeaderLogged /> : <HeaderUnlogged />}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
            
              How to Use Aniko Smart AI
            </h1>
            <p className="hero-subtitle">
              A comprehensive guide to mastering every feature of our smart farming mobile application
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="intro-section">
        <div className="container">
          <div className="intro-card">
            <h2>
              <i className="bi bi-lightbulb me-2"></i>
              Getting Started
            </h2>
            <p>
              Aniko Smart AI is designed to make farming smarter, easier, and more efficient. Our mobile
              application combines cutting-edge AI technology with practical farming tools to help you monitor,
              analyze, and optimize your farm's performance.
            </p>
            <div className="quick-steps">
              <div className="step">
                <div className="step-number">1</div>
                <p>Download the app from App Store or Google Play</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <p>Create your account and set up your farm profile</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <p>Start exploring the modules below</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorial Section - Hero Style */}
      <section className="video-hero-section">
        <div className="video-hero-container">
          {/* Video Side - Left */}
          <div className="video-hero-left">
            <div className="video-container">
              <video 
                controls 
                autoPlay
                muted
                loop
                playsInline
                poster="/PICTURES/dashboard.png"
                className="demo-video"
                key="/PICTURES/aniko_demo.mov"
              >
                <source src="/PICTURES/aniko_demo.mov" type="video/mp4" />
                <source src="/PICTURES/aniko_demo.mov" type="video/quicktime" />
              </video>
            </div>
          </div>

          {/* Content Side - Right */}
          <div className="video-hero-right">
            <div className="video-hero-content">
          
              <h2 className="video-hero-title">
                Watch Our Quick Tutorial
              </h2>
              <p className="video-hero-description">
                See Aniko Smart AI in action with this comprehensive walkthrough of all features. 
                Learn how to maximize your farming efficiency with our mobile app in just 5 minutes.
              </p>

              <div className="video-features-list">
                <div className="video-feature-item">
                  <i className="bi bi-clock-fill"></i>
                  <div>
                    <h4>Quick & Concise</h4>
                    <p>5-minute comprehensive tutorial</p>
                  </div>
                </div>
                <div className="video-feature-item">
                  <i className="bi bi-camera-video-fill"></i>
                  <div>
                    <h4>Full Walkthrough</h4>
                    <p>Complete app feature demonstration</p>
                  </div>
                </div>
                <div className="video-feature-item">
                  <i className="bi bi-hand-thumbs-up-fill"></i>
                  <div>
                    <h4>Easy to Follow</h4>
                    <p>Step-by-step guidance for beginners</p>
                  </div>
                </div>
              </div>

              <div className="video-cta-buttons">
                <a 
                  href="/PICTURES/aniko_demo.mov" 
                  download
                  className="download-video-btn"
                >
                  <i className="bi bi-download"></i>
                  <span>Download Video</span>
                </a>
                <button className="watch-again-btn" onClick={() => {
                  const video = document.querySelector('.demo-video') as HTMLVideoElement;
                  if (video) {
                    video.currentTime = 0;
                    video.play();
                  }
                }}>
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Watch Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section - Alternating Hero Sections */}
      <section className="modules-section">
        <div className="section-header">
          <h2 className="section-title">App Modules & Features</h2>
          <p className="section-subtitle">
            Explore each module to unlock the full potential of smart farming
          </p>
        </div>

        {modules.map((module, index) => (
          <div
            key={module.id}
            className={`module-hero ${index % 2 === 0 ? 'module-hero-left' : 'module-hero-right'}`}
            data-aos="fade-up"
          >
            <div className="module-hero-container">
              {/* Content Side */}
              <div className="module-hero-content">
                <div className="module-hero-icon">
                  <i className={`bi ${module.icon}`}></i>
                </div>
                <h3 className="module-hero-title">{module.title}</h3>
                <p className="module-hero-description">{module.description}</p>
                
                <div className="module-hero-features">
                  <h4 className="features-heading">
                    <i className="bi bi-star-fill me-2"></i>
                    Key Features
                  </h4>
                  <ul className="features-list">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="feature-item">
                        <i className="bi bi-check-circle-fill"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Image Side */}
              <div className="module-hero-image">
                <div className="image-wrapper">
                  <img 
                    src={module.image} 
                    alt={`${module.title} Screenshot`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="module-image-placeholder" style={{ display: 'none' }}>
                    <i className={`bi ${module.icon} placeholder-icon`}></i>
                    <p className="placeholder-text">Screenshot Coming Soon</p>
                  </div>
                  <div className="image-badge">
                    <span className="badge-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Tips Section */}
      <section className="tips-section">
        <div className="container">
          <h2 className="section-title text-center">
         
            Pro Tips for Maximum Efficiency
          </h2>
          <div className="tips-grid">
            <div className="tip-card">
              <i className="bi bi-bell"></i>
              <h4>Enable Notifications</h4>
              <p>Stay updated with real-time alerts about weather changes, sensor readings, and plant health issues.</p>
            </div>
            <div className="tip-card">
              <i className="bi bi-camera"></i>
              <h4>Regular Photos</h4>
              <p>Take photos of your plants regularly to track growth and catch diseases early with AI diagnosis.</p>
            </div>
            <div className="tip-card">
              <i className="bi bi-graph-up-arrow"></i>
              <h4>Review Analytics</h4>
              <p>Check your data analysis weekly to identify trends and make informed farming decisions.</p>
            </div>
            <div className="tip-card">
              <i className="bi bi-chat-square-text"></i>
              <h4>Use the Chatbot</h4>
              <p>Don't hesitate to ask our AI assistant for advice - it's trained on extensive farming knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section">
        <div className="container">
          <div className="support-card">
            <h2>
              <i className="bi bi-question-circle me-2"></i>
              Need More Help?
            </h2>
            <p>
              Our support team is here to assist you with any questions or issues you may encounter.
            </p>
            <div className="support-options">
              <a href="/compliance" className="support-btn">
                <i className="bi bi-envelope"></i>
                Contact Support
              </a>
              <a href="/testimonialDisplay" className="support-btn outline">
                <i className="bi bi-chat-quote"></i>
                User Stories
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HowToUse
