import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router";

// TODO:
// Handle error handling

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

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
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gray-100 flex h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white shadow-md rounded-md p-6">
          <img
            className="mx-auto h-12 w-auto"
            src="https://www.svgrepo.com/show/499664/user-happy.svg"
            alt="User Icon"
          />

          <h2 className="my-3 text-center text-3xl font-bold tracking-tight text-gray-900">
            Hoşgeldin
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange(e)}
                required
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Şifre
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => handleChange(e)}
                  required
                  className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm pr-10"
                />

                {/* Toggle button inside input */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <Link
              to="/register"
              className="text-sm font-thin text-gray-800 hover:underline mt-2 inline-block hover:text-indigo-600"
            >
              Bir hesabın yok mu? {"←"}
            </Link>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent 
                           bg-sky-400 py-2 px-4 text-sm font-medium text-white shadow-sm 
                           hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-sky-400 
                           focus:ring-offset-2"
              >
                Giriş yap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
