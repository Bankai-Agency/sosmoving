import Link from "next/link";

const quickLinks = [
  { label: "Free Estimate", href: "/free-estimate" },
  { label: "Book Online", href: "/book-online" },
  { label: "About Us", href: "/about-us" },
  { label: "Reviews", href: "/about-us/reviews" },
  { label: "FAQ", href: "/about-us/faq" },
  { label: "Contact Us", href: "/about-us/contact-us" },
  { label: "Company Policy", href: "/about-us/company-policy" },
  { label: "Blog", href: "/blog" },
];

const serviceLinks = [
  { label: "Apartment Movers", href: "/services/apartment-movers" },
  { label: "Commercial Movers", href: "/services/commercial-movers" },
  { label: "Long-Distance Movers", href: "/services/long-distance-movers" },
  { label: "Packing Services", href: "/services/packing-services" },
  { label: "White Glove Movers", href: "/services/white-glove-movers" },
  { label: "Storage", href: "/services/storage" },
  { label: "Local Movers", href: "/services/local-moving" },
];

const locationLinks = [
  { label: "Los Angeles Movers", href: "/los-angeles-movers" },
  { label: "Orange County Movers", href: "/orange-county-movers" },
  { label: "Portland Movers", href: "/portland-movers" },
  { label: "Seattle Movers", href: "/seattle-movers" },
  { label: "Denver Movers", href: "/denver-movers" },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-white/5 pt-12 pb-6">
      <div className="max-w-[940px] mx-auto px-4">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[2rem] h-[2rem] bg-accent rounded-sm flex items-center justify-center">
                <span className="text-black font-black text-[0.5rem]">SOS</span>
              </div>
              <span className="text-white font-bold text-sm">MOVING</span>
            </div>
            <div className="space-y-2 text-[0.7rem]">
              <a
                href="tel:+19094430004"
                className="block text-white hover:text-accent transition-colors"
              >
                909-443-0004
              </a>
              <a
                href="mailto:info@sosmovingla.net"
                className="block hover:text-accent transition-colors"
              >
                info@sosmovingla.net
              </a>
              <p>5530 Jillson Street, Los Angeles, CA 90040</p>
              <p>Monday - Sunday, 8AM - 6PM</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-[0.7rem] uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-[0.7rem] uppercase tracking-wider mb-4">
              Services
            </h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-white font-bold text-[0.7rem] uppercase tracking-wider mb-4">
              Locations
            </h4>
            <ul className="space-y-2">
              {locationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[0.6rem]">
            <p>
              &copy; {new Date().getFullYear()} SOS Moving & Storage. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>USDOT 3398018</span>
              <span>CAL-T0192140</span>
              <span>MC 1153871</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
