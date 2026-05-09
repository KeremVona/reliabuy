import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, DollarSign, Heart, ImageOff, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PropertyDetailData } from "../../interfaces/Property";

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

  // --- Favorites / Saved State ---
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    const fetchPropertyAndStatus = async () => {
      try {
        // 1. Fetch the single property by ID
        const propertyRes = await axios.get(`${BASE_URL}/api/property/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const propertyData = propertyRes.data.data;
        setProperty(propertyData);

        if (propertyData.images && propertyData.images.length > 0) {
          setActiveImage(propertyData.images[0]);
        }

        // 2. Fetch user's saved properties to see if this one is already saved
        if (token) {
          const savedRes = await axios.get(`${BASE_URL}/api/property/saved`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Check if current property ID exists in the user's saved list
          const isFavorited = savedRes.data.data.some(
            (savedItem: any) => savedItem.id === propertyData.id,
          );
          setIsSaved(isFavorited);
        }

        setLoading(false);
      } catch (err: any) {
        console.error(`Failed to fetch property ${id}:`, err);
        if (err.response && err.response.status === 404) {
          setError("Property not found.");
        } else {
          setError("Failed to load property details. Please try again later.");
        }
        setLoading(false);
      }
    };

    if (id) {
      fetchPropertyAndStatus();
    }
  }, [id, token]);

  // --- Handle Save / Unsave ---
  const handleToggleSave = async () => {
    setIsSaving(true);
    try {
      const idSend = Number(id!.slice(1));
      if (isSaved) {
        // Unsave
        await axios.delete(`${BASE_URL}/api/property/${idSend}/favorite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsSaved(false);
      } else {
        // Save (Note: POST requests need an empty body {} as the second argument if passing headers third)
        await axios.post(
          `${BASE_URL}/api/property/${idSend}/favorite`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      alert("Could not update saved properties. Try again.");
    } finally {
      setIsSaving(false);
    }
  };
  // --- Handle Offer Submission ---
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || Number(offerAmount) <= 0)
      return alert("Please enter a valid amount");

    setIsSubmitting(true);
    try {
      // NOTE:  const idSend = Number(id);
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
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 font-sans">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group"
      >
        <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to listings
      </button>

      {/* Property Detail Card */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
        {/* --- IMAGE GALLERY SECTION --- */}
        <div className="bg-gray-50 border-b border-gray-100">
          {activeImage ? (
            <div className="flex flex-col">
              {/* Main Image */}
              <div className="relative h-72 sm:h-[500px] w-full overflow-hidden bg-gray-100 flex justify-center group">
                <img
                  src={`${BASE_URL}${activeImage}`}
                  alt={property.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto bg-white border-t border-gray-100 scrollbar-hide">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        activeImage === img
                          ? "border-lime-500 scale-105 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img
                        src={`${BASE_URL}${img}`}
                        className="w-full h-full object-cover"
                        alt={`Thumbnail ${idx + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Placeholder if no images exist
            <div className="h-72 sm:h-[500px] flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <ImageOff className="w-16 h-16 mb-4 text-gray-300" />
              <span className="font-medium">
                No images available for this property
              </span>
            </div>
          )}
        </div>

        {/* Header Section */}
        <div className="p-8 sm:p-12 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {property.title}
            </h1>
            <p className="flex items-center text-gray-500 font-medium text-lg">
              <MapPin className="h-5 w-5 mr-2 text-lime-500 flex-shrink-0" />
              {property.address}
            </p>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-6 py-3 rounded-xl text-2xl font-bold bg-lime-400 text-gray-900 shadow-sm">
              ${Number(property.price).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About this property
          </h2>
          <div className="prose max-w-none text-gray-600 whitespace-pre-line leading-relaxed text-lg">
            {property.description}
          </div>

          {/* Conditional Rendering: Only show standard buttons if NOT the owner */}
          {!isOwner && (
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="flex-1 bg-lime-400 text-gray-900 px-6 py-4 rounded-xl font-bold hover:bg-lime-500 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
              >
                Make an Offer
              </button>

              {/* The Favorites Toggle Button */}
              <button
                onClick={handleToggleSave}
                disabled={isSaving}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-sm hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSaved
                    ? "bg-gray-900 text-white border border-gray-900 hover:bg-gray-800 focus:ring-gray-900"
                    : "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-200"
                } disabled:opacity-50 disabled:hover:translate-y-0`}
              >
                <Heart
                  className={`w-5 h-5 ${isSaved ? "fill-lime-400 text-lime-400" : "text-gray-900"}`}
                />
                {isSaved ? "Saved to Favorites" : "Save for Later"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- OFFER MODAL --- */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Make an Offer
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Enter the amount you are willing to pay for{" "}
              <span className="font-bold text-gray-900">{property.title}</span>.
            </p>

            <form onSubmit={handleSendOffer}>
              <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  autoFocus
                  type="number"
                  placeholder="Enter amount"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-colors text-xl font-bold text-gray-900 placeholder-gray-400"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="flex-1 py-4 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
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
