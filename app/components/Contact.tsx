'use client';

import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    email: '',
    contactNo: '',
    name: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="relative bg-gray-100 py-8">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.42fr_0.58fr] gap-0 rounded-xl shadow-2xl overflow-hidden">
          {/* Left Panel - Contact Information */}
          <div className="relative bg-[#7A0D1A] text-white p-8 md:p-10 lg:p-12 overflow-hidden">
            {/* Semi-transparent S logo in background */}
            <div className="absolute right-[-60px] top-[-40px] text-[400px] font-black leading-none text-[#8A1E2A]/30 select-none pointer-events-none">
              S
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold mb-10 font-sans leading-tight">
                Let's get
                <br />
                in touch
              </h2>

              <div className="space-y-5 font-sans">
                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-base md:text-lg">
                    105 Maharlika Highway, Cabanatuan City, Philippines
                  </p>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <p className="text-base md:text-lg">(044) 329 2400</p>
                </div>

                {/* Facebook */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-base md:text-lg">facebook.com/isynergiesinc</p>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-base md:text-lg">infoho@isynergiesinc.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Contact Form */}
          <div className="bg-white px-8 py-10 md:px-10 md:py-12 flex items-center">
            <div className="w-full max-w-xl ml-auto">
              <h3 className="text-3xl md:text-[32px] font-bold text-gray-800 mb-6 font-sans">
                Send us a message
              </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email and Contact No. Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm"
                    placeholder="Email"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="contactNo"
                    className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                  >
                    Contact No.
                  </label>
                  <input
                    type="tel"
                    id="contactNo"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm"
                    placeholder="Contact No."
                    required
                  />
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm"
                  placeholder="Name"
                  required
                />
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm resize-none"
                  placeholder="Message"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold text-white font-sans transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  Send Message
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

