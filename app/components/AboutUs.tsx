'use client';

import Image from 'next/image';

export default function AboutUs() {
  return (
      <section
        id="about"
        className="relative min-h-screen pb-5"
        style={{ backgroundColor: '#D7E1E4' }}
      >
        {/* Red circle gradient in top left - behind text */}
        <div 
          className="absolute top-60 left-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 z-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.3) 20%, rgba(220, 38, 38, 0.2) 40%, rgba(220, 38, 38, 0.15) 50%, rgba(220, 38, 38, 0.1) 60%, rgba(220, 38, 38, 0.05) 75%, transparent 100%)',
            filter: 'blur(40px)',
            WebkitFilter: 'blur(40px)',
          }}
        />
        
        {/* Right Side - Auto-scrolling Image Gallery (Extended to right edge) - Positioned relative to section */}
        <div className="absolute left-1/2 right-0 top-0 bottom-[60px] overflow-hidden z-0">
          <div className="scroll-animation h-full w-full">
            {/* First set of images */}
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team group photo"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="Team meeting and training"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Duplicate set for seamless loop */}
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team group photo"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="Team meeting and training"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full h-full overflow-hidden">
              <Image
                src="/aboutusgallery.png"
                alt="iSynergies team"
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-7xl h-screen flex items-center px-4 md:px-8 lg:px-16 relative z-10">
          <div className="w-full h-full flex relative">
            {/* Left Side - Text Content */}
            <div className="space-y-2 pr-4 md:pr-8 pt-20 flex-shrink-0 w-1/2 relative z-10 font-sans">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">About Us</h2>
              
              <div className="space-y-2 text-gray-900 text-xs leading-relaxed font-normal">
                <p>
                  Isynergies, Inc was established and officially registered with the Securities and Exchange Commission (SEC) on October 30, 2012 as Stock Corporation inline in Other Software and Consultancy and Supply industry.
                </p>
                
                <p>
                  The office is based in ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija.
                </p>
                
                <p>
                  iSynergies, Inc. is a strategic business unit of ASKI Group of Companies, Inc. responsible for providing hardware and software solutions. It also offers products and services to the public and is composed of the Marketing and Sales Unit, Software Development and Quality Assurance Unit, and System Technical and Network Administration Unit.
                </p>
                
                <p>
                  The <strong className="font-bold">Software Development</strong> unit creates web, mobile, and computer applications that help companies digitize manual processes and improve transaction speed and efficiency. The <strong className="font-bold">System Technical</strong> unit ensures network and hardware security through proper licensing, configurations, server maintenance, and the installation of security systems such as digital locks, biometrics, and CCTV. The <strong className="font-bold">Marketing and Sales</strong> unit provides essential hardware and software products, including computers, printers, software licenses, and mobile phones to support daily business operations.
                </p>
                
                <p>
                  Our team helps your IT to the next level. We make your IT plans possible.
                </p>
              </div>

              {/* Mission and Vision Boxes */}
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Our Mission</h3>
                  <p className="text-gray-900 text-[10px] leading-tight font-normal">
                    To provide Information Technology Solutions to clientele rendered by skilled and competent workforce.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Our Vision</h3>
                  <p className="text-gray-900 text-[10px] leading-tight font-normal">
                    A Trusted Partner of Every Businesses in Software and Hardware Technological Transformation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Red gradient bar at the bottom */}
        <div 
          className="absolute bottom-0 left-0 w-full h-15 z-10 flex items-center px-4 md:px-8 lg:px-16"
          style={{
            background: 'linear-gradient(to right, #DC2626 0%, rgba(220, 38, 38, 0.8) 30%, rgba(220, 38, 38, 0.4) 60%, transparent 100%)',
          }}
        >
          <p className="text-2xl md:text-3xl font-bold text-white mr-10">Our Board of Directors</p>
        </div>
      </section>
  );
}
