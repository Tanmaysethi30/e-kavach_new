import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeTriage, subscribeReferrals } from '../../services/telemetry';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTelemetryPatient, setActiveTelemetryPatient] = useState(null);

  // Live Summary State fetched from DB
  const [summaryData, setSummaryData] = useState({
    hospitalName: currentUser?.hospital || currentUser?.name || 'Apollo Greams Super-Speciality Trauma Center',
    hospitalCode: currentUser?.tag || 'Chennai Node #01',
    totalBeds: 450,
    occupiedBeds: 382,
    availableBeds: 68,
    occupancyRate: 85,
    icuTotal: 50,
    icuOccupied: 46,
    icuAvailable: 4,
    icuLoadPct: 92,
    activePatientsCount: 382,
    doctorsOnDutyCount: 48,
  });

  const [triageList, setTriageList] = useState([
    {
      id: 'tr-01',
      name: 'Rajesh V. Sharma',
      abha: '9824-8819-TN',
      priority: 'Critical (Priority 1)',
      condition: 'Acute Myocardial Infarction',
      vitals: 'Trauma Bay 02 • Bedside Cardiac Observation',
      bay: 'Bay 02',
      doctor: 'Dr. Kavitha Menon',
      role: 'Cardiology Response Lead',
      isReferral: false,
    },
    {
      id: 'tr-02',
      name: 'Meenakshi Sundaram',
      abha: '7712-4401-TN',
      priority: 'Urgent (Priority 2)',
      condition: 'Polytrauma / Compound Fracture',
      vitals: 'Trauma Bay 04 • Orthopedic Bedside Observation',
      bay: 'Bay 04',
      doctor: 'Dr. Arvind Swaminathan',
      role: 'Orthopedic Trauma Consult',
      isReferral: false,
    },
    {
      id: 'tr-03',
      name: 'Harish K. Varma',
      abha: '4402-9918-TN',
      priority: 'Stable (Priority 3)',
      condition: 'Deep Laceration / Suture',
      vitals: 'Trauma Bay 06 • Minor Procedure Bay',
      bay: 'Bay 06',
      doctor: 'Dr. Priya Sundaram',
      role: 'Emergency Medical Officer',
      isReferral: false,
    },
  ]);

  useEffect(() => {
    async function loadSummary() {
      try {
        const token = localStorage.getItem('ekavach_token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch('/api/admin/dashboard/summary', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            const { hospital, bedMetrics, operationsMetrics } = data.summary;
            setSummaryData({
              hospitalName: hospital.name || currentUser?.hospital || currentUser?.name || 'Apollo Greams Super-Speciality Trauma Center',
              hospitalCode: hospital.code || currentUser?.tag || 'Chennai Node #01',
              totalBeds: bedMetrics.total || 450,
              occupiedBeds: bedMetrics.occupied || 382,
              availableBeds: bedMetrics.available || 68,
              occupancyRate: bedMetrics.occupancyRate || 85,
              icuTotal: bedMetrics.icu?.total || 50,
              icuOccupied: bedMetrics.icu?.occupied || 46,
              icuAvailable: bedMetrics.icu?.available || 4,
              icuLoadPct: bedMetrics.icu?.loadPct || 92,
              activePatientsCount: bedMetrics.occupied || 382,
              doctorsOnDutyCount: operationsMetrics.totalStaff || 48,
            });
          }
        }
      } catch (_err) {
        // fallback to default
      }
    }

    async function loadTriage() {
      try {
        const token = localStorage.getItem('ekavach_token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch('/api/admin/triage-queue', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.queue) && data.queue.length > 0) {
            const mapped = data.queue.map((e) => ({
              id: e.id,
              name: e.patientName || 'Emergency Patient',
              abha: e.abhaNumber || '9824-8819-TN',
              priority: e.priorityLevel || (e.triageColor === 'RED' ? 'Critical (Priority 1)' : 'Urgent (Priority 2)'),
              condition: e.condition || 'Emergency Ingress',
              vitals: e.bayNumber ? `Trauma ${e.bayNumber} • Bedside Clinical Observation` : 'Trauma Bay 02 • Bedside Cardiac Observation',
              bay: e.bayNumber || 'Bay 02',
              doctor: e.doctor || 'Dr. Kavitha Menon',
              role: e.isReferral ? 'Inter-Hospital Referral Consult' : 'Emergency Response Lead',
              isReferral: !!e.isReferral,
              isLive: true,
            }));
            setTriageList((prev) => {
              const existingIds = new Set(mapped.map((m) => m.id));
              const remaining = prev.filter((p) => !existingIds.has(p.id));
              return [...mapped, ...remaining];
            });
          }
        }
      } catch (_err) {}
    }

    loadSummary();
    loadTriage();

    const unsubTriage = subscribeTriage((data) => {
      console.log('⚡ [AdminDashboard] Live triage entry received:', data);
      if (data.triageEntry) {
        const e = data.triageEntry;
        const newItem = {
          id: e.id || Date.now(),
          name: e.patientName || 'Referred Patient',
          abha: e.abhaNumber || 'ABHA-IN-TRANSIT',
          priority: e.priorityLevel || 'Critical (Priority 1)',
          condition: e.condition || 'Emergency Ingress',
          vitals: `${e.bayNumber || 'Bay 02'} • Live Ingress Alert (108 Fleet)`,
          bay: e.bayNumber || 'Bay 02',
          doctor: e.doctor || 'Specialist Consult Lead',
          role: 'Inter-Hospital Ingress Attending',
          isReferral: true,
          isLive: true,
        };
        setTriageList((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
        showToast(`⚡ Ingress Alert: ${newItem.name} assigned to ${newItem.bay} (${newItem.priority})`);
      }
    });

    const unsubReferral = subscribeReferrals((data) => {
      console.log('⚡ [AdminDashboard] Live referral update received:', data);
      if (data.triageEntry || data.referral) {
        const r = data.referral || {};
        const te = data.triageEntry || {};
        const newItem = {
          id: te.id || r.id || Date.now(),
          name: r.patientName || te.patientName || 'Referred Patient',
          abha: r.abhaNumber || te.abhaNumber || '9824-8819-TN',
          priority: r.priorityLevel || te.priorityLevel || 'Priority 1 (Critical)',
          condition: `${r.clinicalSummary || te.condition || 'Inter-Hospital Transfer'} (from ${r.fromDoctorName || 'Referring Clinician'})`,
          vitals: `${r.bayAllocated || te.bayNumber || 'Bay 02'} • Ingress In-Transit`,
          bay: r.bayAllocated || te.bayNumber || 'Bay 02',
          doctor: r.toDoctorName || te.doctor || 'Attending Specialist',
          role: `Transferred to ${r.destinationHospital || 'Trauma Hub'}`,
          isReferral: true,
          isLive: true,
        };
        setTriageList((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
        showToast(`🚑 Live Referral Incoming: ${newItem.name} transferred to ${newItem.bay}!`);
      }
    });

    return () => {
      if (unsubTriage) unsubTriage();
      if (unsubReferral) unsubReferral();
    };
  }, [currentUser?.id, currentUser?.registration_id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportDailyReport = () => {
    const csvContent = `E-KAVACH HOSPITAL COMMAND NODE 01 - DAILY OPERATIONS REPORT
Generated: ${new Date().toLocaleString()}
Hospital: Apollo Greams Super-Speciality Trauma Center, Chennai

=== BED STATUS ===
Total Beds: 450
Occupied: 382 (85% Capacity)
Available: 68
ICU Beds: 46/50 Occupied (92% Load - 4 Available)
CCU Beds: 28/32 Occupied (87.5% Load - 4 Available)
Emergency Trauma Bays: 6/8 Occupied (75% Load - 2 Available)

=== ACTIVE PATIENT CENSUS ===
Active Inpatients: 382
Admitted Today: 24
Discharges Pending: 18

=== CLINICAL STAFFING ===
Doctors on Active Duty: 48 (12 Critical Care, 36 General & Specialty)
Nursing & Allied Staff: 36 on duty, 12 off duty

=== EMERGENCY WARD INGRESS ===
Bay 02: Rajesh V. Sharma (ABHA 9824-8819-TN) - Priority 1 (Critical) - Attending: Dr. Kavitha Menon
Bay 04: Meenakshi Sundaram (ABHA 7712-4401-TN) - Priority 2 (Urgent) - Attending: Dr. Arvind Swaminathan
Bay 06: Harish K. Varma (ABHA 4402-9918-TN) - Priority 3 (Stable) - Attending: Dr. Priya Sundaram
Ambulances Ingressing: 3 (Fleet 108)
Grid Latency: 0.04s (TLS 1.3 Verified)`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `E-KAVACH_Daily_Hospital_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daily Hospital Operations Report downloaded successfully.');
  };

  const patientsTelemetry = [
    {
      name: 'Rajesh V. Sharma',
      abha: '9824-8819-TN',
      priority: 'Critical (Priority 1)',
      condition: 'Acute Myocardial Infarction',
      vitals: 'SpO2 88% • BP 190/115 • ST Elevation',
      heartRate: '112 bpm',
      respRate: '24 /min',
      bay: 'Bay 02',
      doctor: 'Dr. Kavitha Menon',
      role: 'Cardiology Response Lead'
    },
    {
      name: 'Meenakshi Sundaram',
      abha: '7712-4401-TN',
      priority: 'Urgent (Priority 2)',
      condition: 'Polytrauma / Compound Fracture',
      vitals: 'Right Femur • Hemodynamically Stable',
      heartRate: '84 bpm',
      respRate: '18 /min',
      bay: 'Bay 04',
      doctor: 'Dr. Arvind Swaminathan',
      role: 'Orthopedic Trauma Consult'
    },
    {
      name: 'Harish K. Varma',
      abha: '4402-9918-TN',
      priority: 'Stable (Priority 3)',
      condition: 'Deep Laceration / Suture',
      vitals: 'Left Forearm • Local Anesthesia Active',
      heartRate: '72 bpm',
      respRate: '16 /min',
      bay: 'Bay 06',
      doctor: 'Dr. Priya Sundaram',
      role: 'Emergency Medical Officer'
    }
  ];

  return (
    <div className="w-full">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#004d6c] text-white rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-xl text-[#02C39A]">verified</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Command Node Notification</span>
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

      {/* Quick Add Staff / Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Add Clinical Personnel</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
              Select the administrative domain to onboard medical professionals to Apollo Greams Command Node.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  navigate('/admin/doctors');
                }}
                className="p-4 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container flex flex-col items-center text-center transition-all group"
                type="button"
              >
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">stethoscope</span>
                </div>
                <span className="font-label-lg text-label-lg font-semibold text-primary">Doctor / Specialist</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant mt-1">NMC Affiliated Clinician</span>
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  navigate('/admin/staff');
                }}
                className="p-4 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container flex flex-col items-center text-center transition-all group"
                type="button"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-primary flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
                <span className="font-label-lg text-label-lg font-semibold text-primary">Clinical &amp; Ward Staff</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant mt-1">Nurses, Pharmacists, Techs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Live Modal */}
      {activeTelemetryPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-container animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {activeTelemetryPatient.bay} • Live Telemetry Stream
                </h3>
              </div>
              <button
                onClick={() => setActiveTelemetryPatient(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mt-4 bg-surface-container-low p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-label-lg text-label-lg font-bold text-primary">{activeTelemetryPatient.name}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">ABHA: {activeTelemetryPatient.abha}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                  {activeTelemetryPatient.priority}
                </span>
              </div>
              <div className="text-xs font-medium text-on-surface mt-1">
                Condition: <span className="font-bold text-primary">{activeTelemetryPatient.condition}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container text-center">
                <div className="text-[11px] text-on-surface-variant uppercase font-semibold">Heart Rate</div>
                <div className="text-lg font-bold text-error flex items-center justify-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-base animate-pulse">favorite</span>
                  {activeTelemetryPatient.heartRate || '102 bpm'}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container text-center">
                <div className="text-[11px] text-on-surface-variant uppercase font-semibold">SpO2</div>
                <div className="text-lg font-bold text-primary mt-1">94%</div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container text-center">
                <div className="text-[11px] text-on-surface-variant uppercase font-semibold">Respiration</div>
                <div className="text-lg font-bold text-secondary mt-1">{activeTelemetryPatient.respRate || '22 /min'}</div>
              </div>
            </div>

            <div className="p-3 bg-[#e6f7f4] rounded-lg text-xs text-[#008774] flex items-center justify-between">
              <span>Attending: <strong>{activeTelemetryPatient.doctor}</strong> ({activeTelemetryPatient.role})</span>
              <span className="material-symbols-outlined text-base">verified</span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setActiveTelemetryPatient(null);
                  navigate('/admin/emergency-ward');
                }}
                className="px-4 py-2 bg-surface-container text-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container-high transition-colors"
                type="button"
              >
                Emergency Ward View
              </button>
              <button
                onClick={() => {
                  setActiveTelemetryPatient(null);
                  navigate('/doctor/patient-history');
                }}
                className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                type="button"
              >
                Open Full Chart
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full">
        <div className="px-grid-margin py-space-xl space-y-space-xl max-w-7xl mx-auto w-full">
          {/* 1. Header / Overview */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs mb-space-2xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> {summaryData.hospitalCode || 'Command Node'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Grid Synchronized (ABDM Tier-3)</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Welcome back, {currentUser?.name || 'Hospital Administrator'}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {summaryData.hospitalName}
              </p>
            </div>
            <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
              <Link
                to="/admin/hospital-details"
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary shadow-sm hover:bg-primary/90 transition-all font-label-lg text-label-lg font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Hospital Setup &amp; Details
              </Link>
              <button
                onClick={handleExportDailyReport}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-low transition-all font-label-lg text-label-lg font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Report
              </button>
            </div>
          </div>

          {/* 2. Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Card 1 */}
            <div
              onClick={() => navigate('/admin/hospital-details')}
              className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Total Beds</span>
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">single_bed</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">{summaryData.totalBeds}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {summaryData.occupiedBeds} Occupied / {summaryData.availableBeds} Available
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1.5"></span>{summaryData.availableBeds} Available ({summaryData.occupancyRate}% Cap)
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => navigate('/admin/patients')}
              className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Active Patients</span>
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">{summaryData.activePatientsCount}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Active Hospital Inpatients Registry</div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container mr-1.5"></span>Admitted &amp; In-Care
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => navigate('/admin/doctors')}
              className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Doctors On Duty</span>
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary-container">
                  <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">{summaryData.doctorsOnDutyCount}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Clinical Personnel Roster</div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1.5 animate-pulse"></span>Active Duty
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => navigate('/admin/hospital-details')}
              className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">ICU Capacity</span>
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">vital_signs</span>
                </div>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">{summaryData.icuLoadPct}%</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {summaryData.icuOccupied} of {summaryData.icuTotal} Beds Occupied
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>{summaryData.icuAvailable} ICU Beds Available
                </span>
              </div>
            </div>
          </div>

          {/* 3. Emergency Ward Priority Command Module */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error"></div>
            <div className="p-space-lg pl-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-error animate-ping absolute opacity-75"></span>
                    <span className="w-3 h-3 rounded-full bg-error relative"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <h2 className="font-headline-md text-headline-md text-primary">Emergency Ward Status</h2>
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold uppercase">Live Ingress</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Bay 5 of 8 Active • <strong className="text-on-surface">3 Ingressing Ambulances</strong> (108 Emergency State Fleet)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">Telemetry Grid Sync: 0.04s</span>
                  <button
                    onClick={() => navigate('/admin/emergency-ward')}
                    className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-medium shadow-sm hover:bg-primary-container transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">bed</span> Manage ER Beds
                  </button>
                </div>
              </div>

              {/* ER Table */}
              <div className="overflow-x-auto mt-space-sm">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                      <th className="px-space-md py-3 rounded-l-lg">Patient &amp; ABHA ID</th>
                      <th className="px-space-md py-3">Triage Level</th>
                      <th className="px-space-md py-3">Presenting Condition</th>
                      <th className="px-space-md py-3">Bay Allocated</th>
                      <th className="px-space-md py-3">Attending Specialist</th>
                      <th className="px-space-md py-3 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {triageList.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="px-space-md py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-label-lg text-label-lg font-semibold text-primary">{p.name}</span>
                            {p.isReferral && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                                REFERRAL
                              </span>
                            )}
                          </div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">ABHA: {p.abha}</div>
                        </td>
                        <td className="px-space-md py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${
                            p.priority.includes('Critical') || p.priority.includes('Priority 1')
                              ? 'bg-error-container text-on-error-container'
                              : p.priority.includes('Urgent') || p.priority.includes('Priority 2')
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-surface-container-high text-on-surface-variant'
                          } font-label-sm text-label-sm font-semibold`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              p.priority.includes('Critical') || p.priority.includes('Priority 1')
                                ? 'bg-error'
                                : p.priority.includes('Urgent') || p.priority.includes('Priority 2')
                                ? 'bg-secondary'
                                : 'bg-outline'
                            }`}></span>
                            {p.priority}
                          </span>
                        </td>
                        <td className="px-space-md py-3.5">
                          <span className="font-body-md text-body-md text-on-surface font-medium">{p.condition}</span>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">{p.vitals}</div>
                        </td>
                        <td className="px-space-md py-3.5">
                          <span className="px-2 py-1 rounded bg-surface-container-high text-primary font-label-md text-label-md font-bold">{p.bay}</span>
                        </td>
                        <td className="px-space-md py-3.5">
                          <div className="text-on-surface font-body-md text-body-md font-medium">{p.doctor}</div>
                          <div className="text-on-surface-variant font-label-sm text-label-sm">{p.role}</div>
                        </td>
                        <td className="px-space-md py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setActiveTelemetryPatient(p)}
                            className="inline-flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm font-semibold cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                            View Triage Telemetry
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Split Row: Staff Management & Doctor Management Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Staff Directory &amp; Rosters</h3>
                </div>
                <p className="text-xs text-on-surface-variant">48 total personnel • 36 active on shift across wards and labs.</p>
              </div>
              <Link
                to="/admin/staff"
                className="px-4 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high font-label-sm text-label-sm font-semibold transition-colors no-underline"
              >
                Manage Staff
              </Link>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">stethoscope</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Doctor Credential Registry</h3>
                </div>
                <p className="text-xs text-on-surface-variant">22 affiliated physicians • 14 available for consults right now.</p>
              </div>
              <Link
                to="/admin/doctors"
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm font-semibold transition-colors no-underline"
              >
                Manage Doctors
              </Link>
            </div>
          </div>

          {/* 5. Split Row: Patient Management & Pharmaceutical Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-secondary text-[20px]">personal_injury</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Patient Admissions &amp; Ingress</h3>
                </div>
                <p className="text-xs text-on-surface-variant">156 registered patients • 84 active inpatients in care.</p>
              </div>
              <Link
                to="/admin/patients"
                className="px-4 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high font-label-sm text-label-sm font-semibold transition-colors no-underline"
              >
                Patient Registry
              </Link>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">medication</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Pharmacy &amp; Crash Carts</h3>
                </div>
                <p className="text-xs text-on-surface-variant">1,420 formulations • 100% armed crash-cart reserves.</p>
              </div>
              <Link
                to="/admin/pharmacy"
                className="px-4 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high font-label-sm text-label-sm font-semibold transition-colors no-underline"
              >
                Pharmacy Stock
              </Link>
            </div>
          </div>

          {/* 6. Bottom Module: Connected Hospitals & ABDM Trauma Grid */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">hub</span>
              </div>
              <div>
                <div className="font-label-lg text-label-lg font-bold text-primary">National Trauma Grid &amp; Hospital Network</div>
                <p className="text-xs text-on-surface-variant">12 partner hospitals actively paired via ABDM FHIR exchange for mutual bed transfers.</p>
              </div>
            </div>
            <Link
              to="/admin/network"
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold transition-colors whitespace-nowrap no-underline"
            >
              Open Hospital Network Grid
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
