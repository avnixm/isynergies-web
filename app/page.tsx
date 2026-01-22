import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Shop", href: "#shop" },
  { label: "About Us", href: "#about" },
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
      {/* Hero Setion */}
      <Hero navLinks={navLinks} />
      
      {/* Featured App Section */}
      <FeaturedApp />

      {/* Services Section */}
      <Services />

      {/* What We Do Sectin */}
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

      {/* Divider between Team and Contact – inset line with left/right space; #2A2A2A default, lighter blue on hover */}
      <div className="group w-full py-2 cursor-default bg-[#D7E1E4] px-6 md:px-12 lg:px-16" role="separator">
        <div
          className="w-full h-0 border-t-2 border-[#2A2A2A] group-hover:border-[#2563eb] transition-colors duration-300"
          aria-hidden="true"
        />
      </div>

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
      </div>
    </ToastProvider>
  );
}
