import React from "react";
import "../CSS/mobile-features.css";

const features = [
  {
    img: "PICTURES/fc1.png",
    alt: "Climate Analysis",
    text: "Climate Pattern Analysis",
  },
  {
    img: "PICTURES/fc2.png",
    alt: "Plant Diagnosis",
    text: "AI-Powered Plant Diagnosis",
  },
  {
    img: "PICTURES/fc3.png",
    alt: "Soil Health",
    text: "Real-Time Soil Monitoring",
  },
  {
    img: "PICTURES/fc4.png",
    alt: "Health Check",
    text: "Intelligent Health Analytics",
  },
];

const ListFeatures: React.FC = () => {
  return (
    <div className="list-features-container">
      {features.map((feature, index) => (
        <div key={index} className="list-feature-item">
          <img
            src={feature.img}
            alt={feature.alt}
            className="sol-icon"
            width={45}
            height={45}
          />
          <p className="mobile-list-feature-text">{feature.text}</p>
        </div>
      ))}
    </div>
  );
};

export default ListFeatures;
