"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const services = [
  { label: "All Services", href: "/services" },
  { label: "Apartment Movers", href: "/services/apartment-movers" },
  { label: "Commercial Movers", href: "/services/commercial-movers" },
  { label: "Long-Distance Movers", href: "/services/long-distance-movers" },
  { label: "Packing Services", href: "/services/packing-services" },
  { label: "White Glove Movers", href: "/services/white-glove-movers" },
  { label: "Storage", href: "/services/storage" },
  { label: "Local Movers", href: "/services/local-moving" },
];

const locations = [
  { label: "Los Angeles Movers", href: "/los-angeles-movers" },
  { label: "Orange County Movers", href: "/orange-county-movers" },
  { label: "Portland Movers", href: "/portland-movers" },
  { label: "Seattle Movers", href: "/seattle-movers" },
  { label: "Denver Movers", href: "/denver-movers" },
  { label: "Calabasas Movers", href: "/los-angeles-movers/calabasas-movers" },
];

const company = [
  { label: "About Us", href: "/about-us" },
  { label: "Blog", href: "/blog" },
  { label: "Reviews", href: "/about-us/reviews" },
  { label: "FAQ", href: "/about-us/faq" },
  { label: "Gallery", href: "/about-us/gallery" },
  { label: "Contact Us", href: "/about-us/contact-us" },
  { label: "Our Team", href: "/about-us/meet-our-team" },
  { label: "Refer Friends", href: "/about-us/referral" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
      <nav className="max-w-[940px] mx-auto px-4 flex items-center justify-between h-[3.5rem]">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/images/general/661fb80f63df1e16fb9dced9_Sos-logo-min.avif"
            alt="SOS Moving & Storage"
            width={120}
            height={40}
            className="h-[2rem] w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <NavDropdown
            label="Moving"
            items={services}
            active={activeDropdown === "moving"}
            onToggle={() =>
              setActiveDropdown(activeDropdown === "moving" ? null : "moving")
            }
          />
          <NavDropdown
            label="Locations"
            items={locations}
            active={activeDropdown === "locations"}
            onToggle={() =>
              setActiveDropdown(
                activeDropdown === "locations" ? null : "locations"
              )
            }
          />
          <NavDropdown
            label="Company"
            items={company}
            active={activeDropdown === "company"}
            onToggle={() =>
              setActiveDropdown(
                activeDropdown === "company" ? null : "company"
              )
            }
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/free-estimate"
            className="hidden sm:inline-flex bg-accent text-black font-bold text-xs px-4 py-2 rounded-full hover:bg-accent-hover transition-colors"
          >
            Get a Free Quote
          </Link>
          <a
            href="tel:+19094430004"
            className="flex items-center gap-1.5 text-white text-xs font-bold"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="hidden md:inline">909-443-0004</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden text-white p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/95 border-t border-white/5 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            <MobileSection title="Moving" items={services} />
            <MobileSection title="Locations" items={locations} />
            <MobileSection title="Company" items={company} />
            <Link
              href="/free-estimate"
              className="block bg-accent text-black font-bold text-center py-3 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NavDropdown({
  label,
  items,
  active,
  onToggle,
}: {
  label: string;
  items: { label: string; href: string }[];
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        className="text-white text-[0.7rem] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-accent transition-colors"
        onClick={onToggle}
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${active ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {active && (
        <div className="absolute top-full left-0 mt-2 bg-card-bg border border-white/10 rounded-lg py-2 min-w-[220px] shadow-xl">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-[0.7rem] text-white/80 hover:text-accent hover:bg-white/5 transition-colors"
              onClick={onToggle}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-white font-bold text-sm py-2"
        onClick={() => setOpen(!open)}
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pl-4 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-1.5 text-xs text-white/60 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
