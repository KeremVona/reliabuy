import { BrowserRouter, Route, Routes } from "react-router";
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
          <Route path="/property/edit/:id" element={<EditProperty />} />

          <Route path="/offers" element={<OffersDashboard />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/saved" element={<SavedProperties />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
