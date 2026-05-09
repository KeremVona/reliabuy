import axios from "axios";
import { ArrowRight, Heart, Home, ImageOff, MapPin } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SavedProperty } from "../../interfaces/Property";
import Navbar from "../ui/Navbar";

export default function SavedProperties() {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchSavedProperties = async () => {
      if (!token) {
        setError("You must be logged in to view saved properties.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/property/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          console.log(response.data.data);
          setProperties(response.data.data);
        }
      } catch (err: any) {
        console.error("Error fetching saved properties:", err);
        setError("Failed to load your saved properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProperties();
  }, [token]);

  const handleUnsave = async (e: React.MouseEvent, id: number) => {
    // Prevent the click from bubbling up to the card (which navigates to details)
    e.stopPropagation();

    try {
      await axios.delete(`${BASE_URL}/api/property/${id}/favorite`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Optimistic UI Update: Remove the property from the screen immediately
      setProperties((prev) => prev.filter((property) => property.id !== id));
    } catch (err) {
      console.error("Failed to unsave property:", err);
      alert("Could not remove the property. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading your favorites...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              My Saved Properties
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Monitor price changes and status updates for your favorite homes.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm w-fit">
            <span className="flex h-2 w-2 rounded-full bg-lime-500 animate-pulse"></span>
            <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">
              {properties.length}{" "}
              {properties.length === 1 ? "Property" : "Properties"}
            </span>
          </div>
        </div>

        {properties.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              <Heart className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your collection is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              You haven't saved any properties yet. Start browsing to find your
              perfect match!
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Explore Market
            </button>
          </div>
        ) : (
          /* Grid Section */
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/property/${property.id}`)}
                className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-2"
              >
                {/* Image Section */}
                <div className="relative h-60 bg-gray-100 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={`${BASE_URL}${property.images[0]}`}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                      <ImageOff size={32} strokeWidth={1.5} />
                      <span className="text-xs font-medium uppercase tracking-tighter">
                        No Preview
                      </span>
                    </div>
                  )}

                  {/* Floating Unsave Button */}
                  <button
                    onClick={(e) => handleUnsave(e, property.id)}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 z-10 group/btn"
                    title="Remove from favorites"
                  >
                    <Heart className="w-5 h-5 fill-current transition-transform group-hover/btn:scale-110" />
                  </button>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-lime-400 text-gray-900 px-4 py-2 rounded-xl font-black text-lg shadow-xl">
                      ${Number(property.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3
                      className="text-xl font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-lime-600 transition-colors"
                      title={property.title}
                    >
                      {property.title}
                    </h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                      <MapPin size={16} className="text-lime-500" />
                      <span className="line-clamp-1">{property.address}</span>
                    </p>
                  </div>

                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Home size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Property
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-900 group-hover:gap-3 transition-all">
                      View Details
                      <ArrowRight size={18} className="text-lime-500" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
