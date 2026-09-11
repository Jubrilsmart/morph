import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Feature from "../components/Feature";
import Category from "@/components/CategoriesSection";
import Formats from "@/components/FormatSection";
import Timeline from "@/components/TimelineSection";
import FAQ from "@/components/FAQSection";
import InstallCTACard from "@/components/InstallCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-3 md:px-4 items-center justify-between bg-background max-w-screen">
      <Navbar />
      <Hero />
      <Feature />
      <Category />
      <Formats />
      <Timeline />
      <FAQ />
      <InstallCTACard />
      <Footer />
    </div>
  );
}
