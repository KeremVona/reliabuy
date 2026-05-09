import React, { useState, useEffect } from "react";
import axios from "axios";
import type { Property } from "../../interfaces/Property";
import { Search, X, MapPin, ArrowRight, Loader2, SearchX } from "lucide-react";
import { useNavigate } from "react-router";

const PropertySearch: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

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
    <div className="bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Search Bar Container */}
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors">
            <Search size={24} strokeWidth={2.5} />
          </div>

          <input
            type="text"
            className="w-full bg-white p-6 pl-14 pr-14 rounded-2xl border border-gray-100 shadow-sm text-lg font-medium text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-lime-400/20 focus:border-lime-400 focus:outline-none transition-all"
            placeholder="Search by title, neighborhood, or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Clear Search Button */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all"
              aria-label="Clear search"
            >
              <X size={18} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Searching State */}
        {loading && (
          <div className="mt-8 flex items-center justify-center gap-3 text-lime-600 font-bold uppercase tracking-widest text-xs">
            <Loader2 size={18} className="animate-spin" />
            Fetching live results...
          </div>
        )}

        {/* Results Meta Info */}
        {!loading && query.length > 0 && results.length > 0 && (
          <div className="mt-10 mb-6 flex items-center justify-between">
            <p className="text-gray-500 font-medium">
              Showing{" "}
              <span className="text-gray-900 font-bold">{results.length}</span>{" "}
              properties matching your search
            </p>
            <div className="h-px flex-grow mx-4 bg-gray-200 hidden sm:block"></div>
          </div>
        )}

        {/* Results Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((property) => (
            <div
              key={property.id}
              onClick={() => navigate(`/property/:${property.id}`)}
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-gray-900 group-hover:text-lime-600 transition-colors line-clamp-1">
                  {property.title}
                </h3>
                <ArrowRight
                  size={18}
                  className="text-gray-300 group-hover:text-lime-500 group-hover:translate-x-1 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-6">
                <MapPin size={16} className="text-lime-500" />
                <span className="line-clamp-1">{property.address}</span>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <p className="text-2xl font-black text-gray-900">
                  ${Number(property.price).toLocaleString()}
                </p>
                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  Available
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* No Results State */}
        {!loading && query.length > 2 && results.length === 0 && (
          <div className="mt-20 text-center flex flex-col items-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <SearchX size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              No matches found
            </h3>
            <p className="text-gray-500 mt-2">
              We couldn't find anything for "
              <span className="text-gray-900 font-semibold">{query}</span>".
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-6 text-lime-600 font-bold hover:underline"
            >
              Clear filters and try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
