import React, { useEffect, useState } from "react";
import axios from "axios";
import type { Property } from "../../interfaces/Property";
import Navbar from "../ui/Navbar";
import { Link } from "react-router";
import {
  Plus,
  MapPin,
  Edit3,
  Trash2,
  Home,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const MyListings: React.FC = () => {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);

  // Update your button click handler to open the modal instead of deleting immediately:
  const initiateDelete = (id: number) => {
    setPropertyToDelete(id);
    setDeleteModalOpen(true);
  };

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/property/my-listings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          setListings(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, []);

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    const token = localStorage.getItem("token");

    try {
      // 1. Perform the delete request
      // The second argument is the config object containing headers
      await axios.delete(
        `http://localhost:5000/api/property/${propertyToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // 2. Update the UI using the state variable
      setListings(listings.filter((item) => item.id !== propertyToDelete));

      // 3. Close modal and reset state
      setDeleteModalOpen(false);
      setPropertyToDelete(null);

      toast.success("Property deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Loading your properties...
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              My Portfolio
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your published properties and track their performance.
            </p>
          </div>
          <Link
            to="/publish"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} className="text-lime-400" />
            Add New Property
          </Link>
        </div>

        {listings.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              <Home className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No active listings
            </h2>
            <p className="text-gray-500 max-w-sm mb-8">
              You haven't published any properties yet. Ready to make your first
              sale?
            </p>
            <Link
              to="/publish"
              className="text-lime-600 font-bold hover:text-lime-700 flex items-center gap-2 transition-all"
            >
              Start your first listing <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* Listings Portfolio */
          <div className="space-y-4">
            {/* Table Header - Desktop Only */}
            <div className="hidden md:grid grid-cols-12 px-8 mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              <div className="col-span-6">Property Details</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-4 text-right">Management</div>
            </div>

            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                  {/* Property Info */}
                  <div className="md:col-span-6 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center text-lime-400 flex-shrink-0">
                      <Home size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-lime-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                        <MapPin size={14} className="text-gray-400" />
                        {item.address}
                      </p>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="md:col-span-2">
                    <span className="text-xl font-black text-gray-900">
                      ${Number(item.price).toLocaleString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3">
                    <Link
                      to={`/property/:${item.id}`}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                      title="View Public Page"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <Link
                      to={`/property/edit/:${item.id}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-900 hover:text-white transition-all"
                    >
                      <Edit3 size={16} />
                      <span className="text-sm">Edit</span>
                    </Link>
                    <button
                      onClick={() => initiateDelete(item.id!)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-500 border border-red-50 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-bold"
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200 border border-gray-100 text-center">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" strokeWidth={2} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Delete Listing?
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">
              Are you sure you want to permanently remove this property? This
              action cannot be undone and will remove all associated offers.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPropertyToDelete(null);
                }}
                className="flex-1 py-4 text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
