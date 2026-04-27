import React, { useEffect, useState } from "react";
import axios from "axios";
import type { Property } from "../../interfaces/Property";
import Navbar from "../ui/Navbar";
import { Link } from "react-router";

const MyListings: React.FC = () => {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    const token = localStorage.getItem("token");

    try {
      // 1. Perform the delete request
      // The second argument is the config object containing headers
      await axios.delete(`http://localhost:5000/api/property/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 2. Only if the request succeeds, update the UI
      setListings(listings.filter((item) => item.id !== id));

      alert("Property deleted successfully");
    } catch (err) {
      alert("Delete failed");
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
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <Link
            to="/publish"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add New Property
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-500">
              You haven't posted any properties yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600">Property</th>
                  <th className="p-4 font-semibold text-gray-600">Location</th>
                  <th className="p-4 font-semibold text-gray-600">Price</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {item.title}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {item.address}
                    </td>
                    <td className="p-4 text-blue-600 font-semibold">
                      ${item.price}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/property/edit/:${item.id}`}
                        className="text-gray-400 hover:text-blue-600 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MyListings;
