import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoImg from '../../assets/images/Logo.jpg';

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', id: 'hero', path: '/#hero' },
    { label: 'Service', id: 'services', path: '/#services' },
    { label: 'About us', id: 'about-us', path: '/#about-us' },
    { label: 'Help & Support', id: 'help-support', path: '/#help-support' },
  ];

  const handleNavClick = (e, link) => {
    if (location.pathname === '/') {
      e.preventDefault();
      if (link.id === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
      } else {
        const elem = document.getElementById(link.id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${link.id}`);
        }
      }
    }
  };

  return (
    <header className="fixed top-7 left-0 right-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-grid-margin flex items-center justify-between gap-space-lg">
        <Link to="/" className="flex items-center gap-space-sm no-underline">
          <img alt="E-KAVACH Logo" className="h-9 w-auto object-contain rounded-md" src={LogoImg} />
          <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
            E-KAVACH
          </span>
          <span className="hidden xl:inline-flex items-center gap-space-2xs px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Emergency OS
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-space-md xl:gap-space-lg">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === '/' &&
              ((!location.hash && link.id === 'hero') || location.hash === `#${link.id}`);
            return (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className={`px-space-sm py-space-xs font-label-lg text-label-lg rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-space-sm">
          <a
            href="/#registration-card"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('ekavach:scroll-to-register'));
                window.history.pushState(null, '', '#registration-card');
              }
            }}
            className="inline-flex items-center justify-center px-space-lg py-space-xs rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-[0_1px_4px_rgba(0,53,76,0.12)] no-underline"
          >
            Get Your Health ID
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-surface-container px-grid-margin py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.path}
              onClick={(e) => {
                setMobileOpen(false);
                handleNavClick(e, link);
              }}
              className="px-3 py-2 rounded-lg font-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/patient/dashboard"
            onClick={() => setMobileOpen(false)}
            className="mt-2 text-center py-2 rounded-lg bg-secondary text-on-secondary font-label-lg"
          >
            Go to Patient Portal
          </Link>
        </div>
      )}
    </header>
  );
}
