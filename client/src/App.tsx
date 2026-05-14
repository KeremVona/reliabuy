import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Home from "./pages/Home";
import MakeProperty from "./components/property/MakeProperty";
import PropertyDetail from "./components/property/PropertyDetail";
import EditProperty from "./components/property/EditProperty";

import OffersDashboard from "./components/offer/OffersDashboard";
import MyListings from "./components/property/MyListings";
import SavedProperties from "./components/property/SavedProperties";
import Welcome from "./pages/Welcome";
import ProtectedRoute from "./ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          // Define our default Reliabuy premium styling
          className: "",
          style: {
            background: "#111827", // Tailwind gray-900
            color: "#fff",
            padding: "16px 24px",
            borderRadius: "1rem", // rounded-2xl
            fontWeight: "bold",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
          success: {
            iconTheme: {
              primary: "#a3e635", // Tailwind lime-400
              secondary: "#111827", // gray-900
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444", // Tailwind red-500
              secondary: "#111827",
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />

          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Main Routes */}
          <Route path="/home" element={<Home />} />
          <Route
            path="/property/:id"
            element={<ProtectedRoute content={<PropertyDetail />} />}
          />
          <Route
            path="/publish"
            element={<ProtectedRoute content={<MakeProperty />} />}
          />
          <Route
            path="/property/edit/:id"
            element={<ProtectedRoute content={<EditProperty />} />}
          />

          <Route
            path="/offers"
            element={<ProtectedRoute content={<OffersDashboard />} />}
          />
          <Route
            path="/my-listings"
            element={<ProtectedRoute content={<MyListings />} />}
          />
          <Route
            path="/saved"
            element={<ProtectedRoute content={<SavedProperties />} />}
          />

          {/* Send all other requests to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
