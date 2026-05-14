import React from "react";
import { Mail, Code2 } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-gray-950 pt-20 pb-8 border-t border-gray-800"
      id="contact"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white tracking-wider uppercase mb-4">
              Reliabuy
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              The smartest way to buy, sell, and track real estate. Skip the
              middleman and take control of your property journey.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Platform
            </h3>
            <ul className="flex flex-col gap-3 text-gray-400">
              <li>
                <a
                  href="/search"
                  className="hover:text-lime-400 transition-colors"
                >
                  Global Search
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/listings"
                  className="hover:text-lime-400 transition-colors"
                >
                  My Listings
                </a>
              </li>
              <li>
                <a
                  href="/dashboard/saved"
                  className="hover:text-lime-400 transition-colors"
                >
                  Saved Homes
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="hover:text-lime-400 transition-colors"
                >
                  Login / Register
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Support
            </h3>
            <ul className="flex flex-col gap-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-lime-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-lime-400 transition-colors">
                  Safety & Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-lime-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li className="flex items-center gap-2 mt-2">
                <Mail size={16} className="text-lime-500" />
                <a
                  href="mailto:support@realxt.com"
                  className="hover:text-lime-400 transition-colors"
                >
                  support@reliabuy.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Tech Credits */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">
              Architecture
            </h3>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 text-lime-400 mb-2">
                <Code2 size={18} />
                <span className="font-semibold text-sm">
                  Built for Performance
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Powered by a custom Node.js backend, raw SQL database, and
                strict JWT middleware for absolute data integrity.
              </p>
              <div className="text-xs text-gray-500 font-mono bg-gray-950 p-2 rounded border border-gray-800 inline-block">
                v1.0.0-beta
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {currentYear} Reliabuy. Developed by Commented Code. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
