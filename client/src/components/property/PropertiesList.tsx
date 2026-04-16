import React, { useState, useEffect } from "react";
import axios from "axios";
import type { PropertyData } from "../../interfaces/Property";
import { Link } from "react-router";

// 1. Define the TypeScript interface based on our backend JOIN query

export default function PropertiesList() {
  // 2. State management
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch data on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get("http://localhost:5000/api/property", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProperties(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again later.");
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // 4. Handle Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading properties...
        </div>
      </div>
    );
  }

  // 5. Handle Error State
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md shadow">
          {error}
        </div>
      </div>
    );
  }

  // 6. Main UI Render
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Available Properties
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse our latest listings published by our users.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No properties found. Check back later!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property.property_id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Card Body */}
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <Link
                    to={`/property/:${property.property_id}`}
                    className="text-xl font-bold text-gray-900 line-clamp-1"
                  >
                    {property.title}
                  </Link>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ${Number(property.price).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-4 flex items-start">
                  <svg
                    className="h-5 w-5 mr-1.5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="line-clamp-2">{property.address}</span>
                </p>

                <p className="text-base text-gray-700 line-clamp-3 mb-4">
                  {property.description}
                </p>
              </div>

              {/* Card Footer (Publisher Info) */}
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Published by:{" "}
                  <span className="font-medium text-gray-900">
                    {property.publisher_name}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
