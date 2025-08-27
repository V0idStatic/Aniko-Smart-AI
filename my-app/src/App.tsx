import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Home from "./Pages/home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />         {/* root route */}
      <Route path="/home" element={<Home />} />     {/* /home route */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
