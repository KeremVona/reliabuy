import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { PropertyData } from "../../interfaces/Property";
import { MapPin, User, AlertCircle } from "lucide-react";

// 1. Define the TypeScript interface based on our backend JOIN query

const BASE_URL = "http://localhost:5000";

export default function PropertiesList() {
  // 2. State management
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 6;

  const sortedProperties = [...properties].sort((a, b) => {
    if (sortOrder === "low-high") {
      return Number(a.price) - Number(b.price);
    }

    if (sortOrder === "high-low") {
      return Number(b.price) - Number(a.price);
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);

  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;

  const currentProperties = sortedProperties.slice(startIndex, endIndex);

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

  // Sleek, modern loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-lime-500 rounded-full animate-spin"></div>
          <div className="text-sm font-semibold text-gray-500 tracking-wide uppercase">
            Loading properties...
          </div>
        </div>
      </div>
    );
  }

  // Premium error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50 px-6">
        <div className="bg-white border border-red-100 p-6 rounded-2xl shadow-sm max-w-md w-full flex items-start gap-4">
          <div className="bg-red-50 text-red-500 p-3 rounded-xl flex-shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Connection Error
            </h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  // 6. Main UI Render
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Available Properties
          </h1>
          <p className="text-lg text-gray-600">
            Browse our latest, verified listings published by our community.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">
              Sort by Price:
            </label>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              <option value="default">Default</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="text-center bg-white border border-gray-200 rounded-2xl py-16 px-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-500">
              There are no properties available at the moment. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProperties.map((property) => (
              <div
                key={property.property_id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 group hover:-translate-y-1 flex flex-col overflow-hidden"
              >
                {/* Optional Image Placeholder (Highly recommended for Real Estate UI)   */}
                {/*src={`../../../..server/${property.image_url}`}*/}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={`${BASE_URL}${property.image_url}`}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Price Badge over image */}
                  <div className="absolute bottom-4 left-4 bg-lime-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                    ${Number(property.price).toLocaleString()}
                  </div>
                </div>
                {/* Card Body */}
                <div className="p-6 flex-grow flex flex-col">
                  <Link
                    to={`/property/:${property.property_id}`}
                    className="text-xl font-bold text-gray-900 line-clamp-1 mb-2 hover:text-lime-600 transition-colors"
                  >
                    {property.title}
                  </Link>

                  <div className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-medium">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{property.address}</span>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {property.description}
                  </p>
                </div>
                {/* Card Footer (Publisher Info) */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <User size={16} />
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-500 text-xs">Listed by</p>
                      <p className="font-bold text-gray-900">
                        {property.publisher_name}
                      </p>
                    </div>
                  </div>

                  {/* Subtle interaction cue */}
                  <Link
                    to={`/property/:${property.property_id}`}
                    className="text-sm font-semibold text-lime-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                currentPage === index + 1
                  ? "bg-lime-400 text-black"
                  : "bg-white border border-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
