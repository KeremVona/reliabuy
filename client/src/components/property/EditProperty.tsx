import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Back Button */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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
          Back
        </button>
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Property</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update the details of your listing below.
        </p>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md">
          <p>{error}</p>
        </div>
      )}

      {/* The Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Title Input */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Property Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors"
              placeholder="e.g., Beautiful Beachfront Villa"
            />
          </div>

          {/* Address Input */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors"
              placeholder="e.g., 123 Ocean Drive, Miami, FL"
            />
          </div>

          {/* Price Input */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price (USD)
            </label>
            <div className="mt-1 relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="block w-full pl-7 pr-12 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-colors resize-y"
              placeholder="Tell buyers about this property..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                saving ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
