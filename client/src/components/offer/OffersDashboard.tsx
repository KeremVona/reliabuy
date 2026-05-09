import { useEffect, useState } from "react";
import axios from "axios";
import type { ReceivedOffer } from "../../interfaces/Offer";
import Navbar from "../ui/Navbar";
import {
  Check,
  X,
  Clock,
  Banknote,
  User,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Received Offers
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review and manage incoming proposals for your active listings.
          </p>
        </div>

        {offers.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-100 rounded-3xl p-20 text-center flex flex-col items-center shadow-sm">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              <Banknote className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No offers yet
            </h2>
            <p className="text-gray-500 max-w-sm">
              Once buyers start bidding on your properties, their offers will
              appear here.
            </p>
          </div>
        ) : (
          /* Offers List */
          <div className="grid gap-8">
            {offers.map((offer) => (
              <div
                key={offer.offer_id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow duration-300"
              >
                {/* Property & Buyer Info Section */}
                <div className="p-8 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {offer.status === "PENDING" && (
                        <Clock size={16} className="text-amber-500" />
                      )}
                      {offer.status === "ACCEPTED" && (
                        <Check size={16} className="text-lime-500" />
                      )}
                      {offer.status === "REJECTED" && (
                        <X size={16} className="text-red-500" />
                      )}
                      <span
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          offer.status === "ACCEPTED"
                            ? "bg-lime-100 text-lime-700"
                            : offer.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                      <Calendar size={14} />
                      {new Date(offer.made_at).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {offer.property_title}
                  </h3>
                  <p className="text-gray-500 font-medium mb-6 flex items-center gap-2">
                    Asking Price:{" "}
                    <span className="text-gray-900">
                      ${Number(offer.asking_price).toLocaleString()}
                    </span>
                  </p>

                  {/* Buyer Profile Card */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl w-fit border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-lime-400 flex items-center justify-center font-bold shadow-inner">
                      {offer.buyer_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none mb-1 flex items-center gap-1">
                        {offer.buyer_name}
                        <User size={12} className="text-gray-400" />
                      </p>
                      <p className="text-gray-500 text-xs font-medium">
                        {offer.buyer_email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Offer Amount & Actions Section */}
                <div className="bg-gray-900 p-8 flex flex-col justify-center items-center md:min-w-[280px] text-center relative overflow-hidden">
                  {/* Subtle Background Icon Decor */}
                  <Banknote
                    size={120}
                    className="absolute -bottom-4 -right-4 text-white/5 rotate-12 pointer-events-none"
                  />

                  <p className="text-xs text-lime-400 uppercase font-black tracking-[0.2em] mb-2">
                    Offer Amount
                  </p>
                  <p className="text-4xl font-black text-white mb-6 tracking-tight">
                    ${Number(offer.amount).toLocaleString()}
                  </p>

                  {offer.status === "PENDING" ? (
                    <div className="flex flex-col w-full gap-3 relative z-10">
                      <button
                        onClick={() =>
                          handleUpdateStatus(offer.offer_id, "ACCEPTED")
                        }
                        disabled={processingId === offer.offer_id}
                        className="bg-lime-400 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-lime-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check size={18} strokeWidth={3} />
                        Accept Offer
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(offer.offer_id, "REJECTED")
                        }
                        disabled={processingId === offer.offer_id}
                        className="bg-transparent text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <X size={18} strokeWidth={3} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                      <span>Decided</span>
                      <ArrowUpRight size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
