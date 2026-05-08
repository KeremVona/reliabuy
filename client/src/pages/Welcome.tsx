import FeatureHighlights from "../components/welcome/FeatureHighlights";
import Footer from "../components/welcome/Footer";
import Hero from "../components/welcome/Hero";
import HowItWorks from "../components/welcome/HowItWorks";
import TrendingProperties from "../components/welcome/TrendingProperties";
import ValueProposition from "../components/welcome/ValueProposition";

const Welcome = () => {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeatureHighlights />
      <TrendingProperties />
      <ValueProposition />
      <Footer />
    </>
  );
};

export default Welcome;
