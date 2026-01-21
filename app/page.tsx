import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Shop", href: "#shop" },
  { label: "About Us", href: "#about" },
  { label: "Login", href: "/admin/login" },
];

import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import WhatWeDo from './components/WhatWeDo';
import BoardOfDirectors from './components/BoardOfDirectors';
import Services from './components/Services';
import Projects from './components/Projects';
import FeaturedApp from './components/FeaturedApp';
import Team from './components/Team';
import Shop from './components/Shop';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { ToastProvider } from './components/ui/toast';

export default function Home() {
  return (
    <ToastProvider>
      <div className="relative text-white overflow-x-hidden max-w-full">
      {/* Hero Section */}
      <Hero navLinks={navLinks} />
      
      {/* Featured App Section */}
      <FeaturedApp />

      {/* Services Section */}
      <Services />

      {/* What We Do Section */}
      <WhatWeDo />

      {/* Projects Section */}
      <Projects />

      {/* Shop Section */}
      <Shop />

      {/* About Us Section */}
      <AboutUs />
      
      {/* Board of Directors Section */}
      <BoardOfDirectors />

      {/* Our Team Section */}
      <Team />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
      </div>
    </ToastProvider>
  );
}
