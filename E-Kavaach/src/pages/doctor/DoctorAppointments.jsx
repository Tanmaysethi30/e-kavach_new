import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  const [pendingList, setPendingList] = useState([
    {
      id: 'anand',
      initials: 'RP',
      color: 'bg-[#0B1F3A]',
      name: 'Anand R. Patel',
      meta: '• 54y / M',
      badge1: 'High Acuity',
      badge1Color: 'bg-[#E4E4FB] text-[#3730A3]',
      badge2: 'Action Required',
      timeText: 'Tomorrow, 25 Oct 2026 • 10:30 AM (In-person, Bay 3 Cath Lab)',
      reason: 'Follow-up: Post-cardiac consult & stent evaluation',
      abha: 'ABHA: 9812-4410-TN',
      specialty: 'cardio'
    },
    {
      id: 'meenakshi',
      initials: 'MS',
      color: 'bg-[#028090]',
      name: 'Meenakshi Sundaram',
      meta: '• 42y / F',
      badge1: null,
      badge2: 'Action Required',
      timeText: 'Tomorrow, 25 Oct 2026 • 02:15 PM (Cardiac Diagnostic Lab)',
      reason: 'Palpitations & Exercise ECG Treadmill Review',
      abha: 'ABHA: 9845-6612-TN',
      specialty: 'cardio'
    },
    {
      id: 'vikramaditya',
      initials: 'VS',
      color: 'bg-slate-700',
      name: 'Vikramaditya Sen',
      meta: '• 61y / M',
      badge1: 'Standard Review',
      badge1Color: 'bg-[#E4E4FB] text-[#3730A3]',
      badge2: 'Teleconsult',
      badge2Color: 'bg-[#E6FFFA] text-[#028090]',
      timeText: 'Monday, 27 Oct 2026 • 11:00 AM (Teleconsult / Video)',
      reason: 'Hypertension Med Adjustment & Ambulatory BP Review',
      abha: 'ABHA: 9112-5509-WB',
      specialty: 'teleconsult'
    },
    {
      id: 'devi',
      initials: 'DR',
      color: 'bg-[#0B1F3A]',
      name: 'Devi Radhakrishnan',
      meta: '• 38y / F',
      badge1: 'Cardio OPD',
      badge1Color: 'bg-[#E4E4FB] text-[#3730A3]',
      badge2: null,
      timeText: 'Tuesday, 28 Oct 2026 • 09:45 AM (OPD Consultation)',
      reason: 'Post-thrombolytic symptom checkup & lipid profile sync',
      abha: 'ABHA: 9341-8902-KL',
      specialty: 'cardio'
    },
    {
      id: 'karan',
      initials: 'KJ',
      color: 'bg-slate-600',
      name: 'Karan J. Sharma',
      meta: '• 49y / M',
      badge1: 'Imaging / Echo',
      badge1Color: 'bg-[#E6FFFA] text-[#028090]',
      badge2: null,
      timeText: 'Wednesday, 29 Oct 2026 • 04:30 PM (Echocardiogram Review)',
      reason: 'Second opinion on aortic valve clearance',
      abha: 'ABHA: 9021-3489-DL',
      specialty: 'echo'
    }
  ]);

  const [confirmedCount, setConfirmedCount] = useState(12);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleApprove = (patient) => {
    setPendingList(prev => prev.filter(p => p.id !== patient.id));
    setConfirmedCount(c => c + 1);
    showToast(`Approved appointment for ${patient.name}. Verified through ABDM registry.`);
  };

  const handleDecline = (patient) => {
    setPendingList(prev => prev.filter(p => p.id !== patient.id));
    showToast(`Appointment request for ${patient.name} flagged for reschedule.`);
  };

  const cycleSpecialtyFilter = () => {
    const filters = ['all', 'cardio', 'echo', 'teleconsult'];
    const nextIdx = (filters.indexOf(specialtyFilter) + 1) % filters.length;
    setSpecialtyFilter(filters[nextIdx]);
    showToast(`Filtered by specialty: ${filters[nextIdx].toUpperCase()}`);
  };

  const filteredPending = pendingList.filter(p => {
    if (specialtyFilter === 'all') return true;
    return p.specialty === specialtyFilter;
  });

  return (
    <div className="w-full">
      {toastMsg && (
        <div className="mb-4 p-3 rounded-xl bg-[#E6FFFA] border border-[#02C39A]/30 text-[#028090] font-label-md text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg('')} className="text-[#028090] hover:opacity-75">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
      {/* Page Header Section */}
<section className="bg-white border border-[#E0E3E6] rounded-[14px] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
<div className="flex flex-col gap-1.5">
<div className="flex items-center gap-2 mb-0.5">
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E4E4FB] text-[#0B1F3A] text-[11px] font-bold tracking-wider font-space uppercase">
<span className="w-1.5 h-1.5 rounded-full bg-[#0B1F3A] animate-pulse"></span>
        CLINICIAN DESK
      </span>
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6FFFA] border border-[#02C39A]/30 text-[#028090] text-[11px] font-semibold">
<span className="material-symbols-outlined text-[12px]">calendar_month</span>
        Bay 3 Interventional Unit
      </span>
</div>
<h1 className="font-space text-2xl lg:text-[32px] font-bold text-[#0B1F3A] tracking-tight leading-tight">
      Appointment Approvals
    </h1>
<p className="text-sm text-slate-500 font-normal">
      Review and manage incoming appointment requests.
    </p>
</div>
<div className="flex items-center gap-3 shrink-0 flex-wrap">
{/* Amber Pending Pill */}
<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20 font-semibold text-xs tracking-wide shadow-sm">
<span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
<span>{pendingList.length} Pending Approval</span>
</div>
<button onClick={cycleSpecialtyFilter} className="inline-flex items-center gap-2 h-10 px-4 rounded-[14px] bg-white border border-[#E0E3E6] text-[#0B1F3A] hover:bg-slate-50 font-semibold text-xs tracking-wide transition-all shadow-sm cursor-pointer" type="button">
<span className="material-symbols-outlined text-[17px] text-slate-500">filter_list</span>
      Filter by Specialty {specialtyFilter !== 'all' ? `(${specialtyFilter.toUpperCase()})` : ''}
    </button>
<button onClick={() => showToast('Shift schedule: 08:00 - 16:00 • Bay 3 Interventional Unit • Active')} className="inline-flex items-center gap-2 h-10 px-4 rounded-[14px] bg-[#0B1F3A] hover:bg-[#132a4e] text-white font-semibold text-xs tracking-wide transition-all shadow-sm cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">schedule</span>
      Shift Schedule: Today
    </button>
</div>
</section>
{/* Quick KPI Metric Summary Strip */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-5">
<div className="bg-white border border-[#E0E3E6] rounded-[14px] p-5 shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-space">AWAITING CLINICIAN REVIEW</span>
<span className="font-space text-[28px] font-bold text-[#D97706] mt-1 leading-tight">{pendingList.length} <span className="text-sm font-semibold text-slate-600">Pending</span></span>
<span className="text-xs text-slate-500 mt-1">2 high acuity priority requests</span>
</div>
<div className="w-12 h-12 rounded-[14px] bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
<span className="material-symbols-outlined text-[24px]">pending_actions</span>
</div>
</div>
<div className="bg-white border border-[#E0E3E6] rounded-[14px] p-5 shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-space">CONFIRMED SESSIONS TODAY</span>
<span className="font-space text-[28px] font-bold text-[#0B1F3A] mt-1 leading-tight">{confirmedCount} <span className="text-sm font-semibold text-slate-600">Confirmed</span></span>
<span className="text-xs text-slate-500 mt-1">Next session at 03:00 PM</span>
</div>
<div className="w-12 h-12 rounded-[14px] bg-[#E6FFFA] flex items-center justify-center text-[#00A896]">
<span className="material-symbols-outlined text-[24px]">check_circle</span>
</div>
</div>
<div className="bg-white border border-[#E0E3E6] rounded-[14px] p-5 shadow-sm flex items-center justify-between">
<div className="flex flex-col">
<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-space">VIRTUAL CONSULTATIONS</span>
<span className="font-space text-[28px] font-bold text-[#0B1F3A] mt-1 leading-tight">3 <span className="text-sm font-semibold text-slate-600">Teleconsults</span></span>
<span className="text-xs text-slate-500 mt-1">Encrypted ABHA tele-link active</span>
</div>
<div className="w-12 h-12 rounded-[14px] bg-[#E4E4FB] flex items-center justify-center text-[#3730A3]">
<span className="material-symbols-outlined text-[24px]">videocam</span>
</div>
</div>
</section>
{/* 4. Pending Appointments Module (Main Focus, Top) */}
<section className="bg-white border border-[#E0E3E6] rounded-[14px] shadow-sm overflow-hidden">
<div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-[12px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
<span className="material-symbols-outlined text-[22px]">assignment_late</span>
</div>
<div>
<div className="flex items-center gap-2.5">
<h2 className="font-space text-lg font-bold text-[#0B1F3A]">Pending Appointments</h2>
<span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20 text-[11px] font-bold font-space">
            {pendingList.length} Requests
          </span>
</div>
<p className="text-xs text-slate-500 mt-0.5">Review clinical priority, triage notes, and approve or propose alternative slots</p>
</div>
</div>
<span className="text-xs text-slate-400 font-mono">Average Approval Turnaround: 8.4 mins</span>
</div>
{/* Clean Rows List */}
<div className="flex flex-col divide-y divide-slate-100">
  {filteredPending.length === 0 ? (
    <div className="p-8 text-center text-slate-500 text-sm">
      All appointment requests have been processed.
    </div>
  ) : (
    filteredPending.map((p) => (
      <div key={p.id} className="p-5 hover:bg-[#F8FAFC] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-space font-bold text-sm shrink-0 mt-0.5 ${p.color}`}>
            {p.initials}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-space font-bold text-base text-[#0B1F3A]">{p.name}</span>
              <span className="text-xs font-medium text-slate-500">{p.meta}</span>
              {p.badge1 && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-space uppercase ${p.badge1Color}`}>
                  {p.badge1}
                </span>
              )}
              {p.badge2 && (
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${p.badge2Color || 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20'}`}>
                  {p.badge2}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {p.timeText}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
              <span className="material-symbols-outlined text-[15px] text-slate-400">notes</span>
              <span>Reason: <strong className="text-slate-700 font-medium">{p.reason}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[11px]">{p.abha}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          <button onClick={() => handleDecline(p)} className="h-9 px-4 rounded-[10px] border border-slate-300 bg-white hover:bg-slate-50 text-[#0B1F3A] font-semibold text-xs transition-colors shadow-sm cursor-pointer" type="button">
            Reschedule / Decline
          </button>
          <button onClick={() => handleApprove(p)} className="h-9 px-5 rounded-[10px] bg-[#00A896] hover:bg-[#028090] text-white font-semibold text-xs tracking-wide transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer" type="button">
            <span className="material-symbols-outlined text-[16px]">check</span>
            Approve
          </button>
        </div>
      </div>
    ))
  )}
</div>
</section>
{/* 5. Upcoming Approved Appointments (Below, Secondary) */}
<section className="bg-white border border-[#E0E3E6] rounded-[14px] shadow-sm overflow-hidden flex flex-col">
<div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-[12px] bg-[#E6FFFA] text-[#00A896] flex items-center justify-center">
<span className="material-symbols-outlined text-[22px]">event_available</span>
</div>
<div>
<div className="flex items-center gap-2">
<h2 className="font-space text-lg font-bold text-[#0B1F3A]">Upcoming Approved Appointments</h2>
<span className="text-xs font-medium text-slate-500">(8 scheduled today &amp; tomorrow)</span>
</div>
<p className="text-xs text-slate-500 mt-0.5">Confirmed consultations verified through ABDM registry</p>
</div>
</div>
<div className="flex items-center gap-2">
<button onClick={() => showToast('ABDM Clinical Calendar synchronized: 12 sessions scheduled today.')} className="h-8 px-3 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer" type="button">
<span className="material-symbols-outlined text-[15px]">calendar_today</span>
        Open Calendar View
      </button>
</div>
</div>
{/* Table-style List */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-100 bg-[#F8FAFC] text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-space">
<th className="py-3.5 px-6">Patient Name</th>
<th className="py-3.5 px-6">Date &amp; Time</th>
<th className="py-3.5 px-6">Location / Unit</th>
<th className="py-3.5 px-6">Primary Clinician</th>
<th className="py-3.5 px-6">Status</th>
<th className="py-3.5 px-6 text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
{/* Row 1 */}
<tr className="hover:bg-[#F7F9FD] transition-colors">
<td className="py-4 px-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-200 text-[#0B1F3A] flex items-center justify-center font-space font-bold text-xs">
                RS
              </div>
<div>
<span className="font-bold text-[#0B1F3A] block">Rajesh V. Sharma</span>
<span className="text-[11px] text-slate-400 font-mono">ABHA: 9824-8819-TN</span>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-600">
<span className="font-semibold text-slate-800">Today, 24 Oct 2026</span><br />
<span className="text-[11px] text-slate-500">03:00 PM (IST)</span>
</td>
<td className="py-4 px-6 text-slate-600">
<span>Bay 3 Room 4</span><br />
<span className="text-[11px] text-slate-400">In-person consult</span>
</td>
<td className="py-4 px-6">
<span className="text-[#0B1F3A] font-semibold">Dr. Kavitha Menon</span>
</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6FFFA] text-[#00A896] border border-[#02C39A]/30 text-[11px] font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A896]"></span>
              Approved
            </span>
</td>
<td className="py-4 px-6 text-right">
<Link to="/doctor/patient-history" className="text-xs font-semibold text-[#00A896] hover:underline">
              View Chart →
            </Link>
</td>
</tr>
{/* Row 2 */}
<tr className="hover:bg-[#F7F9FD] transition-colors">
<td className="py-4 px-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-[#E4E4FB] text-[#3730A3] flex items-center justify-center font-space font-bold text-xs">
                LN
              </div>
<div>
<span className="font-bold text-[#0B1F3A] block">Smt. Lakshmi Narayanan</span>
<span className="text-[11px] text-slate-400 font-mono">ABHA: 8901-4471-TN</span>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-600">
<span className="font-semibold text-slate-800">Today, 24 Oct 2026</span><br />
<span className="text-[11px] text-slate-500">04:30 PM (IST)</span>
</td>
<td className="py-4 px-6 text-slate-600">
<span>Pacemaker Telemetry Check</span><br />
<span className="text-[11px] text-slate-400">Bay 3 Room 2</span>
</td>
<td className="py-4 px-6">
<span className="text-[#0B1F3A] font-semibold">Dr. Kavitha Menon</span>
</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6FFFA] text-[#00A896] border border-[#02C39A]/30 text-[11px] font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A896]"></span>
              Approved
            </span>
</td>
<td className="py-4 px-6 text-right">
<Link to="/doctor/patient-history" className="text-xs font-semibold text-[#00A896] hover:underline">
              View Chart →
            </Link>
</td>
</tr>
{/* Row 3 */}
<tr className="hover:bg-[#F7F9FD] transition-colors">
<td className="py-4 px-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-200 text-[#0B1F3A] flex items-center justify-center font-space font-bold text-xs">
                HV
              </div>
<div>
<span className="font-bold text-[#0B1F3A] block">Harish K. Varma</span>
<span className="text-[11px] text-slate-400 font-mono">ABHA: 7810-9011-AP</span>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-600">
<span className="font-semibold text-slate-800">Tomorrow, 25 Oct 2026</span><br />
<span className="text-[11px] text-slate-500">09:15 AM (IST)</span>
</td>
<td className="py-4 px-6 text-slate-600">
<span>Pre-Op Cardiac Clearance</span><br />
<span className="text-[11px] text-slate-400">Cath Prep 1</span>
</td>
<td className="py-4 px-6">
<span className="text-[#0B1F3A] font-semibold">Dr. Kavitha Menon</span>
</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6FFFA] text-[#00A896] border border-[#02C39A]/30 text-[11px] font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A896]"></span>
              Approved
            </span>
</td>
<td className="py-4 px-6 text-right">
<Link to="/doctor/patient-history" className="text-xs font-semibold text-[#00A896] hover:underline">
              View Chart →
            </Link>
</td>
</tr>
{/* Row 4 */}
<tr className="hover:bg-[#F7F9FD] transition-colors">
<td className="py-4 px-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-[#E6FFFA] text-[#028090] flex items-center justify-center font-space font-bold text-xs">
                SM
              </div>
<div>
<span className="font-bold text-[#0B1F3A] block">Shalini Mohan</span>
<span className="text-[11px] text-slate-400 font-mono">ABHA: 9912-7801-TN</span>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-600">
<span className="font-semibold text-slate-800">Tomorrow, 25 Oct 2026</span><br />
<span className="text-[11px] text-slate-500">11:45 AM (IST)</span>
</td>
<td className="py-4 px-6 text-slate-600">
<span>Stress Echocardiogram</span><br />
<span className="text-[11px] text-slate-400">Lab 2</span>
</td>
<td className="py-4 px-6">
<span className="text-[#0B1F3A] font-semibold">Dr. Kavitha Menon</span>
</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6FFFA] text-[#00A896] border border-[#02C39A]/30 text-[11px] font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-[#00A896]"></span>
              Approved
            </span>
</td>
<td className="py-4 px-6 text-right">
<Link to="/doctor/patient-history" className="text-xs font-semibold text-[#00A896] hover:underline">
              View Chart →
            </Link>
</td>
</tr>
</tbody>
</table>
</div>
</section>
    </div>
  );
}
