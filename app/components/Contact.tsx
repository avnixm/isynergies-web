'use client';

import { useState, useEffect } from 'react';
import { Message } from '@mynaui/icons-react';
import { useToast } from './ui/toast';

type SiteSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyFacebook: string;
  companyLat?: number | string;
  companyLng?: number | string;
};


const GOOGLE_MAP_LAT = 15.488669777135174;
const GOOGLE_MAP_LNG = 120.97511917033088;
const GOOGLE_MAP_ZOOM = 17;
const GOOGLE_MAP_EMBED = `https://www.google.com/maps?q=${GOOGLE_MAP_LAT},${GOOGLE_MAP_LNG}&z=${GOOGLE_MAP_ZOOM}&output=embed`;
const GOOGLE_MAP_LINK = `https://www.google.com/maps?q=${GOOGLE_MAP_LAT},${GOOGLE_MAP_LNG}`;

export default function Contact() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    contactNo: '',
    name: '',
    message: '',
    wantsDemo: false,
    demoMonth: '',
    demoDay: '',
    demoYear: '',
    demoTime: '',
  });
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: 'iSynergies Inc.',
    companyAddress: 'ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija',
    companyPhone: '+63 123 456 7890',
    companyEmail: 'info@isynergies.com',
    companyFacebook: 'https://facebook.com/isynergies',
  companyLat: 15.488563,
  companyLng: 120.975303,
  });
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Validate phone number: exactly 11 digits starting with "09"
  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 0) {
      setPhoneError('');
      return false;
    }
    if (digitsOnly.length !== 11) {
      setPhoneError('Phone number must be exactly 11 digits');
      return false;
    }
    if (!digitsOnly.startsWith('09')) {
      setPhoneError('Phone number must start with 09');
      return false;
    }
    setPhoneError('');
    return true;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/site-settings');
        if (response.ok) {
          const data = await response.json();
          
          
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    const digitsOnly = formData.contactNo.replace(/\D/g, '');
    if (!validatePhone(formData.contactNo) || digitsOnly.length !== 11) {
      toast.error('Please enter a valid phone number (11 digits starting with 09)');
      return;
    }

    // Validate demo fields if wantsDemo is true
    if (formData.wantsDemo) {
      if (!formData.demoMonth || !formData.demoDay || !formData.demoYear || !formData.demoTime) {
        toast.error('Please fill in all demo date and time fields');
        return;
      }
      
      
      const selectedDate = new Date(
        parseInt(formData.demoYear),
        parseInt(formData.demoMonth) - 1,
        parseInt(formData.demoDay)
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.error('Please select a date that is today or in the future');
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          email: '',
          contactNo: '',
          name: '',
          message: '',
          wantsDemo: false,
          demoMonth: '',
          demoDay: '',
          demoYear: '',
          demoTime: '',
        });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Filter phone number to only allow digits
    if (e.target.name === 'contactNo') {
      value = value.replace(/\D/g, ''); // Remove all non-digits
      validatePhone(value);
    }
    
    // Filter name to only allow letters, spaces, hyphens, and apostrophes
    if (e.target.name === 'name') {
      value = value.replace(/[^a-zA-Z\s'-]/g, ''); // Only allow letters, spaces, hyphens, apostrophes
    }
    
    // Reset day when month or year changes
    const updates: any = {
      ...formData,
      [e.target.name]: value,
    };
    
    if (e.target.name === 'demoMonth' || e.target.name === 'demoYear') {
      updates.demoDay = ''; // Reset day selection when month or year changes
    }
    
    setFormData(updates);
  };

  const handleWantsDemoChange = (wantsDemo: boolean) => {
    if (wantsDemo) {
      // Set defaults to current date
      const today = new Date();
      const currentYear = today.getFullYear().toString();
      const currentMonth = (today.getMonth() + 1).toString(); // getMonth() returns 0-11
      const currentDay = today.getDate();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      // If today is a weekday, use today. If weekend, find next weekday
      let defaultDay = currentDay;
      if (dayOfWeek === 0) {
        // Sunday, set to Monday (next day)
        defaultDay = currentDay + 1;
      } else if (dayOfWeek === 6) {
        // Saturday, set to Monday (2 days later)
        defaultDay = currentDay + 2;
      }
      
      // If the default day exceeds the month, find the first weekday in the current month
      // (The day selector will filter to show only future weekdays anyway)
      if (defaultDay > daysInMonth) {
        // Find first weekday in current month
        for (let day = 1; day <= daysInMonth; day++) {
          const testDate = new Date(today.getFullYear(), today.getMonth(), day);
          const testDayOfWeek = testDate.getDay();
          if (testDayOfWeek >= 1 && testDayOfWeek <= 5) {
            defaultDay = day;
            break;
          }
        }
      }
      
      setFormData({
        ...formData,
        wantsDemo,
        demoYear: currentYear,
        demoMonth: currentMonth,
        demoDay: defaultDay.toString(),
        demoTime: '',
      });
    } else {
      // Reset demo fields when toggling off
      setFormData({
        ...formData,
        wantsDemo,
        demoMonth: '',
        demoDay: '',
        demoYear: '',
        demoTime: '',
      });
    }
  };

  // Get available days for selected month/year (Monday to Friday only, no past dates)
  const getAvailableDays = () => {
    if (!formData.demoMonth || !formData.demoYear) return [];
    
    const month = parseInt(formData.demoMonth);
    const year = parseInt(formData.demoYear);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: number[] = [];
    
    // Get today's date (set to start of day for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      const dayOfWeek = date.getDay(); 
      
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && date >= today) {
        days.push(day);
      }
    }
    
    return days;
  };

  
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let i = 0; i <= 5; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  
  const getTimeSlots = () => {
    const slots: string[] = [];
    
    for (let hour = 9; hour <= 12; hour++) {
      if (hour === 12) {
        slots.push('12:00 PM');
      } else {
        slots.push(`${hour}:00 AM`);
        slots.push(`${hour}:30 AM`);
      }
    }
    
    for (let hour = 1; hour <= 5; hour++) {
      slots.push(`${hour}:00 PM`);
      if (hour < 5) {
        slots.push(`${hour}:30 PM`);
      }
    }
    return slots;
  };

  return (
    <section id="contact" aria-label="Contact us" className="relative bg-[#D7E1E4] py-6 sm:py-8 md:py-10">
      {}
      <div className="absolute bottom-0 right-4 sm:right-6 md:right-12 w-28 h-28 sm:w-36 sm:h-36 md:w-64 md:h-64 flex items-center justify-center opacity-10 pointer-events-none z-0">
        <Message className="w-full h-full text-gray-900" strokeWidth={1} />
      </div>
      <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 lg:px-16 pb-4 md:pb-20 pt-0 md:pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[0.42fr_0.58fr] gap-0 rounded-xl overflow-hidden p-2 sm:p-3 md:p-4">
          {}
          <div className="relative bg-[#A00000] text-white p-4 sm:p-5 md:p-6 lg:p-10 overflow-hidden">
            {}
            <div className="absolute right-[-30px] sm:right-[-40px] md:right-[-60px] top-[-20px] sm:top-[-30px] md:top-[-40px] text-[180px] sm:text-[260px] md:text-[400px] font-black leading-none text-[#A00000]/25 select-none pointer-events-none">
              S
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 font-sans leading-tight">
                Let's get
                <br />
                in touch
              </h2>

              <div className="space-y-3 sm:space-y-4 font-sans">
                {}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
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
                  <p className="text-[11px] sm:text-xs leading-relaxed">
                    {settings.companyAddress}
                  </p>
                </div>

                {}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
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
                  <p className="text-[11px] sm:text-xs leading-relaxed">{settings.companyPhone}</p>
                </div>

                {}
                {settings.companyFacebook && (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
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
                    <p className="text-[11px] sm:text-xs leading-relaxed break-all">
                      {settings.companyFacebook
                        .replace('https://', '')
                        .replace('http://', '')}
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
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
                  <p className="text-[11px] sm:text-xs leading-relaxed break-all">{settings.companyEmail}</p>
                </div>
                {((settings.companyLat && settings.companyLng) || settings.companyAddress) && (
                  <div className="mt-3 sm:mt-4">
                    <div className="w-full h-32 sm:h-40 md:h-56 rounded-lg overflow-hidden border border-white/20">
                      <iframe
                        title="Company location"
                        src={GOOGLE_MAP_EMBED}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                    <a
                      href={GOOGLE_MAP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] sm:text-xs text-white underline mt-1.5 sm:mt-2 inline-block touch-manipulation"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="bg-white px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 flex items-center">
            <div className="w-full max-w-xl ml-0 lg:ml-auto">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 font-sans">
                Send us a message
              </h3>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm touch-manipulation"
                    placeholder="Email"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="contactNo"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                  >
                    Contact No.
                  </label>
                  <input
                    type="tel"
                    id="contactNo"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleChange}
                    maxLength={11}
                    className={`w-full px-3 py-2.5 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm touch-manipulation ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="09XXXXXXXXX"
                    required
                  />
                  {phoneError && (
                    <p className="text-[11px] sm:text-xs text-red-600 mt-1">{phoneError}</p>
                  )}
                  {!phoneError && formData.contactNo && (
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Format: 11 digits starting with 09</p>
                  )}
                </div>
              </div>

              {}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm touch-manipulation"
                  placeholder="Name"
                  required
                />
              </div>

              {}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans">
                  Would you like to book a demo?
                </label>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center cursor-pointer touch-manipulation">
                    <input
                      type="radio"
                      name="wantsDemo"
                      checked={formData.wantsDemo === true}
                      onChange={() => handleWantsDemoChange(true)}
                      className="w-4 h-4 text-[#7A0D1A] focus:ring-2 focus:ring-[#7A0D1A] border-gray-300"
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-700 font-sans">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer touch-manipulation">
                    <input
                      type="radio"
                      name="wantsDemo"
                      checked={formData.wantsDemo === false}
                      onChange={() => handleWantsDemoChange(false)}
                      className="w-4 h-4 text-[#7A0D1A] focus:ring-2 focus:ring-[#7A0D1A] border-gray-300"
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-700 font-sans">No</span>
                  </label>
                </div>
              </div>

              {}
              {formData.wantsDemo && (
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {}
                    <div>
                      <label
                        htmlFor="demoMonth"
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                      >
                        Month
                      </label>
                      <select
                        id="demoMonth"
                        name="demoMonth"
                        value={formData.demoMonth}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm touch-manipulation"
                        required={formData.wantsDemo}
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>

                    {}
                    <div>
                      <label
                        htmlFor="demoDay"
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                      >
                        Day
                      </label>
                      <select
                        id="demoDay"
                        name="demoDay"
                        value={formData.demoDay}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm disabled:bg-gray-100 disabled:cursor-not-allowed touch-manipulation"
                        required={formData.wantsDemo}
                        disabled={!formData.demoMonth}
                      >
                        <option value="">Select Day</option>
                        {getAvailableDays().map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      {formData.demoMonth && formData.demoYear && getAvailableDays().length === 0 && (
                        <p className="text-[11px] sm:text-xs text-red-600 mt-1">No available weekdays in this month (past dates excluded)</p>
                      )}
                    </div>

                    {}
                    <div className="sm:col-span-2 md:col-span-1">
                      <label
                        htmlFor="demoYear"
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                      >
                        Year
                      </label>
                      <select
                        id="demoYear"
                        name="demoYear"
                        value={formData.demoYear}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm disabled:bg-gray-100 disabled:cursor-not-allowed touch-manipulation"
                        required={formData.wantsDemo}
                        disabled={true}
                      >
                        {formData.demoYear && (
                          <option value={formData.demoYear}>
                            {formData.demoYear}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  {}
                  <div>
                    <label
                      htmlFor="demoTime"
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                    >
                      Time
                    </label>
                    <select
                      id="demoTime"
                      name="demoTime"
                      value={formData.demoTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm touch-manipulation"
                      required={formData.wantsDemo}
                    >
                      <option value="">Select Time</option>
                      {getTimeSlots().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 font-sans"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 sm:px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0D1A] focus:border-transparent text-gray-900 font-sans text-sm resize-none min-h-[100px] sm:min-h-[120px] touch-manipulation"
                  placeholder="Message"
                  required
                />
              </div>

              {}
              <div className="pt-1 sm:pt-2">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full px-6 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-semibold text-white font-sans transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
                    style={{
                      background: '#0D1E66',
                    }}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

