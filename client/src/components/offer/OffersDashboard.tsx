import { useEffect, useState } from "react";
import axios from "axios";
import type { ReceivedOffer } from "../../interfaces/Offer";

export default function OffersDashboard() {
  const [offers, setOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/offer/received", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    offerId: number,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    setProcessingId(offerId);
    try {
      await axios.patch(
        `http://localhost:5000/api/offer/${offerId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state instead of refetching everything
      setOffers((prev) =>
        prev.map((o) => (o.offer_id === offerId ? { ...o, status } : o)),
      );
    } catch (err) {
      alert("Failed to update offer status.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">Loading offers...</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Received Offers</h1>

      {offers.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">You haven't received any offers yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <div
              key={offer.offer_id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              {/* Property & Buyer Info */}
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      offer.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : offer.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {offer.status}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {new Date(offer.made_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {offer.property_title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Asking Price: ${Number(offer.asking_price).toLocaleString()}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {offer.buyer_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{offer.buyer_name}</p>
                    <p className="text-gray-500 text-xs">{offer.buyer_email}</p>
                  </div>
                </div>
              </div>

              {/* Offer Amount & Actions */}
              <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-center items-center min-w-[200px]">
                <p className="text-sm text-gray-500 uppercase font-bold">
                  Offer Amount
                </p>
                <p className="text-3xl font-black text-indigo-600 mb-4">
                  ${Number(offer.amount).toLocaleString()}
                </p>

                {offer.status === "PENDING" && (
                  <div className="flex flex-col w-full gap-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(offer.offer_id, "ACCEPTED")
                      }
                      disabled={processingId === offer.offer_id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(offer.offer_id, "REJECTED")
                      }
                      disabled={processingId === offer.offer_id}
                      className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
