import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeRecordTab, setActiveRecordTab] = useState('rx');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const patientName = currentUser?.name || currentUser?.fullName || 'Patient';

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: `${patientName}, your E-KAVACH Trauma & Clinical Assistant is active. You can check medication interactions, triage questions, or ask about hospital access anytime.`,
    },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);
        const token = localStorage.getItem('ekavach_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch live appointments
        const aptRes = await fetch('/api/patient/appointments', { headers });
        if (aptRes.ok) {
          const aptData = await aptRes.json();
          if (aptData.success && Array.isArray(aptData.appointments)) {
            setAppointments(aptData.appointments);
          }
        }

        // Fetch health history records
        const recRes = await fetch('/api/patient/health-history', { headers });
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.success && Array.isArray(recData.records)) {
            setHealthRecords(recData.records);
          }
        }
      } catch (e) {
        console.error('Error fetching dashboard records:', e);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  // Compute next upcoming appointment
  const nextAppointment = appointments.find(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );

  // Compute prescription list from health records
  const prescriptions = healthRecords.filter(
    (r) => r.type === 'PRESCRIPTION' || r.recordType === 'PRESCRIPTION'
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendChat = (promptText) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      let reply = 'E-KAVACH AI: Based on your ABHA health records, your metrics are synchronized with Apollo Greams Trauma Hub. Let me know if you need clinical triage assistance.';
      if (textToSend.toLowerCase().includes('interaction') || textToSend.toLowerCase().includes('drug')) {
        reply = 'E-KAVACH AI: Checking Rosuvastatin 10mg & Aspirin 75mg against Metformin. No adverse contraindications found. Penicillin is flagged as a SEVERE ALLERGY.';
      } else if (textToSend.toLowerCase().includes('lab') || textToSend.toLowerCase().includes('report')) {
        reply = 'E-KAVACH AI: Your last HbA1c reading was 6.8% (fair glycemic control). Fasting blood sugar logged at 124 mg/dL.';
      } else if (textToSend.toLowerCase().includes('emergency') || textToSend.toLowerCase().includes('er')) {
        reply = 'E-KAVACH AI: Emergency protocol active. Your primary contact Ananya S. (+91 98401 22819) and Apollo ER have your Level-1 telemetry token.';
      }
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: 'ai', text: reply }]);
    }, 600);
  };

  const handleDownloadSummary = () => {
    const userName = currentUser?.name || currentUser?.fullName || 'User';
    const abhaId = currentUser?.abhaNumber || currentUser?.id || 'ABHA-NOT-SET';
    const bloodGroup = currentUser?.bloodGroup || 'Not specified';
    const allergies = currentUser?.allergies || 'None reported';
    const conditions = currentUser?.conditions || 'None reported';
    
    showToast(`Downloading Universal Health Summary (${abhaId}.pdf)...`);
    const dummyContent = `E-KAVACH UNIVERSAL EMERGENCY HEALTH SUMMARY\nPatient: ${userName}\nABHA: ${abhaId}\nBlood Group: ${bloodGroup}\nAllergies: ${allergies}\nConditions: ${conditions}\nPhone: ${currentUser?.phone || 'N/A'}\nPincode: ${currentUser?.pincode || 'N/A'}`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EKAVACH-Health-Summary-${userName.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-sm px-space-md py-space-sm bg-primary text-on-primary rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">info</span>
          <div className="flex flex-col">
            <span className="font-label-lg text-label-lg font-semibold">Notification</span>
            <span className="font-body-sm text-body-sm text-surface-variant">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-space-md text-surface-variant hover:text-on-primary transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="flex flex-col w-full gap-space-xl">
{/* GREETING HEADER */}
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
<div className="flex flex-col gap-space-2xs">
<div className="flex items-center gap-space-xs">
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Welcome, {currentUser?.name || 'Rajesh V. Sharma'}</h1>
<span className="inline-flex items-center px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
          LIVE PATIENT NODE
        </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
<span className="">Today is Monday, 24 October 2026</span>
<span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
<span className="flex items-center gap-1 font-medium text-primary">
<span className="material-symbols-outlined text-[16px] text-tertiary-container">hub</span>
          {currentUser?.hospital || 'Apollo Greams Trauma Hub Connected'}
        </span>
</p>
</div>
<div className="flex items-center gap-space-sm flex-wrap">
<button onClick={handleDownloadSummary} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container text-primary font-label-lg text-label-lg shadow-sm hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">download</span>
<span className="">Download Health Summary</span>
</button>
<button onClick={() => navigate('/patient/book-doctor')} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="">+ Book Immediate Consultation</span>
</button>
</div>
</div>
{/* TOP SECTION: SECURE HEALTH ID & 3 QUICK-GLANCE CARDS */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-stretch">
{/* E-KAVACH SECURE HEALTH ID CARD */}
<div className="xl:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between relative overflow-hidden">
<div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-primary/5 pointer-events-none"></div>
{/* Card Top Bar */}
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-xs">
<div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">shield</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Verified National Health ID</span>
<span className="font-headline-sm text-headline-sm text-primary">E-KAVACH SECURE</span>
</div>
</div>
<div className="flex items-center gap-space-xs">
<span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-[#E4E4FB] text-primary font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">contactless</span>
            NFC • QR READY
          </span>
<span className="inline-flex items-center px-space-xs py-space-2xs rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-medium">
            Active Grid
          </span>
</div>
</div>
{/* Card Main Body: Details & QR */}
<div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md py-space-md items-center">
{/* Patient Info */}
<div className="sm:col-span-8 flex flex-col gap-space-xs">
<div className="flex items-baseline gap-space-xs">
<h2 className="font-headline-md text-headline-md text-on-surface font-semibold">{currentUser?.name || currentUser?.fullName || 'Registered User'}</h2>
<span className="material-symbols-outlined text-tertiary-container text-[20px]" title="NDHM Verified">verified</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant font-mono flex items-center gap-x-2 gap-y-1 flex-wrap">
  <span>ABHA: <strong className="text-primary font-semibold">{currentUser?.abhaNumber || currentUser?.id || 'Pending ABHA'}</strong></span>
  <span>•</span>
  <span>Phone: <strong className="text-on-surface font-medium">{currentUser?.phone || 'Not provided'}</strong></span>
  {(currentUser?.aadhaarNumber || currentUser?.aadhaar) && (
    <>
      <span>•</span>
      <span>Aadhaar: <strong className="text-secondary font-medium">{currentUser.aadhaarNumber || currentUser.aadhaar}</strong></span>
    </>
  )}
</p>
{/* Badges Cluster */}
<div className="flex items-center gap-space-xs flex-wrap mt-space-2xs">
{currentUser?.bloodGroup && currentUser.bloodGroup.trim() !== '' && (
  <span className="px-space-xs py-space-2xs rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold">
    {currentUser.bloodGroup}
  </span>
)}
{currentUser?.pincode && (
  <span className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
    PIN: {currentUser.pincode}
  </span>
)}
{currentUser?.allergies && currentUser?.allergies !== 'None' && (
  <span className="px-space-xs py-space-2xs rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold flex items-center gap-1">
    <span className="material-symbols-outlined text-[14px]">warning</span>
    Allergy: {currentUser.allergies}
  </span>
)}
</div>
{/* Medical Line Items */}
<div className="mt-space-xs space-y-1">
{currentUser?.bpLevel && (
  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
    <span className="material-symbols-outlined text-secondary text-[16px]">favorite</span>
    <span className="font-medium text-on-surface">BP Baseline:</span>
    <span className="font-semibold text-secondary">{currentUser.bpLevel}</span>
  </div>
)}
{currentUser?.hasDiabetes && (
  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
    <span className="material-symbols-outlined text-amber-600 text-[16px]">bloodpressure</span>
    <span className="font-medium text-on-surface">Diabetic Status:</span>
    <span className={`font-semibold ${currentUser.hasDiabetes === 'Yes' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
      {currentUser.hasDiabetes === 'Yes' ? `Diabetic (${currentUser.diabetesType || 'Type 2'}) • ${currentUser.diabetesMedication || 'On Meds'}` : 'Non-Diabetic (Normal)'}
    </span>
  </div>
)}
{currentUser?.conditions && currentUser?.conditions !== 'None' && (
  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
    <span className="font-medium text-on-surface">Condition:</span>
    <span className="">{currentUser.conditions}</span>
  </div>
)}
{(currentUser?.emergencyContactName || currentUser?.emergencyContactPhone) && (
  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
    <span className="material-symbols-outlined text-error text-[16px]">contact_emergency</span>
    <span className="font-medium text-on-surface">Emergency SOS Kin:</span>
    <span className="font-mono text-primary font-semibold">
      {currentUser?.emergencyContactName || 'Emergency Proxy'}
      {currentUser?.emergencyContactRelation ? ` (${currentUser.emergencyContactRelation})` : ''}
      {currentUser?.emergencyContactPhone ? ` • ${currentUser.emergencyContactPhone}` : ''}
    </span>
  </div>
)}
{currentUser?.address && (
  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
    <span className="material-symbols-outlined text-[16px]">home</span>
    <span className="font-medium text-on-surface">Address:</span>
    <span>{currentUser.address} {currentUser.pincode ? `(${currentUser.pincode})` : ''}</span>
  </div>
)}
</div>
</div>
{/* High-fidelity QR Module */}
<div className="sm:col-span-4 flex flex-col items-center justify-center p-space-sm bg-surface-container-low rounded-xl text-center">
<div className="p-2 bg-surface-container-lowest rounded-lg shadow-sm flex items-center justify-center">
{/* Precise inline QR SVG matrix with corner eyelets */}
<svg className="w-24 h-24 text-primary" fill="currentColor" viewBox="0 0 100 100">
{/* Corner Top Left */}
<rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="5"></rect>
<rect fill="currentColor" height="14" width="14" x="11" y="11"></rect>
{/* Corner Top Right */}
<rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="69" y="5"></rect>
<rect fill="currentColor" height="14" width="14" x="75" y="11"></rect>
{/* Corner Bottom Left */}
<rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="69"></rect>
<rect fill="currentColor" height="14" width="14" x="11" y="75"></rect>
{/* Matrix Data Nodes */}
<rect height="6" width="6" x="36" y="8"></rect>
<rect height="6" width="8" x="46" y="8"></rect>
<rect height="6" width="8" x="36" y="18"></rect>
<rect height="8" width="6" x="48" y="20"></rect>
<rect height="8" width="6" x="8" y="36"></rect>
<rect height="6" width="8" x="18" y="46"></rect>
<rect height="10" width="10" x="36" y="36"></rect>
<rect height="6" width="12" x="52" y="36"></rect>
<rect height="8" width="8" x="70" y="36"></rect>
<rect height="8" width="8" x="84" y="46"></rect>
<rect height="14" width="6" x="36" y="52"></rect>
<rect height="8" width="12" x="48" y="48"></rect>
<rect height="12" width="8" x="64" y="52"></rect>
<rect height="6" width="14" x="46" y="68"></rect>
<rect height="12" width="6" x="36" y="78"></rect>
<rect height="8" width="8" x="46" y="80"></rect>
<rect height="6" width="12" x="68" y="72"></rect>
<rect height="12" width="8" x="84" y="80"></rect>
</svg>
</div>
<span className="font-label-sm text-label-sm font-semibold text-primary mt-space-xs flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">sensors</span>
            Tap or Scan in Bay
          </span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-mono">Latency: 0.18s</span>
</div>
</div>
{/* Card Bottom Strip */}
<div className="pt-space-xs flex items-center justify-between bg-surface-container px-space-md py-space-xs rounded-lg mt-space-xs">
<div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-semibold">
<span className="material-symbols-outlined text-[16px] text-tertiary-container">verified</span>
<span className="">Universal Trauma Pass</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Valid Across ABDM &amp; ESI Grid</span>
</div>
</div>
{/* 3 QUICK-GLANCE STATUS PILL CARDS */}
<div className="xl:col-span-5 flex flex-col justify-between gap-space-sm">
{/* Card 1: Next Appointment */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start justify-between">
<div className="flex items-start gap-space-sm">
<div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">calendar_clock</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Next Appointment</span>
{nextAppointment ? (
  <>
    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
      {nextAppointment.scheduledAt ? new Date(nextAppointment.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Scheduled'}, {nextAppointment.timeSlot || nextAppointment.slot || 'Pending Slot'}
    </span>
    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
      {nextAppointment.doctor?.name || nextAppointment.doctorName || 'Dr. Kavitha Menon'} ({nextAppointment.department || nextAppointment.doctor?.specialization || 'Clinical'}) • Token: {nextAppointment.token || nextAppointment.id}
    </span>
  </>
) : (
  <>
    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">No Pending Slot</span>
    <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Ready to schedule routine or emergency checkup</span>
  </>
)}
</div>
</div>
{nextAppointment ? (
  <span className={`px-space-xs py-space-2xs rounded-full font-label-sm text-label-sm font-semibold ${nextAppointment.status === 'CONFIRMED' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-amber-100 text-amber-800'}`}>
    {nextAppointment.status}
  </span>
) : (
  <button
    onClick={() => navigate('/patient/appointments')}
    className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
  >
    Book
  </button>
)}
</div>
{/* Card 2: Pending Approvals */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start justify-between">
<div className="flex items-start gap-space-sm">
<div className="w-11 h-11 rounded-lg bg-[#E4E4FB] flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">pending_actions</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">ABDM Grid Status</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Consent Gateway Live</span>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Golden Hour ER Auto-Approval Enabled • HIPAA/NDHM</span>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded-full bg-[#E4E4FB] text-primary font-label-sm text-label-sm font-semibold">
          Active Sync
        </span>
</div>
{/* Card 3: Active Prescriptions */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start justify-between">
<div className="flex items-start gap-space-sm">
<div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">medication</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Clinical Records</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
  {prescriptions.length > 0 ? `${prescriptions.length} Active Prescriptions` : `${healthRecords.length} Records on File`}
</span>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
  {prescriptions.length > 0
    ? (prescriptions[0]?.diagnosis || prescriptions[0]?.title || 'Prescription synchronized')
    : 'Complete digital health dossier accessible'}
</span>
</div>
</div>
<Link to="/patient/health-history" className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold no-underline hover:opacity-90">
  View All
</Link>
</div>
</div>
</div>

{/* SECTION: REGISTERED EMERGENCY SOS CONTACT BANNER */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
  <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
  <div className="flex items-center gap-space-md pl-1">
    <div className="w-12 h-12 rounded-xl bg-error-container/80 text-error flex items-center justify-center shrink-0 shadow-xs">
      <span className="material-symbols-outlined text-[26px]">connect_without_contact</span>
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] animate-pulse">e911_emergency</span>
          Registered Primary Emergency SOS Kin
        </span>
        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
          {currentUser?.emergencyContactRelation || 'Primary Kin'}
        </span>
      </div>
      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
        {currentUser?.emergencyContactName || 'Ananya S. Sharma'}
      </span>
      <span className="font-body-sm text-body-sm text-on-surface-variant font-mono flex items-center gap-1 mt-0.5">
        <span className="material-symbols-outlined text-[15px] text-error">call</span>
        {currentUser?.emergencyContactPhone || '+91 98401 22819'}
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-sans ml-1 text-xs">
          • Verified 24/7 Dispatch Contact
        </span>
      </span>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
    <a
      href={`tel:${(currentUser?.emergencyContactPhone || '9840122819').replace(/\s+/g, '')}`}
      className="px-3 py-1.5 rounded-lg bg-error text-on-error font-label-md text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-all no-underline"
    >
      <span className="material-symbols-outlined text-[16px]">call</span>
      Direct SOS Call
    </a>
    <button
      onClick={() => navigate('/patient/settings#emergency')}
      className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-md text-xs font-semibold flex items-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
      type="button"
    >
      <span className="material-symbols-outlined text-[16px]">edit</span>
      Update Kin
    </button>
  </div>
</div>

{/* SECTION: HOSPITAL ER ACCESS CALLOUT BANNER */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row items-stretch">
<div className="w-3 bg-error shrink-0"></div>
<div className="p-space-lg flex-1 flex flex-col justify-between gap-space-md">
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs">
<div className="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[24px]">e911_emergency</span>
</div>
<div>
<div className="flex items-center gap-space-xs">
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Emergency Room Access</h2>
<span className="px-space-xs py-space-2xs rounded-full bg-error text-on-error font-label-sm text-label-sm font-bold animate-pulse">
                EMERGENCY PRIORITY
              </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Instant zero-friction access for ER paramedics &amp; trauma staff via QR or NFC beacon. Grants immediate one-time clinical override for medical history &amp; allergy data.
            </p>
</div>
</div>
<div className="flex items-center gap-space-xs">
<button onClick={() => navigate('/patient/settings')} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">contacts</span>
<span className="">Update Trauma Contacts</span>
</button>
<button onClick={() => navigate('/patient/emergency')} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-error text-on-error font-label-lg text-label-lg shadow-sm hover:opacity-95 transition-opacity" type="button">
<span className="material-symbols-outlined text-[18px]">badge</span>
<span className="">View ER Access Card</span>
</button>
</div>
</div>
<div className="flex flex-wrap items-center justify-between gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-lg text-on-surface font-body-sm text-body-sm">
<span className="flex items-center gap-1 font-medium text-error">
<span className="material-symbols-outlined text-[16px]">health_and_safety</span>
          Emergency Protocol: Level 1 Trauma Active
        </span>
<span className="text-on-surface-variant">•</span>
<span className="text-on-surface-variant font-medium">Biometric Override Enabled</span>
<span className="text-on-surface-variant">•</span>
<span className="font-mono text-on-surface-variant">Auth Token: EK-TR-88190-V4</span>
</div>
</div>
</div>
{/* SECTION: APPOINTMENT BOOKING & UPCOMING SCHEDULE */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
{/* Booking Form Card */}

{/* Upcoming Schedule Table Card */}

</div>
{/* SECTION: GOVERNMENT HEALTH SCHEMES */}

{/* SECTION: TABBED PRESCRIPTIONS & HEALTH HISTORY */}

{/* SECTION: DOCTOR MESSAGES & TELE-CONSULTATIONS */}

{/* FLOATING AI CHATBOT ASSISTANT WIDGET */}
<aside aria-label="Clinical Navigator Chatbot" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-space-xs pointer-events-none">
{/* Flyout Chat Window Card */}
<div className={`pointer-events-auto w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-xl p-space-md flex flex-col gap-space-sm transition-all duration-300 transform scale-100 origin-bottom-right ${aiChatOpen ? 'block' : 'hidden'}`} id="ai-chat-card">
{/* AI Header */}
<div className="flex items-center justify-between pb-space-xs">
<div className="flex items-center gap-space-xs">
<div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">psychology</span>
</div>
<div>
<h3 className="font-label-md text-label-md font-semibold text-on-surface">AI Clinical Navigator</h3>
<span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
              Online • Protocol Guarded
            </span>
</div>
</div>
<button onClick={() => setAiChatOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1" type="button">
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
{/* AI Prompt Preview Bubble */}
<div className="max-h-48 overflow-y-auto space-y-2">
  {chatMessages.map((msg) => (
    <div
      key={msg.id}
      className={`p-space-sm rounded-lg font-body-sm text-body-sm ${
        msg.role === 'user'
          ? 'bg-primary text-on-primary self-end text-right'
          : 'bg-surface-container-low text-on-surface'
      }`}
    >
      {msg.text}
    </div>
  ))}
</div>
{/* Quick Action Pills */}
<div className="flex items-center gap-space-2xs flex-wrap">
<button onClick={() => handleSendChat('Check Drug Interaction')} className="px-space-xs py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-medium hover:bg-surface-container-high transition-colors" type="button">
          Check Drug Interaction
        </button>
<button onClick={() => handleSendChat('Explain Lab Report')} className="px-space-xs py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-medium hover:bg-surface-container-high transition-colors" type="button">
          Explain Lab Report
        </button>
<button onClick={() => handleSendChat('Emergency ER Guidance')} className="px-space-xs py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity" type="button">
          Emergency ER Guidance
        </button>
</div>
{/* Input Field */}
<form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex items-center gap-space-xs bg-surface-container-low rounded-lg px-space-sm py-space-2xs">
<input
  className="bg-transparent border-none outline-none font-body-sm text-body-sm w-full text-on-surface placeholder:text-outline"
  placeholder="Ask about medications, allergies, or triage..."
  type="text"
  value={chatInput}
  onChange={(e) => setChatInput(e.target.value)}
/>
<button className="text-primary hover:text-primary-container transition-colors flex items-center justify-center" type="submit">
<span className="material-symbols-outlined text-[18px]">send</span>
</button>
</form>
</div>
{/* Floating Toggle Button */}
<button onClick={() => setAiChatOpen(!aiChatOpen)} className="pointer-events-auto flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-xl hover:bg-primary-container transition-all" type="button">
<span className="material-symbols-outlined text-[20px]">smart_toy</span>
<span className="">Ask E-KAVACH AI</span>
<span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping ml-1"></span>
</button>
</aside>
</div>

    </div>
  );
}
