import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import '../CSS/home.css';
import Header from "../INCLUDE/header-logged";
import Footer from "../INCLUDE/footer";



type ImageBlock = { image_path: string };
type Testimonial = {
  testimonial: string;
  created_at: string;
  name: string;
  email: string;
  picture?: string | null;
};
type TeamMember = {
  image_path: string;
  name: string;
  role: string;
};

const palette = {
  c1: "#CBBA9E",
  c4: "#4D2D18",
  c5: "#112822",
  c7: "#FFFFFF",
  c8: "#000000",
  c9: "#1D492C",
};

const gravatar = (email: string, size = 80) =>
  `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=mp&s=${size}`;

function md5(str: string) {
  return "00000000000000000000000000000000";
}

const Home: React.FC = () => {
  const [homeImage, setHomeImage] = useState<string>("");
  const [benefitsImage, setBenefitsImage] = useState<string>("");
  const [downloadImage, setDownloadImage] = useState<string>("");
  const [whyAnikoImage, setWhyAnikoImage] = useState<string>("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const r1 = await fetch("/api/home_images/latest");
        if (r1.ok) {
          const d1 = (await r1.json()) as ImageBlock;
          setHomeImage(d1?.image_path ?? "");
        }

        const r2 = await fetch("/api/benefits_images/latest");
        if (r2.ok) {
          const d2 = (await r2.json()) as ImageBlock;
          setBenefitsImage(d2?.image_path ?? "");
        }

        const r3 = await fetch("/api/testimonials?status=approved");
        if (r3.ok) {
          const d3 = (await r3.json()) as Testimonial[];
          setTestimonials(Array.isArray(d3) ? d3 : []);
        }

        const r4 = await fetch("/api/download_images/latest");
        if (r4.ok) {
          const d4 = (await r4.json()) as ImageBlock;
          setDownloadImage(d4?.image_path ?? "");
        }

        const r5 = await fetch("/api/why_aniko_images/latest");
        if (r5.ok) {
          const d5 = (await r5.json()) as ImageBlock;
          setWhyAnikoImage(d5?.image_path ?? "");
        }

        const r6 = await fetch("/api/team_members");
        if (r6.ok) {
          const d6 = (await r6.json()) as TeamMember[];
          setTeam(Array.isArray(d6) ? d6 : []);
        }
      } catch (e) {
        console.error("Load home page data failed:", e);
      }
    }
    load();
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let direction = 1;
    const speed = 1;
    const tick = () => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft += speed * direction;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth) direction = -1;
      if (el.scrollLeft <= 0) direction = 1;
    };
    const id = window.setInterval(tick, 20);
    return () => window.clearInterval(id);
  }, [testimonials.length]);

  const renderAvatar = (t: Testimonial) => {
    const src = t.picture && t.picture.trim() ? t.picture : gravatar(t.email, 80);
    return (
      <img
        src={src}
        className="rounded-circle me-3"
        width={50}
        height={50}
        alt="Profile"
        style={{ objectFit: "cover" }}
      />
    );
  };

  const numbers = useMemo(
    () => [
      { icon: "/PICTURES/home-icon1.png", text: "Continuous Soil Health Monitoring" },
      { icon: "/PICTURES/home-icon2.png", text: "Find the right treatment for more than 780 plant diseases" },
      { icon: "/PICTURES/home-icon3.png", text: "Detects over 5 climate anomalies." },
    ],
    []
  );

  return (
    <div style={{ background: palette.c1, width: "100%", minHeight: "100vh", paddingTop: "80px" }}>
      <Header />
      
      {/* HERO - Full Width */}
<section style={{ padding: "40px 15px", width: "100%" }}>
  <div className="row align-items-center" style={{ maxWidth: "85%", margin: "0 auto" }}>
    {/* Text Section */}
    <div className="col-lg-7 text-center text-lg-start">
      <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: palette.c4 }}>
        Free app for soil health monitoring
      </h1>
      {/* Adjusting padding to match the text alignment */}
      <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", marginTop: 15, color: palette.c8, paddingLeft: "5px" }}>
        The all-in-one app that gives you real-time soil insights for healthier crops and bigger harvests. Download now and grow smarter!
      </p>
    </div>

    {/* Google Play Image Section */}
    <div className="col-lg-5 text-center mt-4 mt-lg-0">
      <img
        src="/PICTURES/google-play.png"
        alt="Download on Google Play"
        className="hero-img img-fluid"
        style={{
          maxWidth: 250,
          margin: "0 auto",  // Ensuring the image is centered
          display: "block",  // Ensuring the image behaves like a block element
        }}
      />
    </div>
  </div>
