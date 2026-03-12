import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router";

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

    if (formData.password !== formData.confirm_password) {
      alert("Şifreler aynı değil!");
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
      if (err instanceof Error) {
        console.error(err.message);
      }
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
            Hesap oluştur
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Kullanıcı adı
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                onChange={(e) => handleChange(e)}
                required
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange(e)}
                required
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700"
              >
                Şifreyi doğrula
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                value={formData.confirm_password}
                onChange={(e) => handleChange(e)}
                required
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange(e)}
                required
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                isBuyer?
              </label>
              <input
                id="isBuyer"
                name="isBuyer"
                type="checkbox"
                checked={formData.isBuyer}
                onChange={(e) => handleChange(e)}
                className="px-2 py-3 mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                           focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
              />
            </div>

            <Link
              to="/login"
              className="text-sm font-thin text-gray-800 hover:underline mt-2 inline-block hover:text-indigo-600"
            >
              Bir hesabın var mı? {"←"}
            </Link>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent 
                           bg-sky-400 py-2 px-4 text-sm font-medium text-white shadow-sm 
                           hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-sky-400 
                           focus:ring-offset-2"
              >
                Kaydol
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
