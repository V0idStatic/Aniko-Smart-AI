import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Home from "./Pages/home";
import QueryComponent from "./Pages/Query"; // Use correct name
import DualQueryComponent from "./Pages/DualQuery"; // New dual database component

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />         {/* root route */}
      <Route path="/home" element={<Home />} />     {/* /home route */}
      <Route path="/login" element={<Login />} />
      <Route path="/query" element={<QueryComponent />} /> {/* Route for QueryComponent */}
      <Route path="/dual-query" element={<DualQueryComponent />} /> {/* Route for Dual Database Query */}
    </Routes>
  );
}

export default App;
