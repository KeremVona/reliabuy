import React from "react";
import {
  Search,
  Heart,
  Send,
  ImagePlus,
  LayoutDashboard,
  ShieldCheck,
  Key,
  Home,
} from "lucide-react";

const HowItWorks: React.FC = () => {
  const buyerSteps = [
    {
      title: "Search & Filter",
      description:
        "Find homes using the global search with lightning-fast responsiveness.",
      icon: <Search size={24} />,
    },
    {
      title: "Favorite & Track",
      description:
        "Save properties to a personal dashboard to monitor price changes.",
      icon: <Heart size={24} />,
    },
    {
      title: "Make Direct Offers",
      description: "Submit offer amounts directly through the platform.",
      icon: <Send size={24} />,
    },
  ];

  const sellerSteps = [
    {
      title: "List in Minutes",
      description: "Upload up to 10 high-resolution images and set your price.",
      icon: <ImagePlus size={24} />,
    },
    {
      title: "Manage Dashboard",
      description: "Track all your active listings in one centralized view.",
      icon: <LayoutDashboard size={24} />,
    },
    {
      title: "Secure Transactions",
      description:
        "Interact and negotiate safely in our authenticated environment.",
      icon: <ShieldCheck size={24} />,
    },
  ];

  return (
    <section className="py-20 bg-gray-100" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Reliabuy Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're looking for your dream home or selling a property,
            our platform makes the process seamless from start to finish.
          </p>
        </div>

        {/* Process Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8">
          {/* Buyers Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-900 text-white p-2 rounded-lg">
                <Key size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">For Buyers</h3>
            </div>

            {buyerSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-5 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
              >
                <div className="flex-shrink-0 bg-lime-400 text-gray-900 p-3 rounded-xl shadow-sm">
                  {step.icon}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sellers Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2 lg:pl-4">
              <div className="bg-gray-900 text-white p-2 rounded-lg">
                <Home size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">For Sellers</h3>
            </div>

            {sellerSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-5 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 lg:ml-4"
              >
                <div className="flex-shrink-0 bg-lime-400 text-gray-900 p-3 rounded-xl shadow-sm">
                  {step.icon}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
