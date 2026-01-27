'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Loading from './ui/loading';

type ProjectCategory = 'desktop' | 'mobile' | 'tools';

type Project = {
  id: string;
  title: string;
  year: string;
  subtitle: string;
  description: string;
  category: ProjectCategory;
  thumbnail?: string | null;
  screenshot1?: string | null;
  screenshot2?: string | null;
  screenshot3?: string | null;
  screenshot4?: string | null;
};

type ProjectView = 'all' | ProjectCategory;

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? ''}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryContactNo, setInquiryContactNo] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquiryPhoneError, setInquiryPhoneError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Demo request fields (project inquiry)
  const [inquiryWantsDemo, setInquiryWantsDemo] = useState(false);
  const [inquiryDemoMonth, setInquiryDemoMonth] = useState('');
  const [inquiryDemoDay, setInquiryDemoDay] = useState('');
  const [inquiryDemoYear, setInquiryDemoYear] = useState('');
  const [inquiryDemoTime, setInquiryDemoTime] = useState('');

  // Validate phone number: exactly 11 digits starting with "09"
  const validateInquiryPhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 0) {
      setInquiryPhoneError('');
      return false;
    }
    if (digitsOnly.length !== 11) {
      setInquiryPhoneError('Phone number must be exactly 11 digits');
      return false;
    }
    if (!digitsOnly.startsWith('09')) {
      setInquiryPhoneError('Phone number must start with 09');
      return false;
    }
    setInquiryPhoneError('');
    return true;
  };

  const handleInquiryWantsDemoChange = (wantsDemo: boolean) => {
    if (wantsDemo) {
      const today = new Date();
      const currentYear = today.getFullYear().toString();
      const currentMonth = (today.getMonth() + 1).toString();
      const currentDay = today.getDate();
      const dayOfWeek = today.getDay();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      let defaultDay = currentDay;
      if (dayOfWeek === 0) defaultDay = currentDay + 1;
      else if (dayOfWeek === 6) defaultDay = currentDay + 2;
      if (defaultDay > daysInMonth) {
        for (let day = 1; day <= daysInMonth; day++) {
          const testDate = new Date(today.getFullYear(), today.getMonth(), day);
          if (testDate.getDay() >= 1 && testDate.getDay() <= 5) {
            defaultDay = day;
            break;
          }
        }
      }
      setInquiryWantsDemo(true);
      setInquiryDemoYear(currentYear);
      setInquiryDemoMonth(currentMonth);
      setInquiryDemoDay(defaultDay.toString());
      setInquiryDemoTime('');
    } else {
      setInquiryWantsDemo(false);
      setInquiryDemoMonth('');
      setInquiryDemoDay('');
      setInquiryDemoYear('');
      setInquiryDemoTime('');
    }
  };

  const getInquiryAvailableDays = (): number[] => {
    if (!inquiryDemoMonth || !inquiryDemoYear) return [];
    const month = parseInt(inquiryDemoMonth);
    const year = parseInt(inquiryDemoYear);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && date >= today) days.push(day);
    }
    return days;
  };

  const getInquiryTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 12; hour++) {
      if (hour === 12) slots.push('12:00 PM');
      else { slots.push(`${hour}:00 AM`); slots.push(`${hour}:30 AM`); }
    }
    for (let hour = 1; hour <= 5; hour++) {
      slots.push(`${hour}:00 PM`);
      if (hour < 5) slots.push(`${hour}:30 PM`);
    }
    return slots;
  };

  const handleInquiryDemoChange = (field: 'demoMonth' | 'demoDay' | 'demoTime', value: string) => {
    if (field === 'demoMonth') {
      setInquiryDemoMonth(value);
      setInquiryDemoDay('');
    } else if (field === 'demoDay') {
      setInquiryDemoDay(value);
    } else {
      setInquiryDemoTime(value);
    }
  };
  
  // Fallback data
  const fallbackProjects: Project[] = useMemo(
    () => [
      {
        id: 'project-1',
        title: 'eCompacct',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'desktop',
      },
      {
        id: 'project-2',
        title: 'eCash',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'mobile',
      },
      {
        id: 'project-3',
        title: 'eStaff',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'mobile',
      },
      {
        id: 'project-4',
        title: 'askiLMS',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'desktop',
      },
      {
        id: 'project-5',
        title: 'Prototype',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'tools',
      },
      {
        id: 'project-6',
        title: 'Cover',
        year: '2026',
        subtitle: 'Lorem ipsum dolor sit amet',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.',
        category: 'desktop',
      },
    ],
    []
  );

  const [selected, setSelected] = useState<Project | null>(null);
  const [view, setView] = useState<ProjectView>('all');

  const filtered = useMemo(() => {
    if (view === 'all') return projects;
    return projects.filter((p) => p.category === view);
  }, [projects, view]);

  const marqueeItems = useMemo(() => {
    if (view !== 'all') return [];
    // duplicate for seamless loop (like ticker)
    return [...projects, ...projects];
  }, [projects, view]);

  const marqueeRow1 = useMemo(() => {
    if (view !== 'all') return [];
    // Top row: Show all projects in order, duplicated multiple times for seamless infinite loop
    // Repeat 4 times to ensure smooth looping (1,2,3,1,2,3,1,2,3,1,2,3)
    return [...projects, ...projects, ...projects, ...projects];
  }, [projects, view]);

  const marqueeRow2 = useMemo(() => {
    if (view !== 'all') return [];
    // Bottom row: Show all projects in order, duplicated multiple times for seamless infinite loop
    // Repeat 4 times to ensure smooth looping (1,2,3,1,2,3,1,2,3,1,2,3)
    return [...projects, ...projects, ...projects, ...projects];
  }, [projects, view]);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/admin/projects');
        if (response.ok) {
          const data = await response.json();
          // Sort by displayOrder (ascending)
          const sortedData = data.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
          setProjects(sortedData.map((p: any) => ({
            id: p.id.toString(),
            title: p.title,
            year: p.year,
            subtitle: p.subtitle,
            description: p.description,
            category: p.category as ProjectCategory,
            thumbnail: p.thumbnail,
            screenshot1: p.screenshot1,
            screenshot2: p.screenshot2,
            screenshot3: p.screenshot3,
            screenshot4: p.screenshot4,
          })));
        } else {
          setProjects(fallbackProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects(fallbackProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [fallbackProjects]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const resetInquiryState = () => {
    setShowInquiryForm(false);
    setInquiryName('');
    setInquiryEmail('');
    setInquiryContactNo('');
    setInquiryMessage('');
    setInquirySubmitting(false);
    setInquiryError(null);
    setInquiryPhoneError('');
    setInquiryWantsDemo(false);
    setInquiryDemoMonth('');
    setInquiryDemoDay('');
    setInquiryDemoYear('');
    setInquiryDemoTime('');
  };

  const handleCloseModal = () => {
    resetInquiryState();
    setSelected(null);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    // Validate phone number before submission
    const digitsOnly = inquiryContactNo.replace(/\D/g, '');
    if (!validateInquiryPhone(inquiryContactNo) || digitsOnly.length !== 11) {
      setInquiryError('Please enter a valid phone number (11 digits starting with 09)');
      return;
    }

    if (inquiryWantsDemo) {
      if (!inquiryDemoMonth || !inquiryDemoDay || !inquiryDemoYear || !inquiryDemoTime) {
        setInquiryError('Please fill in all demo date and time fields');
        return;
      }
      const selectedDate = new Date(
        parseInt(inquiryDemoYear),
        parseInt(inquiryDemoMonth) - 1,
        parseInt(inquiryDemoDay)
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setInquiryError('Please select a date that is today or in the future');
        return;
      }
    }

    setInquirySubmitting(true);
    setInquiryError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail,
          contactNo: inquiryContactNo,
          message: `Project inquiry about: ${selected.title}\n\n${inquiryMessage}`,
          projectId: Number.isNaN(Number(selected.id)) ? null : Number(selected.id),
          projectTitle: selected.title,
          wantsDemo: inquiryWantsDemo,
          demoMonth: inquiryWantsDemo ? inquiryDemoMonth : null,
          demoDay: inquiryWantsDemo ? inquiryDemoDay : null,
          demoYear: inquiryWantsDemo ? inquiryDemoYear : null,
          demoTime: inquiryWantsDemo ? inquiryDemoTime : null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorText = data?.error || 'Failed to send inquiry. Please try again.';
        setInquiryError(errorText);
      } else {
        // Close the project modal and show a dedicated success popup
        handleCloseModal();
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error sending project inquiry:', err);
      setInquiryError('An unexpected error occurred. Please try again later.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const headerTitle = useMemo(() => {
    if (view === 'all') return 'Our Work';
    if (view === 'desktop') return 'Desktop';
    if (view === 'mobile') return 'Mobile';
    return 'Hardware';
  }, [view]);

  return (
    <section id="projects" ref={sectionRef} className="relative bg-[#D7E1E4] py-5">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        <div className="text-center font-sans">
          <h2 className={`text-4xl md:text-5xl font-semibold text-gray-900 slide-down-slow ${
            isVisible ? 'animate' : 'opacity-0'
          }`}>
            {headerTitle}
          </h2>

          {/* view toggle (like the reference) */}
          <div className={`mt-4 flex items-center justify-center gap-3 slide-down-slow ${
            isVisible ? 'animate' : 'opacity-0'
          }`}
          style={{
            animationDelay: isVisible ? '0.3s' : '0s',
          }}>
            <button
              type="button"
              onClick={() => setView('all')}
              className={[
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-all duration-200',
                view === 'all'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-[#0D1E66] hover:text-white hover:scale-110 hover:shadow-md',
              ].join(' ')}
              aria-label="All"
            >
              <svg
                className="mx-auto h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="7" height="7" rx="1" />
                <rect x="13" y="4" width="7" height="7" rx="1" />
                <rect x="4" y="13" width="7" height="7" rx="1" />
                <rect x="13" y="13" width="7" height="7" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setView('desktop')}
              className={[
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-all duration-200',
                view === 'desktop'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-[#0D1E66] hover:text-white hover:scale-110 hover:shadow-md',
              ].join(' ')}
              aria-label="Desktop"
            >
              <svg
                className="mx-auto h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M8 20h8" />
                <path d="M12 16v4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setView('mobile')}
              className={[
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-all duration-200',
                view === 'mobile'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-[#0D1E66] hover:text-white hover:scale-110 hover:shadow-md',
              ].join(' ')}
              aria-label="Mobile"
            >
              <svg
                className="mx-auto h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setView('tools')}
              className={[
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-all duration-200',
                view === 'tools'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-[#0D1E66] hover:text-white hover:scale-110 hover:shadow-md',
              ].join(' ')}
              aria-label="Hardware"
            >
              <svg
                className="mx-auto h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14.7 6.3a4 4 0 0 0 3.9 6.9l-6.8 6.8a2 2 0 0 1-2.8 0l-5-5a2 2 0 0 1 0-2.8l6.8-6.8A4 4 0 0 0 14.7 6.3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid / Marquee */}
        {view === 'all' ? (
          loading ? (
            <div className="mt-10">
              <Loading message="Loading projects" size="lg" />
            </div>
          ) : (
            <div
              className="mt-10 projects-marquee relative left-1/2 w-screen -translate-x-1/2"
              style={
                {
                  ['--marquee-duration' as any]: '65s',
                  ['--marquee-offset' as any]: '-22s',
                } as React.CSSProperties
              }
            >
              {/* Row 1 */}
              <div className={`projects-marquee-row marquee-row-1 ${
                isVisible ? 'animate' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.5s' : '0s',
              }}>
              {/* Top row starts ahead by ~half a card */}
              <div 
                className="projects-marquee-track -ml-[178px] sm:-ml-[208px] md:-ml-[238px]"
                style={{
                  animationPlayState: 'running',
                  animationDelay: isVisible ? '3.0s' : '999s',
                }}
              >
                {marqueeRow1.map((p, idx) => (
                  <button
                    key={`r1-${p.id}-${idx}`}
                    type="button"
                    onClick={() => setSelected(p)}
                     className="group relative aspect-[16/9] w-[320px] sm:w-[380px] md:w-[440px] overflow-hidden rounded-2xl text-left transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
                    aria-haspopup="dialog"
                    aria-controls="project-modal"
                  >
                    {/* Thumbnail image if available */}
                    {p.thumbnail ? (
                      <>
                        <img
                          src={typeof p.thumbnail === 'string' && (p.thumbnail.startsWith('/api/images/') || p.thumbnail.startsWith('http'))
                            ? p.thumbnail 
                            : `/api/images/${p.thumbnail}`}
                          alt={p.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              idx % 4 === 0
                                ? 'linear-gradient(135deg, rgba(120,58,180,0.55) 0%, rgba(29,185,84,0.25) 45%, rgba(0,120,255,0.35) 100%)'
                                : idx % 4 === 1
                                  ? 'linear-gradient(135deg, rgba(0,120,255,0.50) 0%, rgba(0,0,0,0.15) 60%, rgba(255,255,255,0.10) 100%)'
                                  : idx % 4 === 2
                                    ? 'linear-gradient(135deg, rgba(0,180,120,0.50) 0%, rgba(0,0,0,0.10) 55%, rgba(255,255,255,0.10) 100%)'
                                    : 'linear-gradient(135deg, rgba(40,120,255,0.35) 0%, rgba(255,255,255,0.35) 55%, rgba(0,0,0,0.10) 100%)',
                          }}
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </>
                    )}
                    <div className="absolute right-4 top-4 z-10 rounded-full bg-black/25 p-2 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                      <ExternalIcon className="h-5 w-5" />
                    </div>
                    <span className="sr-only">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2 (ahead) */}
            <div className={`projects-marquee-row mt-5 marquee-row-2 ${
              isVisible ? 'animate' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.7s' : '0s',
            }}>
              <div 
                className="projects-marquee-track"
                style={{
                  animationPlayState: 'running',
                  animationDelay: isVisible ? '3.0s' : '999s',
                }}
              >
                {marqueeRow2.map((p, idx) => (
                  <button
                    key={`r2-${p.id}-${idx}`}
                    type="button"
                    onClick={() => setSelected(p)}
                     className="group relative aspect-[16/9] w-[320px] sm:w-[380px] md:w-[440px] overflow-hidden rounded-2xl text-left transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
                    aria-haspopup="dialog"
                    aria-controls="project-modal"
                  >
                    {/* Thumbnail image if available */}
                    {p.thumbnail ? (
                      <>
                        <img
                          src={typeof p.thumbnail === 'string' && (p.thumbnail.startsWith('/api/images/') || p.thumbnail.startsWith('http'))
                            ? p.thumbnail 
                            : `/api/images/${p.thumbnail}`}
                          alt={p.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              idx % 4 === 0
                                ? 'linear-gradient(135deg, rgba(120,58,180,0.55) 0%, rgba(29,185,84,0.25) 45%, rgba(0,120,255,0.35) 100%)'
                                : idx % 4 === 1
                                  ? 'linear-gradient(135deg, rgba(0,120,255,0.50) 0%, rgba(0,0,0,0.15) 60%, rgba(255,255,255,0.10) 100%)'
                                  : idx % 4 === 2
                                    ? 'linear-gradient(135deg, rgba(0,180,120,0.50) 0%, rgba(0,0,0,0.10) 55%, rgba(255,255,255,0.10) 100%)'
                                    : 'linear-gradient(135deg, rgba(40,120,255,0.35) 0%, rgba(255,255,255,0.35) 55%, rgba(0,0,0,0.10) 100%)',
                          }}
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </>
                    )}
                    <div className="absolute right-4 top-4 z-10 rounded-full bg-black/25 p-2 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                      <ExternalIcon className="h-5 w-5" />
                    </div>
                    <span className="sr-only">{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                 className="group relative h-[230px] md:h-[250px] w-full overflow-hidden rounded-2xl text-left transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
                aria-haspopup="dialog"
                aria-controls="project-modal"
              >
                {/* Thumbnail image if available */}
                {p.thumbnail ? (
                  <>
                    <img
                      src={typeof p.thumbnail === 'string' && (p.thumbnail.startsWith('/api/images/') || p.thumbnail.startsWith('http'))
                        ? p.thumbnail 
                        : `/api/images/${p.thumbnail}`}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          idx % 4 === 0
                            ? 'linear-gradient(135deg, rgba(120,58,180,0.55) 0%, rgba(29,185,84,0.25) 45%, rgba(0,120,255,0.35) 100%)'
                            : idx % 4 === 1
                              ? 'linear-gradient(135deg, rgba(0,120,255,0.50) 0%, rgba(0,0,0,0.15) 60%, rgba(255,255,255,0.10) 100%)'
                              : idx % 4 === 2
                                ? 'linear-gradient(135deg, rgba(0,180,120,0.50) 0%, rgba(0,0,0,0.10) 55%, rgba(255,255,255,0.10) 100%)'
                                : 'linear-gradient(135deg, rgba(40,120,255,0.35) 0%, rgba(255,255,255,0.35) 55%, rgba(0,0,0,0.10) 100%)',
                      }}
                    />
                    <div className="absolute inset-0 bg-black/5" />
                  </>
                )}

                <div className="absolute right-4 top-4 z-10 rounded-full bg-black/25 p-2 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                  <ExternalIcon className="h-5 w-5" />
                </div>

                <span className="sr-only">{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal with smooth GPU-accelerated animations */}
      {selected ? (
        <div
          id="project-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.title} details`}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
          style={{
            animation: 'fadeIn 0.15s ease-out',
            willChange: 'opacity'
          }}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close project details"
            onClick={handleCloseModal}
          />

          {/* Modal content */}
          <div 
            className="relative z-10 w-full max-w-6xl overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            style={{
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left panel */}
              <div className="bg-white p-10 font-sans text-gray-900">
                {!showInquiryForm ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                <div className="text-4xl font-bold">{selected.title}</div>
                <div className="mt-2 text-sm text-gray-700">
                  {selected.subtitle}
                </div>
                <div className="text-sm text-gray-700">{selected.year}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetInquiryState();
                          setShowInquiryForm(true);
                        }}
                        className="inline-flex items-center rounded-full bg-[#0D1E66] px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[#0b174d] transition-colors"
                      >
                        Inquire
                      </button>
                    </div>

                <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: selected.description }} />
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#0D1E66]">
                          Project Inquiry
                        </div>
                        <div className="mt-1 text-xl font-semibold text-gray-900">
                          {selected.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          Please fill out the form below and we&apos;ll reach out about this project.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInquiryForm(false)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <span className="text-sm leading-none">←</span>
                        <span>Back to details</span>
                      </button>
                    </div>

                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Name
                          </label>
                          <input
                            type="text"
                            required
                            value={inquiryName}
                            onChange={(e) => {
                              // Only allow letters, spaces, hyphens, and apostrophes
                              const filtered = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                              setInquiryName(filtered);
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={inquiryContactNo}
                          onChange={(e) => {
                            // Only allow digits
                            const filtered = e.target.value.replace(/\D/g, '');
                            setInquiryContactNo(filtered);
                            validateInquiryPhone(filtered);
                          }}
                          maxLength={11}
                          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30 ${
                            inquiryPhoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#0D1E66]'
                          }`}
                          placeholder="09XXXXXXXXX"
                        />
                        {inquiryPhoneError && (
                          <p className="text-xs text-red-600 mt-1">{inquiryPhoneError}</p>
                        )}
                        {!inquiryPhoneError && inquiryContactNo && (
                          <p className="text-xs text-gray-500 mt-1">Format: 11 digits starting with 09</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Message
                        </label>
                        <textarea
                          required
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[100px] resize-y focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30"
                          placeholder="Tell us more about your needs or questions regarding this project..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Do you want a demo?
                        </span>
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="inquiryWantsDemo"
                              checked={inquiryWantsDemo === true}
                              onChange={() => handleInquiryWantsDemoChange(true)}
                              className="w-4 h-4 text-[#0D1E66] focus:ring-2 focus:ring-[#0D1E66] border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="inquiryWantsDemo"
                              checked={inquiryWantsDemo === false}
                              onChange={() => handleInquiryWantsDemoChange(false)}
                              className="w-4 h-4 text-[#0D1E66] focus:ring-2 focus:ring-[#0D1E66] border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>

                      {inquiryWantsDemo && (
                        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Month
                              </label>
                              <select
                                value={inquiryDemoMonth}
                                onChange={(e) => handleInquiryDemoChange('demoMonth', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30"
                                required={inquiryWantsDemo}
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
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Day
                              </label>
                              <select
                                value={inquiryDemoDay}
                                onChange={(e) => handleInquiryDemoChange('demoDay', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required={inquiryWantsDemo}
                                disabled={!inquiryDemoMonth}
                              >
                                <option value="">Select Day</option>
                                {getInquiryAvailableDays().map((day) => (
                                  <option key={day} value={day}>
                                    {day}
                                  </option>
                                ))}
                              </select>
                              {inquiryDemoMonth && inquiryDemoYear && getInquiryAvailableDays().length === 0 && (
                                <p className="text-xs text-red-600 mt-1">No available weekdays in this month (past dates excluded)</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Year
                              </label>
                              <select
                                value={inquiryDemoYear}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled
                              >
                                {inquiryDemoYear && <option value={inquiryDemoYear}>{inquiryDemoYear}</option>}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                              Time
                            </label>
                            <select
                              value={inquiryDemoTime}
                              onChange={(e) => handleInquiryDemoChange('demoTime', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0D1E66] focus:outline-none focus:ring-2 focus:ring-[#0D1E66]/30"
                              required={inquiryWantsDemo}
                            >
                              <option value="">Select Time</option>
                              {getInquiryTimeSlots().map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {inquiryError && (
                        <p className="text-sm text-red-600">{inquiryError}</p>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={inquirySubmitting}
                          className="inline-flex items-center rounded-full bg-[#0D1E66] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0b174d] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        >
                          {inquirySubmitting ? 'Sending...' : 'Send Inquiry'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Right panel (dynamic screenshots) */}
              <div className="bg-gradient-to-r from-[#1A5BCF] to-[#0D1E66] p-8">
                <div className="grid grid-cols-2 gap-4">
                  {selected.screenshot1 && (
                    <div 
                      className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/15" 
                      style={{ 
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: '0.05s',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <img
                        src={typeof selected.screenshot1 === 'string' && (selected.screenshot1.startsWith('/api/images/') || selected.screenshot1.startsWith('http'))
                          ? selected.screenshot1 
                          : `/api/images/${selected.screenshot1}`}
                        alt={`${selected.title} screenshot 1`}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: 'translate3d(0, 0, 0)',
                          willChange: 'transform'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1.05, 1.05, 1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)'}
                      />
                    </div>
                  )}
                  {selected.screenshot2 && (
                    <div 
                      className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/15" 
                      style={{ 
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: '0.1s',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <img
                        src={typeof selected.screenshot2 === 'string' && (selected.screenshot2.startsWith('/api/images/') || selected.screenshot2.startsWith('http'))
                          ? selected.screenshot2 
                          : `/api/images/${selected.screenshot2}`}
                        alt={`${selected.title} screenshot 2`}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: 'translate3d(0, 0, 0)',
                          willChange: 'transform'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1.05, 1.05, 1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)'}
                      />
                    </div>
                  )}
                  {selected.screenshot3 && (
                    <div 
                      className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/15" 
                      style={{ 
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: '0.15s',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <img
                        src={typeof selected.screenshot3 === 'string' && (selected.screenshot3.startsWith('/api/images/') || selected.screenshot3.startsWith('http'))
                          ? selected.screenshot3 
                          : `/api/images/${selected.screenshot3}`}
                        alt={`${selected.title} screenshot 3`}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: 'translate3d(0, 0, 0)',
                          willChange: 'transform'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1.05, 1.05, 1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)'}
                      />
                    </div>
                  )}
                  {selected.screenshot4 && (
                    <div 
                      className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/15" 
                      style={{ 
                        animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: '0.2s',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <img
                        src={typeof selected.screenshot4 === 'string' && (selected.screenshot4.startsWith('/api/images/') || selected.screenshot4.startsWith('http'))
                          ? selected.screenshot4 
                          : `/api/images/${selected.screenshot4}`}
                        alt={`${selected.title} screenshot 4`}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                          transform: 'translate3d(0, 0, 0)',
                          willChange: 'transform'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1.05, 1.05, 1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)'}
                      />
                    </div>
                  )}
                  {/* Fill remaining slots with placeholders if needed */}
                  {Array.from({ length: Math.max(0, 4 - [selected.screenshot1, selected.screenshot2, selected.screenshot3, selected.screenshot4].filter(Boolean).length) }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="aspect-[16/10] w-full rounded-lg bg-white/10 ring-1 ring-white/15"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      {/* Success modal popup for inquiries */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
          aria-modal="true"
          role="dialog"
          aria-label="Inquiry sent successfully"
          style={{
            animation: 'fadeIn 0.18s ease-out',
            willChange: 'opacity',
          }}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
            aria-label="Close success message"
          />

          {/* Modal content */}
          <div
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            style={{
              animation: 'slideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Inquiry sent</h3>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-700">
              Your inquiry has been sent successfully. Our team will get back to you as soon as possible.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex items-center rounded-full bg-[#0D1E66] px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[#0b174d] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


