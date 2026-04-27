import React, { useState, useEffect } from "react";
import axios from "axios";
import type { Property } from "../../interfaces/Property";

const PropertySearch: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/property/search?q=${query}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.data.success) {
          setResults(response.data.data);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce: Wait 500ms after last keystroke
    const timeoutId = setTimeout(fetchSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="relative">
        <input
          type="text"
          className="w-full p-4 pl-12 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Search by title or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="absolute left-4 top-4 text-gray-400">🔍</span>
      </div>

      {loading && (
        <p className="mt-4 text-blue-500 animate-pulse">Searching...</p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((property) => (
          <div
            key={property.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <h3 className="font-bold text-lg text-gray-800">
              {property.title}
            </h3>
            <p className="text-gray-500 text-sm">📍 {property.address}</p>
            <p className="mt-2 text-blue-600 font-semibold">
              ${property.price}
            </p>
          </div>
        ))}
      </div>

      {!loading && query.length > 2 && results.length === 0 && (
        <p className="mt-4 text-gray-500">No properties found for "{query}"</p>
      )}
    </div>
  );
};

export default PropertySearch;
