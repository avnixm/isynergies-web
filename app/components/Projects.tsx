'use client';

import { useEffect, useMemo, useState } from 'react';
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
    return 'Tools';
  }, [view]);

  return (
    <section id="projects" className="relative bg-[#D7E1E4] py-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        <div className="text-center font-sans">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {headerTitle}
          </h2>

          {/* view toggle (like the reference) */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setView('all')}
              className={[
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-colors',
                view === 'all'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-white/70',
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
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-colors',
                view === 'desktop'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-white/70',
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
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-colors',
                view === 'mobile'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-white/70',
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
                'h-10 w-10 rounded-full border backdrop-blur-sm transition-colors',
                view === 'tools'
                  ? 'border-white/40 bg-gradient-to-b from-[#2C68D8] to-[#0D1E66] text-white shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
                  : 'border-black/10 bg-white/50 text-gray-700 hover:bg-white/70',
              ].join(' ')}
              aria-label="Tools"
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
              <div className="projects-marquee-row">
              {/* Top row starts ahead by ~half a card */}
              <div className="projects-marquee-track -ml-[480px] sm:-ml-[570px] md:-ml-[660px]">
                {marqueeRow1.map((p, idx) => (
                  <button
                    key={`r1-${p.id}-${idx}`}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="group relative aspect-[16/9] w-[320px] sm:w-[380px] md:w-[440px] overflow-hidden rounded-2xl text-left shadow-[0_12px_26px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
            <div className="projects-marquee-row mt-5">
              <div className="projects-marquee-track">
                {marqueeRow2.map((p, idx) => (
                  <button
                    key={`r2-${p.id}-${idx}`}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="group relative aspect-[16/9] w-[320px] sm:w-[380px] md:w-[440px] overflow-hidden rounded-2xl text-left shadow-[0_12px_26px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                className="group relative h-[230px] md:h-[250px] w-full overflow-hidden rounded-2xl text-left shadow-[0_12px_26px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-in-out hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1E66]/60"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
            onClick={() => setSelected(null)}
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
                <div className="text-4xl font-bold">{selected.title}</div>
                <div className="mt-2 text-sm text-gray-700">
                  {selected.subtitle}
                </div>
                <div className="text-sm text-gray-700">{selected.year}</div>

                <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-800">
                  {selected.description.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
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
              onClick={() => setSelected(null)}
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
    </section>
  );
}


