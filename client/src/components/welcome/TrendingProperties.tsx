import React from "react";
import { MapPin, BedDouble, Bath, Square, ArrowRight } from "lucide-react";

const TrendingProperties: React.FC = () => {
  // Mock data for the property cards
  const properties = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      price: "$1,250,000",
      title: "Modern Glass Villa",
      city: "Beverly Hills, CA",
      beds: 4,
      baths: 3.5,
      sqft: "3,200",
      badge: "Trending",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      price: "$850,000",
      title: "Luxury Minimalist Condo",
      city: "Austin, TX",
      beds: 2,
      baths: 2,
      sqft: "1,850",
      badge: "New",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      price: "$2,100,000",
      title: "Contemporary Estate",
      city: "Miami, FL",
      beds: 5,
      baths: 6,
      sqft: "5,400",
      badge: "Hot Deal",
    },
  ];

  return (
    <section className="py-20 bg-gray-50" id="trending">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recently Added
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Take a sneak peek at some of the newest and most popular
              properties hitting the market today.
            </p>
          </div>

          {/* Desktop "View All" Link (Optional secondary placement) */}
          <a
            href="/home"
            className="hidden md:flex items-center gap-2 text-lime-600 font-semibold hover:text-lime-700 transition"
          >
            View Properties <ArrowRight size={20} />
          </a>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
            >
              {/* Image Container with Hover Zoom */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Badge */}
                <div className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-md tracking-wider uppercase shadow-md">
                  {property.badge}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="text-2xl font-bold text-lime-500 mb-2">
                  {property.price}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 mb-6">
                  <MapPin size={18} />
                  <span className="text-sm font-medium">{property.city}</span>
                </div>

                {/* Property Specs Divider & Row */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-gray-600 text-sm">
                  <div className="flex items-center gap-1.5">
                    <BedDouble size={18} />
                    <span>{property.beds} Beds</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath size={18} />
                    <span>{property.baths} Baths</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Square size={18} />
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Button */}
        <div className="mt-16 flex justify-center">
          <a
            href="/home"
            className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
          >
            View All Listings
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default TrendingProperties;