</section>




      {/* Home Image - Full Width */}
      <div className="home-img-container" style={{ textAlign: "center", marginTop: -80, width: "100%" }}>
        <img src="/PICTURES/home-image.png" alt="Home Image" className="img-fluid" style={{ maxWidth: '1000px', width: '100%' }} />
      </div>

      {/* Subtext - Full Width Container */}
      <div style={{ width: "100%", padding: "0 20px" }}>
        <p
          className="subtext"
          id="about"
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: "1rem",
            color: palette.c8,
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Aniko is a smart soil monitoring app that helps you track moisture, temperature, sunlight, and humidity in real
          time. Designed for farmers and growers, it empowers you to make better decisions for healthier crops and higher
          yields.
        </p>
      </div>

      {/* Divider - Full Width */}
      <hr
        className="custom-line"
        style={{
          width: "90%",
          height: 3,
          background: palette.c5,
          margin: "20px auto",
          border: "none",
          borderRadius: 2,
        }}
      />

      {/* Numbers Section - Full Width */}
      <section style={{ width: "100%", padding: "0 20px" }}>
        <h2
          className="section-heading"
          style={{
            textAlign: "center",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 700,
            color: palette.c4,
            marginTop: 40,
          }}
        >
          Aniko in numbers
        </h2>
        <p
          className="section-subtext"
          style={{
            textAlign: "center",
            fontSize: "1rem",
            color: palette.c8,
            maxWidth: 900,
            margin: "15px auto 40px",
            lineHeight: 1.6,
          }}
        >
          Discover how Aniko is transforming agriculture from real-time insights to improved crop yields — the numbers
          speak for themselves.
        </p>

        <div className="row stats-section" style={{ marginTop: 40, maxWidth: "1400px", margin: "40px auto 0" }}>
          {numbers.map((n, idx) => (
            <div key={idx} className="col-md-4 col-12 mb-4">
              <div className="stat-box" style={{ textAlign: "center", padding: 20 }}>
                <img src={n.icon} alt={`Icon ${idx + 1}`} style={{ width: 70, height: 70, objectFit: "contain" }} />
                <p style={{ fontSize: ".95rem", color: palette.c8, margin: "10px auto 0", lineHeight: 1.4, maxWidth: 250 }}>
                  {n.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Farmers Section - Full Width */}
      <section className="farmer-section" id="features" style={{ background: palette.c9, padding: "60px 20px", textAlign: "center", width: "100%" }}>
        <h2 style={{ color: palette.c7, fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 700, margin: 0 }}>
          A solution designed for farmers
        </h2>

        <div style={{ maxWidth: "1400px", margin: "0 auto", marginTop: "3rem" }}>
          <div className="row align-items-center">
            <div className="col-lg-6 text-start">
              <h3 className="text-white fw-bold">Aniko</h3>
              <p className="text-light mb-4">Features</p>

              <div className="row g-4">
                {["Climate Pattern Analysis", "AI-Powered Plant Diagnosis", "Soil Health Monitoring", "AI-Powered Soil Health Check"].map(
                  (txt, i) => (
                    <div key={i} className="col-6 d-flex align-items-center">
                      <img
                        src={`/PICTURES/feature-icon${i + 1}.png`}
                        alt={`Feature ${i + 1}`}
                        className="me-3"
                        style={{ width: 45, height: 45 }}
                      />
                      <p className="text-white mb-0">{txt}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="col-lg-6 text-center mt-4 mt-lg-0">
              <img src="/PICTURES/feature-phone.png" alt="Aniko App" className="img-fluid" style={{ maxWidth: 380, borderRadius: 20 }} />
            </div>
          </div>
        </div>

        <hr
          className="custom-line"
          style={{
            width: "90%",
            height: 3,
            background: palette.c5,
            margin: "20px auto",
            border: "none",
            borderRadius: 2,
          }}
        />

        {/* Benefits Cards - Full Width */}
        <div style={{ maxWidth: "1400px", margin: "0 auto", marginTop: "3rem" }}>
          <div className="row mb-4">
            <div className="col text-start">
              <h3 className="text-white fw-bold">Aniko</h3>
              <p className="text-light">Benefits</p>
            </div>
          </div>

          <div className="row g-4">
            {[
              { title: "Monitors", icon: "/PICTURES/benefits-icon1.png", text: "Monitor the field status 24/7" },
              { title: "Save Resources", icon: "/PICTURES/benefits-icon2.png", text: "Predict Climate Anomalies" },
              { title: "Stay Ahead", icon: "/PICTURES/benefits-icon3.png", text: "AI-Powered Application Features" },
            ].map((b, i) => (
              <div key={i} className="col-md-4 col-12">
                <div
                  className="benefit-card"
                  style={{
                    background: palette.c7,
                    borderRadius: 20,
                    padding: "25px 20px",
                    textAlign: "center",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    height: "100%",
                    transition: "transform .2s",
                  }}
                >
                  <h5 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 15, color: palette.c9 }}>{b.title}</h5>
                  <img src={b.icon} alt={`Benefit ${i + 1}`} style={{ width: 50, height: 50, marginBottom: 15 }} />
                  <p style={{ fontSize: ".95rem", color: palette.c9, margin: 0 }}>{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Full Width */}
      <section className="testimonial-section py-5" style={{ background: palette.c1, width: "100%" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}>
          <div className="row align-items-center mb-4">
            <div className="col-lg-8">
              <h2 className="fw-bold" style={{ color: palette.c4 }} id="download">
                What Our Farmers Say
              </h2>
              <p className="text-muted mb-0">Real experiences from real farmers who are growing smarter with Aniko.</p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <Link to="/login" className="btn btn-primary">
                Submit Now!
              </Link>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="testimonial-scroll d-flex gap-3"
            style={{
              display: "flex",
              overflowX: "auto",
              scrollBehavior: "smooth",
              paddingBottom: 10,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>
              {`.testimonial-scroll::-webkit-scrollbar { display: none; }`}
            </style>

            {testimonials.length ? (
              testimonials.map((t, i) => (
                <div key={i} className="testimonial-card card shadow-sm flex-shrink-0" style={{ minWidth: 280, flex: "0 0 calc(33.333% - 1rem)" }}>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      {renderAvatar(t)}
                      <div>
                        <h6 className="mb-0">{t.name}</h6>
                        <small className="text-muted">{t.email}</small>
                      </div>
                    </div>
                    <p className="card-text">{t.testimonial}</p>
                  </div>
                  <div className="card-footer text-muted">
                    <small>
                      Posted on{" "}
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No approved testimonials yet.</p>
            )}
          </div>

          {downloadImage && (
            <div className="text-center mt-5">
              <img src={downloadImage} alt="Download Now" className="img-fluid" style={{ maxWidth: 1000 }} />
            </div>
          )}
        </div>
      </section>

      {/* Why Aniko - Full Width */}
      <section id="why-aniko" className="why-aniko" style={{ backgroundColor: palette.c9, padding: "80px 20px", width: "100%" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="row align-items-center">
            <div className="col-lg-6 text-white mb-4 mb-lg-0">
              <h2 className="fw-bold mb-3">Why Aniko?</h2>
              <p className="lead">
                We help farmers and agribusinesses save the world by improving production efficiency, innovating
                cultivation techniques, and optimizing resource use through market data analysis. Aniko is the right
                solution for more sustainable and advanced agriculture.
              </p>
            </div>
            <div className="col-lg-6 text-center">
              {whyAnikoImage ? (
                <img src={whyAnikoImage} alt="Why Aniko" className="img-fluid rounded" />
              ) : (
                <p className="text-light-50">No Why Aniko image uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="card mt-5 shadow-lg border-0">
            <div className="card-body bg-white text-center p-4">
              <div className="row">
                {[
                  "The only real-time solution for managing soil and plant health",
                  "Over 40% of crop loss are caused by extreme weather conditions",
                  "Over 40% of crop loss stem from poor plant disease diagnosis.",
                ].map((txt, i) => (
                  <div key={i} className={`col-md-4 ${i === 1 ? "mb-3 mb-md-0 border-start border-end" : ""}`}>
                    <img src={`/PICTURES/home-icon${i + 1}.png`} alt={`Icon ${i + 1}`} className="mb-3" width={60} />
                    <p className="mb-0 text-muted">{txt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Full Width */}
      <section className="team-section position-relative" id="team" style={{ marginTop: -50, width: "100%" }}>
        <div style={{ padding: 0, width: "100%" }}>
          <img src="/PICTURES/team-image.png" alt="Our Team" className="img-fluid team-img w-100" style={{ height: 300, objectFit: "cover" }} />
          <div className="team-overlay text-center text-white" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", maxWidth: 800, padding: 20 }}>
            <h2 className="fw-bold">Meet the Team</h2>
            <p className="lead">
              We are five 3rd-year IT students who share a passion for technology and innovation, each bringing unique
              skills and perspectives to create impactful, real-world solutions together.
            </p>
          </div>
        </div>
      </section>

      <section className="team-members py-5" style={{ width: "100%" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <div className="row justify-content-center">
            {team.length ? (
              team.map((m, i) => (
                <div key={i} className="col-md-4 mb-4">
                  <img
                    src={m.image_path}
                    alt={m.name}
                    className="rounded-circle mb-3 team-member-img"
                    style={{ width: 150, height: 150, objectFit: "cover", border: "5px solid #fff", boxShadow: "0px 4px 12px rgba(0,0,0,.2)" }}
                  />
                  <h5 className="fw-bold">{m.name}</h5>
                  <p className="text-muted">{m.role}</p>
                </div>
              ))
            ) : (
              <p>No team members added yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Home;