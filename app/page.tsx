import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Shop", href: "#shop" },
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
      
      {/* About Us Section */}
      <AboutUs />
      
      {/* What We Do Section */}
      <WhatWeDo />
      
      {/* Board of Directors Section */}
      <BoardOfDirectors />
      
      {/* Services Section */}
      <Services />

      {/* Projects Section */}
      <Projects />

      {/* Featured App Section */}
      <FeaturedApp />

      {/* Our Team Section */}
      <Team />

      {/* Shop Section */}
      <Shop />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
      </div>
    </ToastProvider>
  );
}
