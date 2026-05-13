import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router";
import {
  User,
  Mail,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

// TODO:
// Handle error handling

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    fullname: "",
    password: "",
    confirm_password: "",
    city: "",
    isBuyer: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isSent, setIsSent] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/home");
    }
  }, [isSent]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    console.log("Sending to the backend: ", formData);

    setError(null);
    setIsLoading(true);

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
      );

      const { jwtToken } = response.data;
      localStorage.setItem("token", jwtToken);
      setIsSent(true);
    } catch (err: any) {
      const responseData = err.response?.data;

      // 1. Handle Zod validation error arrays
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Maps through the array and joins all Zod messages with a bullet or newline
        const errorMessages = responseData.errors
          .map((errItem: any) => errItem.message || errItem)
          .join(" • ");
        setError(errorMessages);
      }
      // 2. Handle standard string errors
      else if (responseData?.message) {
        setError(responseData.message);
      } else if (responseData?.error) {
        setError(responseData.error);
      }
      // 3. Fallback to generic network/code errors
      else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Kayıt işlemi sırasında beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (error) setError(null);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand/Logo Area */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-lime-400 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 hover:-rotate-3">
            <UserPlus size={32} className="text-gray-900" />
          </div>
        </div>

        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          Make an Account
        </h2>
        <p className="text-center text-gray-500 font-medium mb-8">
          Join Reliabuy to start your real estate journey.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-6 sm:px-12 shadow-xl sm:rounded-3xl border border-gray-100">
          {/* Error Banner */}
          {error && (
            <div className="mb-8 rounded-2xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">
                  Registration Failed
                </h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Full Name Input */}
              <div className="space-y-2">
                <label
                  htmlFor="fullname"
                  className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    value={formData?.fullname || ""}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              {/* City Input */}
              <div className="space-y-2">
                <label
                  htmlFor="city"
                  className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
                >
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData?.city || ""}
                    onChange={handleChange}
                    required
                    placeholder="Miami, FL"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData?.email || ""}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Password Inputs Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData?.password || ""}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData?.confirm_password || ""}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Account Type Checkbox (isBuyer) */}
            {/*<div className="pt-2">
              <label className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center h-6">
                  <input
                    id="isBuyer"
                    name="isBuyer"
                    type="checkbox"
                    checked={formData?.isBuyer || false}
                    onChange={handleChange}
                    className="w-5 h-5 text-lime-500 border-gray-300 rounded focus:ring-lime-500 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
                    I am looking to buy properties
                  </span>
                  <span className="text-sm text-gray-500">
                    Choose this if you mainly want to make offers rather than
                    list homes.
                  </span>
                </div>
              </label>
            </div>*/}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-gray-900 hover:text-lime-600 transition-colors inline-flex items-center gap-1 group"
              >
                <ArrowLeft
                  size={14}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
