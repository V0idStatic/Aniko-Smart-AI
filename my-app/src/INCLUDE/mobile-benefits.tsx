import React, { useEffect, useRef } from "react";
import "../CSS/mobile-benefits.css";

export default function BenefitsSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      requestAnimationFrame(() => {
        slider.scrollTo({ left: 0 });
      });
    }
  }, []);

  const benefits = [
    {
      title: "Monitor & Protect",
      img: "PICTURES/benefits-icon1.png",
      alt: "24/7 Monitoring",
      text: "Continuous field monitoring with instant alerts for optimal crop protection and growth management.",
    },
    {
      title: "Predict & Prevent",
      img: "PICTURES/benefits-icon2.png",
      alt: "Climate Prediction",
      text: "Advanced climate anomaly prediction helps you prepare and protect your crops from weather threats.",
    },
    {
      title: "Optimize & Grow",
      img: "PICTURES/benefits-icon3.png",
      alt: "AI Features",
      text: "AI-powered insights and recommendations to maximize yield and optimize resource usage efficiently.",
    },
  ];

  return (
    <section className="mobile-benefits-section mt-5">
      <div className="mobile-benefits-slider" ref={sliderRef}>
        {benefits.map((item, index) => (
          <div className="mobile-benefit-card" key={index}>
            <h5>{item.title}</h5>
            <img src={item.img} alt={item.alt} />
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
