import React, { useState } from "react";
import { PlusCircle, Menu, Disc } from "lucide-react";
import { Link } from "react-router";

const Hero: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Header Section */}
      <header className="relative w-full h-screen overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury Home"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />

        {/* Overlay Navbar */}
        <nav className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-8 py-5 bg-transparent">
          {/* Left Nav Links */}
          {/*<ul className="hidden md:flex items-center gap-6 text-white font-normal text-sm tracking-wide">
            <li>
              <a href="#about" className="hover:text-lime-300 transition">
                About Us
              </a>
            </li>
            <li>
              <a href="#listing" className="hover:text-lime-300 transition">
                Listing
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-lime-300 transition">
                Features
              </a>
            </li>
            <li>
              <a href="#blogs" className="hover:text-lime-300 transition">
                Blogs
              </a>
            </li>
          </ul>*/}

          {/* Center Logo (absolutely centered) */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl font-bold text-white tracking-wider uppercase">
              Reliabuy
            </h1>
          </div>

          {/* Right Button */}
          <div className="hidden md:block">
            <Link
              to="/login"
              className="flex items-center gap-2 bg-lime-400 text-gray-900 px-4 py-2 rounded-lg font-semibold text-xs hover:bg-lime-500 transition shadow-md"
            >
              Get Started
              <PlusCircle size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={28} />
          </button>
        </nav>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-6">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl">
            Find Your Perfect Home
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
            Discover properties tailored to your lifestyle and needs.
          </p>
          <Link
            to="/home"
            className="bg-lime-400 text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-lime-500 transition-transform hover:scale-105"
          >
            Explore Listings
          </Link>
        </div>
      </header>

      {/* Floating Tag */}
      <a
        href="https://github.com/KeremVona/reliabuy"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full shadow-2xl hover:bg-indigo-600 transition-all duration-300 z-50 backdrop-blur-md border border-white/20"
      >
        <span className="text-sm font-medium">Github</span>
        <Disc size={20} />
      </a>
    </div>
  );
};

export default Hero;
