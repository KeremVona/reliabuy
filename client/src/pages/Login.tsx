import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router";
import {
  Key,
  AlertCircle,
  Mail,
  Lock,
  EyeOff,
  Eye,
  ArrowRight,
} from "lucide-react";

// TODO:
// Handle error handling

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/verify",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.data();

        if (data.valid) {
          navigate("/home");
        } else {
          localStorage.removeItem("token");
        }
      } catch (err: any) {
        localStorage.removeItem("token");
        if (err instanceof Error) console.error(err.message);
      }
    };

    checkToken();
  }, [navigate]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
      );

      localStorage.setItem("token", response.data.jwtToken);

      setTimeout(() => {
        navigate("/home");
      }, 400);
    } catch (err: any) {
      const responseData = err.response?.data;

      // Catch the Zod error arrays seamlessly
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setError(responseData.errors.join(" • "));
      } else if (responseData?.message) {
        setError(responseData.message);
      } else if (responseData?.error) {
        setError(responseData.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("There was an error logging in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand/Logo Area */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl transform transition-transform hover:scale-105 hover:rotate-3">
            <Key size={32} className="text-lime-400" />
          </div>
        </div>

        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 font-medium mb-8">
          Sign in to manage your real estate portfolio.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 sm:px-12 shadow-xl sm:rounded-3xl border border-gray-100">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">
                  Authentication Failed
                </h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-900 uppercase tracking-widest"
                >
                  Password
                </label>
                {/* Optional: Forgot Password Link */}
                {/*
                <a
                  href="#"
                  className="text-xs font-bold text-gray-400 hover:text-lime-600 transition-colors"
                >
                  Forgot?
                </a>
                */}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData?.password || ""}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-lime-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                />

                {/* Toggle button inside input */}
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 px-6 rounded-xl shadow-lg text-lg font-bold transition-all duration-300 bg-lime-400 text-gray-900 hover:bg-lime-500 hover:shadow-lime-200 hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-400"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-gray-900 hover:text-lime-600 transition-colors inline-flex items-center gap-1 group"
              >
                Make one now
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
