import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoImg from '../../assets/images/Logo.jpg';
import { useAuth } from '../../context/AuthContext';

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, login, logout } = useAuth();

  const navLinks = [
    { label: 'Home', id: 'hero', path: '/#hero' },
    { label: 'Process', id: 'about-us', path: '/#about-us' },
    { label: 'Care Continuum', id: 'services', path: '/#services' },
    { label: 'Help & Support', id: 'help-support', path: '/#help-support' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setPortalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleScrollToLogin = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('ekavach:scroll-to-login'));
      window.history.pushState(null, '', '#registration-card');
    } else {
      navigate('/#registration-card');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ekavach:scroll-to-login'));
      }, 150);
    }
  };

  const handleScrollToRegister = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('ekavach:scroll-to-register'));
      window.history.pushState(null, '', '#registration-card');
    } else {
      navigate('/#registration-card');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ekavach:scroll-to-register'));
      }, 150);
    }
  };

  const handlePortalNavigate = async (role, path) => {
    setPortalDropdownOpen(false);
    setMobileOpen(false);
    try {
      await login(role);
    } catch (_e) {}
    navigate(path);
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

          {/* Portals Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
              className="inline-flex items-center gap-1 px-space-sm py-space-xs font-label-lg text-label-lg rounded-lg text-primary hover:bg-primary-fixed/30 transition-colors font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>Portals</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {portalDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 z-50 flex flex-col gap-1 text-xs">
                <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-100">
                  Select Access Node
                </div>
                <button
                  type="button"
                  onClick={() => handlePortalNavigate('patient', '/patient/dashboard')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                  <div>
                    <div className="font-semibold text-slate-900">Patient Portal</div>
                    <div className="text-[11px] text-slate-400">Health ID, Records &amp; SOS</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalNavigate('doctor', '/doctor/dashboard')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">stethoscope</span>
                  <div>
                    <div className="font-semibold text-slate-900">Doctor Console</div>
                    <div className="text-[11px] text-slate-400">Emergency Scan &amp; Clinical Records</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalNavigate('hospital', '/admin/dashboard')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">domain</span>
                  <div>
                    <div className="font-semibold text-slate-900">Hospital Admin</div>
                    <div className="text-[11px] text-slate-400">Staff, Doctors &amp; Operations</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalNavigate('hospital', '/admin/emergency-ward')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 text-left transition-colors cursor-pointer border-t border-slate-100"
                >
                  <span className="material-symbols-outlined text-red-600 text-[18px]">emergency</span>
                  <div>
                    <div className="font-semibold text-red-900">Emergency Ward (ICU)</div>
                    <div className="text-[11px] text-red-500">Live Bed Grid &amp; Trauma Telemetry</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-space-xs sm:gap-space-sm">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                to={currentUser.dashboardRoute || (currentUser.role === 'doctor' ? '/doctor/dashboard' : currentUser.role === 'hospital' ? '/admin/dashboard' : '/patient/dashboard')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 transition-colors text-xs font-semibold no-underline"
              >
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span className="max-w-[120px] truncate">{currentUser.name || 'My Portal'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-200/80 text-teal-950 uppercase tracking-wider font-bold">
                  {currentUser.role}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleScrollToLogin}
                className="px-3 py-1.5 rounded-lg text-primary hover:bg-surface-container-high font-semibold text-xs sm:text-sm transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleScrollToRegister}
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs sm:text-sm hover:bg-primary-container transition-colors shadow-[0_1px_4px_rgba(0,53,76,0.12)] cursor-pointer"
              >
                Register / Health ID
              </button>
            </div>
          )}

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
          {!currentUser ? (
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  setMobileOpen(false);
                  handleScrollToLogin(e);
                }}
                className="flex-1 py-2 text-center rounded-lg border border-slate-300 font-semibold text-sm text-slate-700 bg-white"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={(e) => {
                  setMobileOpen(false);
                  handleScrollToRegister(e);
                }}
                className="flex-1 py-2 text-center rounded-lg bg-primary text-on-primary font-semibold text-sm shadow-xs"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Signed in as:</span>
                <span className="font-semibold text-sm text-slate-800">{currentUser.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                  navigate('/');
                }}
                className="text-xs text-red-600 font-semibold px-2.5 py-1 rounded bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}

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

          <div className="border-t border-slate-200/80 my-2 pt-2 flex flex-col gap-1">
            <span className="px-3 font-semibold uppercase text-[10px] text-slate-400">Direct Portals</span>
            <button
              type="button"
              onClick={() => handlePortalNavigate('patient', '/patient/dashboard')}
              className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-label-lg text-sm flex items-center justify-between"
            >
              <span>Patient Portal</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalNavigate('doctor', '/doctor/dashboard')}
              className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-label-lg text-sm flex items-center justify-between"
            >
              <span>Doctor Console</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalNavigate('hospital', '/admin/dashboard')}
              className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-label-lg text-sm flex items-center justify-between"
            >
              <span>Hospital Admin</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalNavigate('hospital', '/admin/emergency-ward')}
              className="text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 font-label-lg text-sm flex items-center justify-between"
            >
              <span>Emergency Ward (ICU Grid)</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
