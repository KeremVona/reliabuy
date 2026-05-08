import React from "react";
import { UserCheck, DatabaseZap, LayoutTemplate } from "lucide-react";

const ValueProposition: React.FC = () => {
  const values = [
    {
      title: "Verified Accounts",
      description:
        "Every listing and offer is tied to a secure, authenticated profile. Our rigorous custom middleware ensures you're always negotiating with real, verified users.",
      icon: <UserCheck size={28} />,
    },
    {
      title: "Absolute Data Integrity",
      description:
        "What you see is what's actually available. Our database syncs instantly to eliminate the frustration of 'ghost' listings that were sold or removed days ago.",
      icon: <DatabaseZap size={28} />,
    },
    {
      title: "Distraction-Free UI",
      description:
        "House hunting is stressful enough. We provide a pristine, ad-free environment—no pop-ups or clutter. Just properties, prices, and the data you care about.",
      icon: <LayoutTemplate size={28} />,
    },
  ];

  return (
    <section className="py-24 bg-gray-900 text-white" id="security">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Heading and Context */}
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Built on a foundation of{" "}
              <span className="text-lime-400">Trust & Security</span>.
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Underneath our sleek interface is a robust, custom-built
              infrastructure. We handle the complex plumbing—from secure token
              authentication to real-time data synchronization—so you can focus
              on finding your next home with absolute peace of mind.
            </p>

            {/* Optional: Trust Badge or Stat */}
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700 w-max">
              <div className="flex -space-x-3">
                {/* Decorative overlapping circles to represent users */}
                <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-gray-800"></div>
                <div className="w-10 h-10 rounded-full bg-gray-500 border-2 border-gray-800"></div>
                <div className="w-10 h-10 rounded-full bg-lime-500 border-2 border-gray-800 flex items-center justify-center text-gray-900 font-bold text-xs">
                  +1k
                </div>
              </div>
              <div className="text-sm">
                <p className="text-white font-semibold">Verified Users</p>
                <p className="text-gray-400 text-xs">Growing daily</p>
              </div>
            </div>
          </div>

          {/* Right Column: Value Points Grid */}
          <div className="flex flex-col gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex items-start gap-6 group">
                {/* Icon Container */}
                <div className="flex-shrink-0 w-14 h-14 bg-gray-800 text-lime-400 rounded-xl flex items-center justify-center border border-gray-700 group-hover:border-lime-400 group-hover:bg-lime-400/10 transition-colors duration-300">
                  {value.icon}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {value.description}
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

export default ValueProposition;
