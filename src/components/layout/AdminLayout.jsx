import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import EmergencyMarquee from '../common/EmergencyMarquee';
import Avatar from '../common/Avatar';
import LogoImg from '../../assets/images/Logo.jpg';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid_view' },
    { to: '/admin/hospital-details', label: 'Hospital Details', icon: 'apartment' },
    { to: '/admin/staff', label: 'Staff Management', icon: 'badge' },
    { to: '/admin/doctors', label: 'Doctor Management', icon: 'stethoscope' },
    { to: '/admin/patients', label: 'Patient Management', icon: 'personal_injury' },
    { to: '/admin/emergency-ward', label: 'Emergency Ward', icon: 'emergency' },
    { to: '/admin/pharmacy', label: 'Pharmacy Management', icon: 'medication' },
    { to: '/admin/network', label: 'Hospital Network', icon: 'hub' },
  ];

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <EmergencyMarquee />

      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed left-0 z-50 flex flex-col justify-between w-72 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: '28px', height: 'calc(100vh - 28px)' }}
      >
        <div className="p-space-lg flex-1">
          {/* Brand */}
          <div className="flex items-center gap-space-sm mb-space-lg">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-[0_1px_8px_rgba(0,77,108,0.06)] p-1">
                <img src={LogoImg} alt="E-KAVACH Logo" className="w-full h-full object-contain rounded" />
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                  E-KAVACH
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                  ADMIN CONSOLE
                </div>
              </div>
            </Link>
          </div>

          {/* Admin Profile Card */}
          <div className="bg-surface-container-lowest p-space-sm rounded-xl mb-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-space-sm">
              <Avatar name="Dr. R. K. Nambiar" initials="RK" role="admin" size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-space-2xs mb-space-2xs">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                    Dr. R. K. Nambiar
                  </span>
                </div>
                <div className="font-label-md text-label-md text-on-surface-variant leading-none mb-space-xs">
                  Hospital Administrator
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant/80 truncate mb-space-xs">
                  Apollo Greams Trauma Hub
                </div>
                <span className="inline-flex items-center px-space-xs py-space-2xs rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1"></span>
                  VERIFIED ADMIN
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-label-lg text-sm ${
                    isActive
                      ? 'bg-primary text-on-primary font-medium shadow-[0_1px_8px_rgba(0,77,108,0.06)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Node Active Footer */}
        <div className="p-space-md m-space-sm rounded-lg bg-surface-container">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-primary font-semibold tracking-wide">
              NODE ACTIVE
            </span>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
            Hospital Supercluster 01 | Port #842
          </div>
          <div className="font-label-sm text-label-sm text-secondary font-medium mt-space-2xs">
            0.09s ping • TLS Secured
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header
          className="fixed top-7 left-0 lg:left-72 right-0 z-40 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container"
        >
          <div className="h-16 w-full px-4 sm:px-grid-margin flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg"
                aria-label="Toggle Sidebar"
              >
                <span className="material-symbols-outlined text-[24px]">menu</span>
              </button>
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  className="w-full h-11 pl-10 pr-space-md rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  placeholder="Search staff, patients, records, or wards..."
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-space-sm sm:gap-space-md shrink-0">
              <div className="hidden md:inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="font-label-sm text-label-sm font-medium">
                  Live Hospital Grid: Operational
                </span>
              </div>
              <button
                className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
              </button>
              <button
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                title="Help & Support"
              >
                <span className="material-symbols-outlined text-[22px]">help</span>
              </button>
              <Avatar name="Dr. R. K. Nambiar" initials="RK" role="admin" size="sm" />
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-error hover:bg-error-container/20 transition-colors flex items-center justify-center cursor-pointer ml-1"
                title="Sign Out of Session"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="w-full flex-1 bg-surface"
          style={{ paddingTop: 'calc(28px + 4rem)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
