import { Link, useNavigate } from "react-router";

const Navbar = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <header className="lg:px-16 px-4 bg-white flex flex-wrap items-center py-4 shadow-md">
      <div className="flex-1 flex justify-between items-center">
        <Link to="/home" className="text-xl">
          Reliabuy
        </Link>
      </div>

      <label htmlFor="menu-toggle" className="pointer-cursor md:hidden block">
        <svg
          className="fill-current text-gray-900"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
        >
          <title>menu</title>
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
        </svg>
      </label>
      <input className="hidden" type="checkbox" id="menu-toggle" />

      <div
        className="hidden md:flex md:items-center md:w-auto w-full"
        id="menu"
      >
        <nav>
          <ul className="md:flex items-center justify-between text-base text-gray-700 pt-4 md:pt-0">
            <li>
              <Link to="/saved" className="md:p-4 py-3 px-0 block">
                Saved Properties
              </Link>
            </li>
            <li>
              <Link to="/offers" className="md:p-4 py-3 px-0 block">
                Offers
              </Link>
            </li>
            <li>
              <Link className="md:p-4 py-3 px-0 block" to="/publish">
                Publish
              </Link>
            </li>
            <li>
              <Link className="md:p-4 py-3 px-0 block" to="/my-listings">
                My Listings
              </Link>
            </li>
            <li>
              <button
                onClick={handleClick}
                className="md:p-4 py-3 px-0 block md:mb-0 mb-2"
              >
                Log Out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
