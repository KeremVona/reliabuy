import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PropertyDetailData } from "../../interfaces/Property";
import { jwtDecode } from "jwt-decode";

// 1. Define the TypeScript interface
// Note: This matches the basic Property interface from your backend.
// If you added a JOIN to your getPropertyById backend function,
// you can add the publisher fields here just like we did in the List component!

export default function PropertyDetail() {
  // Grab the ID from the URL (e.g., /property/:id)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // State management
  const [property, setProperty] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Image Gallery State ---
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // --- Offer State ---
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // Fetch the single property by ID
        const response = await axios.get(`${BASE_URL}/api/property/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data.data;
        setProperty(data);

        // Set the first image as active if it exists
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error(`Failed to fetch property ${id}:`, err);
        // Handle 404s specifically
        if (err.response && err.response.status === 404) {
          setError("Property not found.");
        } else {
          setError("Failed to load property details. Please try again later.");
        }
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // --- Handle Offer Submission ---
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || Number(offerAmount) <= 0)
      return alert("Please enter a valid amount");

    setIsSubmitting(true);
    try {
      const idSend = Number(id!.slice(1));
      await axios.post(
        "http://localhost:5000/api/offer",
        {
          amount: Number(offerAmount),
          propertyId: Number(idSend),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Offer sent successfully!");
      setIsOfferModalOpen(false);
      setOfferAmount("");
    } catch (err) {
      console.error("Offer failed:", err);
      alert("Failed to send offer. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle the delete action
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property? This cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/property/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Property deleted successfully.");
      navigate("/home"); // Redirect to home page
    } catch (err) {
      console.error("Failed to delete property:", err);
      alert("Failed to delete the property. Please try again.");
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading property details...
        </div>
      </div>
    );
  }

  // Error State
  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p>{error || "Something went wrong."}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  let isOwner = false;

  // 2. Make sure BOTH the token AND the property exist before checking
  if (token && property) {
    try {
      const decoded: any = jwtDecode(token);
      // Convert both IDs to strings to avoid "1" === 1 failing
      const currentUserId = String(decoded.user.id);

      const propertyOwnerId = String(property.user_id);

      isOwner = currentUserId === propertyOwnerId;
    } catch (error) {
      console.error("Invalid token format", error);
      isOwner = false; // Default to false if someone messed with the token
    }
  }
  // Main UI Render
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <svg
          className="mr-2 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to listings
      </button>

      {/* Property Detail Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* --- IMAGE GALLERY SECTION --- */}
        <div className="bg-gray-100 border-b border-gray-200">
          {activeImage ? (
            <div className="flex flex-col">
              {/* Main Image */}
              <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-black flex justify-center">
                <img
                  src={`${BASE_URL}${activeImage}`}
                  alt={property.title}
                  className="h-full object-contain"
                />
              </div>

              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-white border-t scrollbar-hide">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        activeImage === img
                          ? "border-indigo-600 scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={`${BASE_URL}${img}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Placeholder if no images exist
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>No images available for this property</span>
            </div>
          )}
        </div>
        {/* Header Section */}
        <div className="p-6 sm:p-10 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {property.title}
            </h1>
            <p className="flex items-center text-gray-600 mt-2">
              <svg
                className="h-5 w-5 mr-2 text-indigo-500"
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
              {property.address}
            </p>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-4 py-2 rounded-lg text-2xl font-bold bg-indigo-100 text-indigo-800 shadow-sm">
              ${Number(property.price).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About this property
          </h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
            {property.description}
          </div>

          {/* Conditional Rendering: Only show standard buttons if NOT the owner */}
          {!isOwner && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Make an Offer
              </button>
              <button className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Save for Later
              </button>
            </div>
          )}

          {/* Conditional Rendering: Only show Management buttons if IS the owner */}
          {isOwner && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate(`/property/edit/${id}`)}
                className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Edit Property
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Property
              </button>
            </div>
          )}
        </div>
      </div>
      {/* --- OFFER MODAL --- */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Make an Offer
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Enter the amount you are willing to pay for{" "}
              <span className="font-semibold">{property.title}</span>.
            </p>

            <form onSubmit={handleSendOffer}>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  $
                </span>
                <input
                  autoFocus
                  type="number"
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors text-lg font-semibold"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Sending..." : "Submit Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
