import React, { useState } from "react";
import axios from "axios";
import type { PropertyFormData } from "../../interfaces/Property";
import Navbar from "../ui/Navbar";
import { jwtDecode } from "jwt-decode";
import {
  Sparkles,
  Upload,
  X,
  Home,
  MapPin,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";

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

  const navigate = useNavigate();

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

  // NEW: State to hold Zod field errors from the backend
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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

    // Clear the specific error when the user starts typing again
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  // 5. Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({}); // Reset previous errors

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
      navigate("/home/");
      alert("Property published with images!");
    } catch (error: any) {
      console.error(error);

      // NEW: Catch Axios errors and map Zod validation errors to state
      if (error.response?.status === 400) {
        const { message, errors } = error.response.data;
        if (errors) {
          setFieldErrors(errors); // Populate field errors
        }
        setErrorMessage(message || "Validation failed. Please check the form.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Publish a Property
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Reach thousands of buyers by listing your property in minutes.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-8 p-4 bg-lime-50 border border-lime-200 text-lime-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-lime-400 p-1 rounded-full text-gray-900">
              <Sparkles size={16} />
            </div>
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <X size={20} className="text-red-500" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-sm rounded-2xl p-8 border border-gray-100"
        >
          <div className="space-y-8">
            {/* Title Input */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider"
              >
                <Home size={16} className="text-lime-500" />
                Property Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Luxury Condo in Downtown"
                // Add conditional red border if error exists
                className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 ${
                  fieldErrors.title
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-100 focus:border-lime-400"
                }`}
              />
              {/* Render the specific Zod error for this field */}
              {fieldErrors.title && (
                <p className="text-sm text-red-500 font-medium mt-1">
                  {fieldErrors.title[0]}
                </p>
              )}
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="description"
                  className="text-sm font-bold text-gray-900 uppercase tracking-wider"
                >
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || selectedFiles.length === 0}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
                    isGenerating || selectedFiles.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg active:scale-95"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      AI is Writing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-lime-400" />
                      Auto-Write with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                name="description"
                id="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property's best features, neighborhood, and selling points..."
                className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 resize-none ${
                  fieldErrors.description
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-100 focus:border-lime-400"
                }`}
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-500 font-medium mt-1">
                  {fieldErrors.description[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {/* Price Input */}
              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider"
                >
                  <DollarSign size={16} className="text-lime-500" />
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="250000"
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 focus:bg-white focus:outline-none transition-all text-gray-900 font-bold ${
                    fieldErrors.price
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-100 focus:border-lime-400"
                  }`}
                />
                {fieldErrors.price && (
                  <p className="text-sm text-red-500 font-medium mt-1">
                    {fieldErrors.price[0]}
                  </p>
                )}
              </div>

              {/* Address Input */}
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider"
                >
                  <MapPin size={16} className="text-lime-500" />
                  Full Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, Springfield..."
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 focus:bg-white focus:outline-none transition-all text-gray-900 ${
                    fieldErrors.address
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-100 focus:border-lime-400"
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-sm text-red-500 font-medium mt-1">
                    {fieldErrors.address[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Image Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-lime-400 hover:bg-lime-50/30 transition-all duration-300 cursor-pointer"
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="mb-4 p-4 bg-gray-50 rounded-full text-gray-400 group-hover:text-lime-500 group-hover:bg-white transition-all shadow-sm">
                  <Upload size={32} />
                </div>
                <p className="text-gray-900 font-bold">
                  Drag & drop images here or{" "}
                  <span className="text-lime-600 underline">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Supports High-Res JPG, PNG, WEBP (Max 10 images)
                </p>
              </label>

              {/* Previews */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="group/thumb relative w-20 h-20 rounded-xl overflow-hidden shadow-md border-2 border-white"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold transition-all duration-300 ${
                  isSubmitting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-lime-400 text-gray-900 hover:bg-lime-500 hover:shadow-lime-200 hover:-translate-y-1 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin" />
                    Publishing Listing...
                  </span>
                ) : (
                  "Publish Property"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
