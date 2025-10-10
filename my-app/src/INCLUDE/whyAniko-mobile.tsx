import React, { useEffect, useRef } from "react";
import "../CSS/whyAniko-mobile.css";

const whyCards = [
  {
    img: "/PICTURES/why-icon.png",
    alt: "Icon 1",
    text: "The only real-time solution for managing soil and plant health.",
  },
  {
    img: "/PICTURES/why-icon.png",
    alt: "Icon 2",
    text: "Over 40% of crop loss are caused by extreme weather conditions.",
  },
  {
    img: "/PICTURES/why-icon.png",
    alt: "Icon 3",
    text: "Over 40% of crop loss stem from poor plant disease diagnosis.",
  },
];

const WhyAniko: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-slide effect
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let scrollDirection = 1;
    const scrollSpeed = 1; // adjust this for faster/slower slide

    const slide = () => {
      if (!slider) return;
      slider.scrollLeft += scrollSpeed * scrollDirection;

      if (
        slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1 ||
        slider.scrollLeft <= 0
      ) {
        scrollDirection *= -1;
      }
    };

    const interval = setInterval(slide, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="why-aniko-section">
      <h2 className="why-aniko-title">Why Choose Aniko?</h2>

      <div className="why-aniko-slider" ref={sliderRef}>
        {whyCards.map((card, index) => (
          <div key={index} className="why-aniko-card">
            <img
              src={card.img}
              alt={card.alt}
              className="why-aniko-icon"
              width={60}
              height={60}
            />
            <p className="why-aniko-text">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyAniko;
