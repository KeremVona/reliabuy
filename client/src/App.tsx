import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
