import React, { useLayoutEffect, useRef } from "react";
import { ArrowRight, Github, Linkedin } from "lucide-react";
import gsap from "gsap";

interface LandingPageProps {
  onStart: (view: "login" | "signup") => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const headerRef = useRef(null);
  const subtextRef = useRef(null);
  const buttonRef = useRef(null);
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // --- HERO ANIMATIONS ---
      tl.from(headerRef.current, {
        x: -100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      })
        .from(
          subtextRef.current,
          {
            x: 100,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
          },
          "-=1"
        )
        .from(
          buttonRef.current,
          {
            scale: 0.8,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)",
          },
          "-=0.8"
        );

      // --- FOOTER ANIMATION (Slides up on load) ---
      gsap.from(footerRef.current, {
        y: 100, // Start below screen
        opacity: 0,
        duration: 1,
        delay: 0.5, // Wait for hero to start
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#FDFDFF] selection:bg-indigo-100 selection:text-indigo-900 font-sans relative flex flex-col">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
              W
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
              WEVOLVE
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={() => onStart("login")}
              className="text-sm font-bold text-slate-700 px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => onStart("signup")}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-black hover:bg-indigo-700 transition-all hover:scale-105 shadow-xl shadow-indigo-100"
            >
              Join Platform
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      {/* Added pb-32 to ensure content isn't hidden behind the fixed footer */}
      <header className="flex-1 relative pt-20 px-6 flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-50/50 via-white to-white pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-teal-200 rounded-full blur-[120px] opacity-20 animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center z-10">
          <h1
            ref={headerRef}
            className="text-6xl md:text-[100px] font-black text-slate-900 leading-[0.85] tracking-tight mb-8"
          >
            EVOLVE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">
              CAREER.
            </span>
          </h1>

          <p
            ref={subtextRef}
            className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            The next-generation matching engine designed to connect elite talent
            with high-performance teams through deep compatibility analysis.
          </p>

          <div ref={buttonRef} className="flex justify-center items-center">
            <button
              onClick={() => onStart("signup")}
              className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              Get Started Now <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* --- FIXED BOTTOM FOOTER --- */}
      <footer
        ref={footerRef}
        className="fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-900 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-slate-500 text-xs font-medium">
            © 2024 Wevolve. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {/* Text Links */}
            <div className="flex gap-6 text-xs font-bold text-slate-400">
              <button className="hover:text-white transition-colors">
                About
              </button>
              <button className="hover:text-white transition-colors">
                Contact
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-3 bg-slate-800 hidden md:block"></div>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all duration-300"
              >
                <Github size={14} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:text-white transition-all duration-300"
              >
                <Linkedin size={14} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
