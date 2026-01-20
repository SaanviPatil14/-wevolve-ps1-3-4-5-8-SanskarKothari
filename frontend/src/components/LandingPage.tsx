import React, { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Github,
  Linkedin,
  X,
  Mail,
  MapPin,
  Info,
} from "lucide-react";
import gsap from "gsap";

interface LandingPageProps {
  onStart: (view: "login" | "signup") => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const headerRef = useRef(null);
  const subtextRef = useRef(null);
  const buttonRef = useRef(null);
  const footerRef = useRef(null);

  // State for Modals
  const [activeModal, setActiveModal] = useState<"none" | "about" | "contact">(
    "none"
  );

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

      // --- FOOTER ANIMATION ---
      gsap.from(footerRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  // --- MODAL COMPONENT (Internal) ---
  const Modal = ({
    title,
    children,
    onClose,
  }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-[#FDFDFF] selection:bg-indigo-100 selection:text-indigo-900 font-sans relative flex flex-col">
      {/* --- RENDER MODALS --- */}
      {activeModal === "about" && (
        <Modal title="About Wevolve" onClose={() => setActiveModal("none")}>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p className="font-medium text-lg text-indigo-600">
              Redefining Recruitment for 2026 and Beyond.
            </p>
            <p>
              Wevolve is not just a job board. It is an intelligent career
              ecosystem designed to bridge the gap between talent and
              opportunity using advanced algorithmic matching.
            </p>
            <p>
              Our platform uses weighted scoring, skill gap analysis, and
              heuristic predictive modeling to ensure that every match is
              meaningful. We believe in transparency, growth, and the power of
              human potential.
            </p>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mt-4">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                <Info size={18} /> Our Mission
              </h4>
              <p className="text-sm text-indigo-800">
                To empower 1 million professionals to evolve their careers by
                providing the insights they need to succeed in a rapidly
                changing tech landscape.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === "contact" && (
        <Modal title="Contact Us" onClose={() => setActiveModal("none")}>
          <div className="space-y-6">
            <p className="text-slate-600 mb-4">
              Have questions or feedback? We'd love to hear from you. Fill out
              the form below and our team will get back to you within 24 hours.
            </p>

            {/* Contact Details */}
            <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl mb-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="shrink-0 text-indigo-600" size={18} />
                <span>
                  <strong>Wevolve HQ</strong>
                  <br />
                  42 Innovation Drive, Tech Park Sector 5,
                  <br />
                  Bangalore, Karnataka 560103, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="shrink-0 text-indigo-600" size={18} />
                <span>support@wevolve.com</span>
              </div>
            </div>

            {/* --- GOOGLE FORM EMBED --- */}
            <div className="w-full aspect-[4/5] md:aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSf4B9cWok1oJwCjjUiIIPH5er1xwrqs_D939Zb-6CEuQ9lWVg/viewform?embedded=true"
                width="100%"
                height="100%"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="w-full h-full"
              >
                Loading…
              </iframe>
            </div>
          </div>
        </Modal>
      )}

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
              onClick={() =>
                window.open(
                  "https://whatsapp.com/channel/0029VbCLPr5C6ZvZ1tKQkq1i",
                  "_blank"
                )
              }
              className="px-6 py-2.5 bg-[#25D366] text-white rounded-full text-sm font-black hover:bg-[#128C7E] transition-all hover:scale-105 shadow-xl shadow-green-100 flex items-center gap-2"
            >
              Join Channel
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
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
            WEVOLVE YOUR <br />
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
            © 2026 Wevolve. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            {/* Text Links */}
            <div className="flex gap-6 text-xs font-bold text-slate-400">
              <button
                onClick={() => setActiveModal("about")}
                className="hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => setActiveModal("contact")}
                className="hover:text-white transition-colors"
              >
                Contact
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-3 bg-slate-800 hidden md:block"></div>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="https://github.com/SaanviPatil14"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all duration-300"
              >
                <Github size={14} />
              </a>
              <a
                href="https://linkedin.com/in/sanskar-sachin-kothari-548a08240"
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
