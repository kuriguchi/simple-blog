import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Create from "./pages/Create";
import BlogDetail from "./pages/BlogDetail";
import Update from "./pages/Update";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <div className="">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/update/:id" element={<Update />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App


