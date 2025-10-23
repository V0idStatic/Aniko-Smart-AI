import { Routes, Route } from "react-router-dom";
import Header from "./INCLUDE/Header"; // ✅ Import the smart header
import Login from "./Pages/Login";
import Home from "./Pages/home";
import DebugHome from "./Pages/DebugHome"; // Debug component
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
import AdminCMS from "./Pages/admin_cms";
import AdminRegister from "./Pages/admin_register";
import AuthCallback from "./Pages/AuthCallback";
import Download from "./Pages/download";
import Chatbox from "./Pages/Chatbox";
import HowToUse from "./Pages/HowToUse";

// ✅ Layout wrapper for pages that should have a header
const LayoutWithHeader = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    {children}
  </>
);

function App() {
  return (
    <Routes>
      {/* Default Pages WITH Header */}
      <Route path="/" element={<LayoutWithHeader><Home /></LayoutWithHeader>} />
      <Route path="/home" element={<LayoutWithHeader><Home /></LayoutWithHeader>} />
      <Route path="/debug" element={<DebugHome />} />
      <Route path="/compliance" element={<LayoutWithHeader><Compliance /></LayoutWithHeader>} />
      <Route path="/testimonialSubmit" element={<LayoutWithHeader><TestimonialSubmit /></LayoutWithHeader>} />
      <Route path="/query" element={<LayoutWithHeader><QueryComponent /></LayoutWithHeader>} />
      <Route path="/dual-query" element={<LayoutWithHeader><DualQueryComponent /></LayoutWithHeader>} />
      <Route path="/testimonialDisplay" element={<LayoutWithHeader><TestimonialDisplay /></LayoutWithHeader>} />
      <Route path="/apiWeather" element={<LayoutWithHeader><ApiWeather /></LayoutWithHeader>} />
      <Route path="/download" element={<LayoutWithHeader><Download /></LayoutWithHeader>} />
      <Route path="/chat" element={<LayoutWithHeader><Chatbox /></LayoutWithHeader>} />
      <Route path="/how-to-use" element={<LayoutWithHeader><HowToUse /></LayoutWithHeader>} />

      {/* Pages WITHOUT Header (Auth & Admin) */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin_login" element={<AdminLogin />} />
      <Route path="/admin_home" element={<AdminHome />} />
      <Route path="/admin_testimonial" element={<AdminTestimonial />} />
      <Route path="/admin_users" element={<AdminUsers />} />
      <Route path="/admin_contact" element={<AdminContact />} />
      <Route path="/admin_cms" element={<AdminCMS />} />
      <Route path="/admin_register" element={<AdminRegister />} />
    </Routes>
  );
}

export default App;
