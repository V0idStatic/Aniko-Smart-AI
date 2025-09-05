import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Home from "./Pages/home";
import Compliance from "./Pages/compliance";   // ✅ Capitalized
import TestimonialSubmit from "./Pages/testimonialSubmit";   // ✅ Capitalized
import QueryComponent from "./Pages/Query"; 
import DualQueryComponent from "./Pages/DualQuery"; 
import TestimonialDisplay from "./Pages/testimonialDisplay";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/compliance" element={<Compliance />} /> {/* ✅ Fixed */}
      <Route path="/testimonialSubmit" element={<TestimonialSubmit />} />
      <Route path="/login" element={<Login />} />
      <Route path="/query" element={<QueryComponent />} />
      <Route path="/dual-query" element={<DualQueryComponent />} />
      <Route path="/testimonialDisplay" element={<TestimonialDisplay />} />
    </Routes>
  );
}

export default App;
