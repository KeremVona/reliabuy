import React, { useState } from "react";
import axios from "axios";
import type { PropertyFormData } from "../../interfaces/Property";
import Navbar from "../ui/Navbar";
import { jwtDecode } from "jwt-decode";

// 1. Define the data structure for the form

export default function MakeProperty() {
  const token = localStorage.getItem("token");
  let currentUserId;
  if (token) {
    const decoded: any = jwtDecode(token);
    currentUserId = decoded.user.id;
  }

  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 2. Form State
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    price: "",
    address: "",
    user_id: currentUserId,
    images: [],
  });

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  // 3. UI Status State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for AI generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Handle AI Description Generation
  const handleGenerateDescription = async () => {
    if (selectedFiles.length === 0) {
      alert(
        "Please select some images first so the AI has something to analyze!",
      );
      return;
    }

    setIsGenerating(true);

    const data = new FormData();
    selectedFiles.forEach((file) => {
      data.append("images", file);
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/property/generate-description",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Update the description field specifically, preserving the rest of the form
      setFormData((prev) => ({
        ...prev,
        description: response.data.description,
      }));
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Handle input changes dynamically
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Convert price and user_id to numbers, otherwise keep as string
      [name]: name === "price" || name === "user_id" ? Number(value) : value,
    }));
  };

  // 5. Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", String(formData.price));
    data.append("address", formData.address);

    // Append all files to the "images" key (Multer expects this name)
    selectedFiles.forEach((file) => {
      data.append("images", file);
    });

    try {
      await axios.post("http://localhost:5000/api/property", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Tell browser this is a file upload
        },
      });
      alert("Property published with images!");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Publish a Property
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill out the form below to list a new property on the market.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 border border-gray-100"
        >
          <div className="grid grid-cols-1 gap-y-6">
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
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Luxury Condo in Downtown"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || selectedFiles.length === 0}
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md shadow-sm text-white ${
                    isGenerating || selectedFiles.length === 0
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    "✨ Auto-Write with AI"
                  )}
                </button>
              </div>
              <textarea
                name="description"
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property's best features..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              {/* Price Input */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="250000"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            {/* Address Input */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Full Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, Springfield, IL 62701"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <p className="text-gray-600">
                  Drag & drop images here or <b>click to browse</b>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPG, PNG, WEBP
                </p>
              </label>

              {/* Previews */}
              <div className="flex flex-wrap gap-4 mt-4">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Publishing...
                  </span>
                ) : (
                  "Publish Property"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
