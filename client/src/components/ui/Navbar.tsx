import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Heart,
  Inbox,
  LayoutDashboard,
  Plus,
  LogOut,
} from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Helper function to check active path
  const isActive = (path: string) => location.pathname === path;

  // Navigation Links Data Array for cleaner mapping
  const navLinks = [
    { name: "Saved", path: "/saved", icon: <Heart size={18} /> },
    { name: "Offers", path: "/offers", icon: <Inbox size={18} /> },
    {
      name: "My Listings",
      path: "/my-listings",
      icon: <LayoutDashboard size={18} />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/home" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <Home size={20} className="text-lime-400" />
              </div>
              <span className="text-2xl font-extrabold tracking-wider uppercase text-gray-900">
                Reliabuy
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                  isActive(link.path)
                    ? "text-lime-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/publish"
              className="flex items-center gap-2 bg-lime-400 text-gray-900 px-5 py-2.5 rounded-xl font-bold hover:bg-lime-500 transition-all hover:-translate-y-0.5 shadow-sm active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Publish
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Log Out"
              id="logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-gray-900 p-2 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 animate-in slide-in-from-top-2">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold uppercase tracking-widest ${
                  isActive(link.path)
                    ? "bg-lime-50 text-lime-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3">
              <Link
                to="/publish"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-lime-400 text-gray-900 px-4 py-4 rounded-xl font-bold hover:bg-lime-500 transition-colors"
              >
                <Plus size={20} strokeWidth={3} />
                Publish Property
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                id="logout"
                className="flex items-center justify-center gap-2 w-full text-left px-4 py-4 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
