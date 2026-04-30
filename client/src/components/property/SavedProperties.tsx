import React, { useEffect, useState } from "react";
import axios from "axios";
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
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Saved Properties
          </h1>
          <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm font-semibold">
            {properties.length} {properties.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              No favorites yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start exploring and save properties you love!
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/property/${property.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={`${BASE_URL}${property.images[0]}`}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Floating Unsave Button */}
                  <button
                    onClick={(e) => handleUnsave(e, property.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-red-50 text-red-500 transition-colors z-10"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="text-lg font-bold text-gray-900 line-clamp-1"
                      title={property.title}
                    >
                      {property.title}
                    </h3>
                  </div>

                  <p className="text-gray-500 text-sm mb-4 flex items-center line-clamp-1">
                    <span className="mr-1">📍</span> {property.address}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-indigo-600">
                      ${Number(property.price).toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
