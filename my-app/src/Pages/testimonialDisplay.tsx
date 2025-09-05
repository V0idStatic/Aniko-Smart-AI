import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import '../CSS/testimonialDisplay.module.css';
import Header from "../INCLUDE/header-logged";
import Footer from "../INCLUDE/footer";

const TestimonialDisplay: React.FC = () => {
  return (
    <div style={{ paddingTop: "80px" }}>
      <Header />

      <Footer />
    </div>
  );
};

export default TestimonialDisplay;
