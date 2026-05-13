import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  MapPin,
  DollarSign,
  FileText,
  Save,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Navbar from "../ui/Navbar";

export interface PropertyEditData {
  title: string;
  description: string;
  price: string | number;
  address: string;
}

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for the form data
  const [formData, setFormData] = useState<PropertyEditData>({
    title: "",
    description: "",
    price: "",
    address: "",
  });

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch the existing property data when the component mounts
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/property/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = response.data.data;

        // Populate the form with existing data
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          address: data.address,
        });
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch property:", err);
        setError(
          "Could not load property details. It might have been deleted or doesn't exist.",
        );
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  // 2. Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Grab token for authentication (so backend knows you are the owner)
      const token = localStorage.getItem("token");

      await axios.put(`http://localhost:5000/api/property/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // On success, redirect back to the property detail page
      navigate(`/property/${id}`);
    } catch (err: any) {
      console.error("Failed to update property:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save changes. Please try again.",
      );
      setSaving(false);
    }
  };

  // Render: Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading property details...
        </div>
      </div>
    );
  }

  // Render: Main Form
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12 lg:px-8 font-sans">
        {/* Header & Back Button */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Discard Changes
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Edit Listing
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Refine your property details to attract the best offers.
          </p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">
                Update Failed
              </p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* The Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            {/* Title Input */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest"
              >
                <Home size={16} className="text-lime-500" />
                Property Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 font-medium placeholder-gray-400"
                placeholder="e.g., Beautiful Beachfront Villa"
              />
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <label
                htmlFor="address"
                className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest"
              >
                <MapPin size={16} className="text-lime-500" />
                Location
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 font-medium placeholder-gray-400"
                placeholder="e.g., 123 Ocean Drive, Miami, FL"
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest"
              >
                <DollarSign size={16} className="text-lime-500" />
                Price (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-bold">$</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest"
              >
                <FileText size={16} className="text-lime-500" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 leading-relaxed resize-none"
                placeholder="Tell buyers about this property..."
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                disabled={saving}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`w-full sm:w-auto px-10 py-3 rounded-xl text-sm font-bold text-gray-900 shadow-lg transition-all flex items-center justify-center gap-2 ${
                  saving
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-lime-400 hover:bg-lime-500 hover:shadow-lime-200 hover:-translate-y-1 active:scale-95"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
