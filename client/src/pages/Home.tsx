import MakeProperty from "../components/property/MakeProperty";
import PropertiesList from "../components/property/PropertiesList";
import PropertySearch from "../components/property/PropertySearch";
import Navbar from "../components/ui/Navbar";

const Home = () => {
  return (
    <>
      <Navbar />
      <PropertySearch />
      <PropertiesList />
    </>
  );
};

export default Home;
