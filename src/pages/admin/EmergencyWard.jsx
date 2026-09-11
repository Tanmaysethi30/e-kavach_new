import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function EmergencyWard() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast(`Searching ER ingress directory for "${searchQuery}"...`);
  };

  return (
    <div className="w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#004d6c] text-white rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-xl text-[#02C39A]">emergency</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Emergency Ward Notification</span>
            <span className="text-xs text-slate-200">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-4 text-slate-300 hover:text-white transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ER Access Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-300 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                <h3 className="font-headline font-bold text-lg text-[#004d6c]">Digital ER Access Pass</h3>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-base font-bold text-slate-900">Rajesh V. Sharma</div>
                  <div className="text-xs text-slate-500 font-mono">ABHA: 9824-8819-3320-TN</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-xs">
                  O+ Rh Positive
                </span>
              </div>

              <div className="text-xs bg-red-50 text-red-800 p-2.5 rounded-lg border border-red-200 font-medium">
                <strong>CRITICAL ALLERGY ALERT:</strong> Severe Penicillin anaphylaxis reaction.
              </div>

              <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-slate-800">qr_code_2</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">TOKEN: EK-TR-88190-V4 • TAP NFC TO SCAN</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  showToast('ER Pass cached locally for offline paramedic pairing.');
                  setShowCardModal(false);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cache Offline
              </button>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-5 py-2 bg-[#004d6c] text-white text-xs font-semibold rounded-lg hover:bg-[#00374e]"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-2xl">contact_phone</span>
                <h3 className="font-headline font-bold text-lg text-slate-900">Emergency Contacts &amp; SOS</h3>
              </div>
              <button
                onClick={() => setShowContactsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Sunita Sharma (Spouse)</div>
                  <div className="text-slate-500 font-mono">+91 98401 22910 • Verified Primary</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Priority 1</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Dr. Vivek Sharma (Brother / Physician)</div>
                  <div className="text-slate-500 font-mono">+91 94440 88129 • Apollo Greams Consult</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">Priority 2</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowContactsModal(false);
                  navigate('/patient/emergency');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Manage In Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Automated SMS trauma dispatch alert dispatched to Sunita Sharma.');
                  setShowContactsModal(false);
                }}
                className="px-5 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
              >
                Trigger SOS Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Utility Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur px-6 md:px-10 flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="material-symbols-outlined text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, doctors, prescriptions, ABHA ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004d6c]/20 focus:border-[#004d6c]"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 md:gap-4 pl-4">
          <div className="hidden sm:flex items-center gap-2 bg-teal-50 border border-teal-200/70 text-teal-800 px-3 py-1.5 rounded-xl text-xs font-medium">
            <span className="material-symbols-outlined text-teal-600 text-base">verified_user</span>
            <span className="">Secure Shield: Active</span>
          </div>
          <button
            onClick={() => showToast('Trauma Ingress Alert: Ambulance #108-04 arriving in 3 mins.')}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors relative cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2"></span>
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-9 h-9 rounded-full bg-[#004d6c] text-white flex items-center justify-center text-xs font-semibold cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">person</span>
          </button>
        </div>
      </header>

      {/* Subheader Notification Bar */}
      <div className="bg-white border-b border-slate-200/70 px-6 md:px-10 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-slate-700">Ayushman Bharat Digital Mission (ABDM) Sync Active</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 font-mono text-[11px]">Latency 28ms</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-500 font-medium">
          <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
          <span className="">National Health Records Vault Linked</span>
        </div>
      </div>

      {/* Page Body Container */}
      <div className="flex-1 px-6 md:px-12 py-8 max-w-5xl mx-auto w-full flex flex-col justify-center">

        {/* 1. Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-[#ede7f6] text-[#3949ab] font-semibold text-xs px-3 py-1 rounded-full mb-3 border border-[#D5D5F9]">
            <span className="material-symbols-outlined text-sm text-[#5C59A5]">auto_awesome</span>
            <span className="">EMERGENCY CLINICAL INGRESS • ZERO FRICTION</span>
          </div>
          <h1 className="font-headline font-bold text-3xl md:text-4xl text-[#004d6c] tracking-tight">Hospital ER Access</h1>
          <p className="text-slate-600 text-sm md:text-base mt-2 max-w-2xl">
            Give emergency responders instant access to your critical health information.
          </p>
        </div>

        {/* 2. Main Focal Module: Emergency Room Access Card */}
        <div className="bg-white rounded-2xl border-2 border-red-200 p-7 md:p-10 shadow-lg relative overflow-hidden transition-all">
          {/* Subtle Accent Ambient Glow at top edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-400"></div>

          <div className="flex flex-col items-center text-center max-w-xl mx-auto">

            {/* Red-tinted Accent Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-5 relative group">
              <span className="material-symbols-outlined text-3xl text-red-600">vital_signs</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                +
              </span>
            </div>

            {/* Card Title */}
            <h2 className="font-headline font-bold text-2xl md:text-3xl text-[#004d6c] tracking-tight">
              Emergency Room Access
            </h2>

            {/* One-line Description in muted gray text */}
            <p className="text-slate-500 text-sm md:text-base mt-2 leading-relaxed">
              Instant access for hospital staff via QR/NFC scan.
            </p>

            {/* Verified Patient Credentials Summary Pill */}
            <div className="my-6 w-full bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500">Prepared For:</span>
                <span className="font-semibold text-slate-800">Rajesh V. Sharma</span>
                <span className="font-mono text-slate-400 text-[11px]">(O+ Rh Pos)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded border border-red-200 text-[11px]">
                  Allergy: Penicillin
                </span>
                <span className="bg-[#ede7f6] text-[#3949ab] font-medium px-2 py-0.5 rounded text-[11px]">
                  NFC / QR Sync Ready
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowCardModal(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#004d6c] hover:bg-[#00374e] text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-teal-300">qr_code_2</span>
                <span className="">View ER Access Card</span>
              </button>
              <button
                onClick={() => setShowContactsModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-slate-500 text-base">share</span>
                <span className="">Emergency Contacts</span>
              </button>
            </div>

            {/* 4. Default / Empty State Preview Callout */}
            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="material-symbols-outlined text-sm text-slate-400">info</span>
              <span className="">Your ER Access Card will appear here once generated • Token: <span className="font-mono text-slate-500">EK-TR-88190-V4</span></span>
            </div>

          </div>
        </div>

        {/* 3. Supporting Context: Trust / Info Points */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-700 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">wifi_off</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-xs md:text-sm">Works offline</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Cached biometric keys function without internet</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-700 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">done_all</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-xs md:text-sm">ABDM &amp; ISO 27799</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Government-certified clinical data privacy</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-teal-700 flex-shrink-0">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-xs md:text-sm">Scan under 1 second</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Instant triage intake for paramedics &amp; trauma ER</p>
            </div>
          </div>
        </div>

        {/* Emergency Operational Ribbon */}
        <div className="mt-6 bg-slate-100/80 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004d6c] text-base">apartment</span>
            <span className=""><strong className="text-slate-800">Connected Trauma Hub:</strong> Apollo Greams Hospital, Bay 3 Trauma Ward</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span className="">Protocol: Level-1 Triage</span>
            <span className="">•</span>
            <span className="text-teal-700 font-semibold">Fast-Pass Authorized</span>
          </div>
        </div>

      </div>
    </div>
  );
}
