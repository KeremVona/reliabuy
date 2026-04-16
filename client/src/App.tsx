import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MakeProperty from "./components/property/MakeProperty";
import PropertyDetail from "./components/property/PropertyDetail";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Main Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/publish" element={<MakeProperty />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
