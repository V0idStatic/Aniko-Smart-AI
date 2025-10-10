import React, { useEffect, useRef } from "react";
import "../CSS/statsSlider.css";

export default function StatsSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      // Reset scroll position to very start after render
      setTimeout(() => {
        slider.scrollLeft = 0;
      }, 50);
    }
  }, []);

  const stats = [
    {
      img: "PICTURES/soil-monitoring-icon.png",
      alt: "Soil Monitoring",
      text: "24/7 Continuous Soil Health Monitoring with Real-Time Alerts",
    },
    {
      img: "PICTURES/plant-treatment-icon.png",
      alt: "Plant Treatment",
      text: "AI-Powered Diagnosis for 780+ Plant Diseases with Treatment Recommendations",
    },
    {
      img: "PICTURES/climate-icon.png",
      alt: "Climate Analysis",
      text: "Advanced Climate Pattern Analysis Detecting 5+ Weather Anomalies",
    },
  ];

  return (
    <section className="mobile-stats-section mt-4">
      <div className="mobile-stats-slider-wrapper">
        <div className="mobile-stats-slider" ref={sliderRef}>
          {stats.map((stat, index) => (
            <div className="mobile-stat-box" key={index}>
              <img src={stat.img} alt={stat.alt} />
              <p>{stat.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
