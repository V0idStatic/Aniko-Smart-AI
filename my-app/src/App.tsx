import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Home from "./Pages/home";
import Compliance from "./Pages/compliance";
import TestimonialSubmit from "./Pages/testimonialSubmit";
import QueryComponent from "./Pages/Query";
import DualQueryComponent from "./Pages/DualQuery";
import TestimonialDisplay from "./Pages/testimonialDisplay";
import ApiWeather from "./Pages/apiWeather";
import AdminLogin from "./Pages/admin_login";
import AdminHome from "./Pages/admin_home";
import AdminTestimonial from "./Pages/admin_testimonial";
import AdminUsers from "./Pages/admin_users";
import AdminContact from "./Pages/admin_contact";
import AdminCMS from "./Pages/admin_cms"; // ✅ Add this line

function App() {
  return (
    <Routes>
      {/* Default Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/compliance" element={<Compliance />} />
      <Route path="/testimonialSubmit" element={<TestimonialSubmit />} />
      <Route path="/login" element={<Login />} />
      <Route path="/query" element={<QueryComponent />} />
      <Route path="/dual-query" element={<DualQueryComponent />} />
      <Route path="/testimonialDisplay" element={<TestimonialDisplay />} />
      <Route path="/apiWeather" element={<ApiWeather />} />

      {/* Admin Pages */}
      <Route path="/admin_login" element={<AdminLogin />} />
      <Route path="/admin_home" element={<AdminHome />} />
      <Route path="/admin_testimonial" element={<AdminTestimonial />} />
      <Route path="/admin_users" element={<AdminUsers />} />
      <Route path="/admin_contact" element={<AdminContact />} />
      <Route path="/admin_cms" element={<AdminCMS />} />

    </Routes>
  );
}

export default App;
