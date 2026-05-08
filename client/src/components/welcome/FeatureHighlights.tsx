import React from "react";
import { Zap, Handshake, Bookmark, Smartphone } from "lucide-react";

const FeatureHighlights: React.FC = () => {
  const features = [
    {
      title: "Real-Time Search",
      description:
        "Find homes instantly with our snappy, debounced search. No waiting for slow page refreshes—results update immediately as you type.",
      icon: <Zap size={24} />,
    },
    {
      title: "Intuitive Offer System",
      description:
        "Skip the middleman. Communicate your intent and submit offer amounts directly to sellers through our transparent, built-in system.",
      icon: <Handshake size={24} />,
    },
    {
      title: "Curated Favorites",
      description:
        "Build your dream list with a single click. Easily save, organize, and monitor your top property picks all in one dashboard.",
      icon: <Bookmark size={24} />,
    },
    {
      title: "Mobile-First Design",
      description:
        "House-hunt on the go. Our flawlessly responsive grid ensures the platform works perfectly on your phone while touring neighborhoods.",
      icon: <Smartphone size={24} />,
    },
  ];

  return (
    <section className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The <span className="text-lime-500">Reliable</span> in Reliabuy
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built with cutting-edge tech to give you the ultimate edge in the
            competitive real estate market.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              {/* Icon Container with Hover Effect */}
              <div className="w-14 h-14 bg-lime-400 text-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                {feature.icon}
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
