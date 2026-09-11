import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AddPatient() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [lastAddedPatient, setLastAddedPatient] = useState(null);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    initialNotes: '',
    age: '',
    gender: '',
    bloodGroup: '',
    allergies: ''
  });

  const [recentPatients, setRecentPatients] = useState([
    {
      id: 'ks',
      initials: 'KS',
      name: 'Kaviarasan S.',
      tempId: '#EK-8839',
      status: 'Active Bay 04',
      phone: '+91 98402 11982',
      timeText: 'Added 18m ago',
      category: 'Routine Walk-in',
      avatarBg: 'bg-surface-container-high text-primary'
    },
    {
      id: 'dv',
      initials: 'DV',
      name: 'Deepa Venkataraman',
      tempId: '#EK-8838',
      status: 'ECG Queued',
      phone: '+91 97910 44210',
      timeText: 'Added 1h 12m ago',
      category: 'OPD Referral',
      avatarBg: 'bg-primary-fixed text-primary'
    },
    {
      id: 'mf',
      initials: 'MF',
      name: 'Mohamed Farooq',
      tempId: '#EK-8837',
      status: 'Consult Completed',
      phone: '+91 94441 55670',
      timeText: 'Added 2h 45m ago',
      category: 'Follow-up Intake',
      avatarBg: 'bg-surface-container text-primary'
    }
  ]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    const initials = formData.fullName
      .trim()
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const randomId = '#EK-' + Math.floor(1000 + Math.random() * 9000);
    const newPatientRecord = {
      id: Date.now().toString(),
      initials: initials || 'PT',
      name: formData.fullName.trim(),
      tempId: randomId,
      status: 'Admitted Bay 03',
      phone: '+91 ' + (formData.contactNumber || '98400 00000'),
      timeText: 'Added just now',
      category: 'Immediate Ingress',
      avatarBg: 'bg-secondary-container text-on-secondary-container',
      ...formData
    };

    setRecentPatients(prev => [newPatientRecord, ...prev]);
    setLastAddedPatient(newPatientRecord);
    setSubmitted(true);
    showToast(`Patient ${formData.fullName} onboarded with ID ${randomId}`);

    // Reset form
    setFormData({
      fullName: '',
      contactNumber: '',
      initialNotes: '',
      age: '',
      gender: '',
      bloodGroup: '',
      allergies: ''
    });
  };

  const handlePrintWristband = () => {
    showToast(`Thermal wristband label queued for printing on Bay 3 station.`);
    window.print();
  };
  return (
    <div className="w-full">
      <div className="flex flex-col w-full max-w-5xl mx-auto pb-space-2xl">
{toastMsg && (
        <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-label-md text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg('')} className="text-teal-800 hover:opacity-75">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
      {/* Top Context Header */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs mb-1">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Registration Module • Bay Ingress</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Shift #42-B</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Add New Patient</h1>
<p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Manually onboard walk-in, urgent transfer, or referred patients into E-KAVACH core records.</p>
</div>
<div className="flex items-center gap-space-sm self-start md:self-auto">
<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-medium">Manual Ingress Portal</span>
</div>
<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
<span className="material-symbols-outlined text-[16px] text-secondary">sync</span>
<span>Node Sync: Real-time</span>
</div>
</div>
</div>
{/* Confirmation Banner (Simulated recent completion / active intake cue) */}
<div id="confirmationBanner" className={submitted ? "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 mb-6" : "hidden"}>
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-secondary/5 rounded-lg p-space-md">
<div className="flex items-start sm:items-center gap-space-md">
<div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-on-secondary shadow-sm">
<span className="material-symbols-outlined text-[22px]">check</span>
</div>
<div className="flex flex-col">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-primary font-bold">Patient Added Successfully</span>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold tracking-wide">
              Temp ID: {lastAddedPatient ? lastAddedPatient.tempId : '#EK-2026-8841'}
            </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Biometric sync initialized. Provisional ABHA mapped to <span className="font-semibold text-on-surface">9102-4820-TN</span> with verified timestamp.
          </p>
</div>
</div>
<div className="flex items-center gap-space-xs pl-14 sm:pl-0">
<button onClick={handlePrintWristband} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-label-md text-label-md font-medium shadow-sm cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px] text-secondary">print</span>
<span>Print Wristband Label</span>
</button>
<button onClick={() => navigate('/doctor/patient-history')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-label-md font-medium shadow-sm cursor-pointer" type="button">
<span>Open Clinical Chart</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
</div>
{/* Main Patient Ingress Form Card */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-xl">
{/* Header with Quick Action */}
<div className="p-space-lg bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-start gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[22px]">person_add</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-sm text-headline-sm text-primary font-bold">Quick Ingress Registration</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Fast intake for walk-ins, outpatient overflow, and transfer arrivals awaiting biometric scan.</p>
</div>
</div>
<div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm self-start sm:self-auto">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
<span>Standard Triage Protocol</span>
</div>
</div>
{/* The Form */}
<form className="p-space-lg flex flex-col gap-6" id="newPatientForm" onSubmit={handleSubmit}>
{/* Full Name */}
<div className="flex flex-col gap-1.5">
<label className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center justify-between" htmlFor="fullName">
<span>Full Legal Name <span className="text-secondary">*</span></span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Matches Government or ABHA ID</span>
</label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">person</span>
<input value={formData.fullName} onChange={handleInputChange} className="w-full h-11 pl-11 pr-space-md bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all" id="fullName" name="fullName" placeholder="e.g., Saravanan Ramanathan" required type="text" />
</div>
</div>
{/* Contact Number with Country Prefix */}
<div className="flex flex-col gap-1.5">
<label className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center justify-between" htmlFor="contactNumber">
<span className="">Primary Contact Number <span className="text-secondary">*</span></span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-normal">SMS OTP &amp; WhatsApp Notifications</span>
</label>
<div className="relative flex items-center">
<div className="absolute left-3.5 flex items-center gap-1.5 text-on-surface-variant pointer-events-none">
<span className="material-symbols-outlined text-[18px]">call</span>
<span className="font-label-md text-label-md font-semibold text-on-surface pr-2">+91</span>
</div>
<input value={formData.contactNumber} onChange={handleInputChange} className="w-full h-11 pl-20 pr-space-md bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all" id="contactNumber" maxLength="10" name="contactNumber" placeholder="98400 00000" required type="tel" />
</div>
</div>
{/* Initial Clinical Notes / Chief Complaint */}
<div className="flex flex-col gap-1.5">
<label className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center justify-between" htmlFor="initialNotes">
<span>Initial Notes &amp; Chief Complaint</span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-normal">Max 500 characters</span>
</label>
<div className="relative">
<textarea value={formData.initialNotes} onChange={handleInputChange} className="w-full p-3.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all resize-y" id="initialNotes" name="initialNotes" placeholder="Reason for visit, observed symptoms, triage acuity, or relevant arrival context..." rows="4"></textarea>
</div>
</div>
{/* Collapsible Additional Details */}
<div className="rounded-lg bg-surface-container-low p-space-md transition-all">
<button onClick={() => setIsAdditionalOpen(!isAdditionalOpen)} className="w-full flex items-center justify-between text-left group cursor-pointer" id="toggleAdditionalBtn" type="button">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Additional Details (Optional)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Age, gender, declared allergies, and provisional blood group</span>
</div>
</div>
<div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-on-surface">
<span className="material-symbols-outlined text-[20px] transition-transform duration-200" id="collapseIcon">{isAdditionalOpen ? 'expand_less' : 'expand_more'}</span>
</div>
</button>
{/* Expandable Content Grid */}
<div className={`mt-space-md pt-space-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md ${isAdditionalOpen ? 'block' : 'hidden'}`} id="additionalDetailsGrid">
{/* Age */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md font-medium text-on-surface" htmlFor="age">Age</label>
<div className="relative flex items-center">
<input value={formData.age} onChange={handleInputChange} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary transition-all" id="age" max="125" min="0" name="age" placeholder="45" type="number" />
<span className="absolute right-3 font-label-sm text-label-sm text-on-surface-variant pointer-events-none">Years</span>
</div>
</div>
{/* Gender */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md font-medium text-on-surface" htmlFor="gender">Gender</label>
<div className="relative flex items-center">
<select value={formData.gender} onChange={handleInputChange} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-8" id="gender" name="gender">
<option value="">Select</option>
<option value="male">Male</option>
<option value="female">Female</option>
<option value="other">Other</option>
<option value="undisclosed">Prefer not to say</option>
</select>
<span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant pointer-events-none text-[18px]">keyboard_arrow_down</span>
</div>
</div>
{/* Blood Group */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md font-medium text-on-surface" htmlFor="bloodGroup">Blood Group</label>
<div className="relative flex items-center">
<select value={formData.bloodGroup} onChange={handleInputChange} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-8" id="bloodGroup" name="bloodGroup">
<option value="">Unknown</option>
<option value="O+">O+ (Positive)</option>
<option value="O-">O- (Negative)</option>
<option value="A+">A+ (Positive)</option>
<option value="A-">A- (Negative)</option>
<option value="B+">B+ (Positive)</option>
<option value="B-">B- (Negative)</option>
<option value="AB+">AB+ (Positive)</option>
<option value="AB-">AB- (Negative)</option>
</select>
<span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant pointer-events-none text-[18px]">keyboard_arrow_down</span>
</div>
</div>
{/* Allergies */}
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md font-medium text-on-surface flex items-center justify-between" htmlFor="allergies">
<span>Known Allergies</span>
<span className="material-symbols-outlined text-[14px] text-on-surface-variant" title="Specify drugs, latex, or food">info</span>
</label>
<input value={formData.allergies} onChange={handleInputChange} className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary transition-all" id="allergies" name="allergies" placeholder="e.g., Penicillin, Sulfa" type="text" />
</div>
</div>
</div>
{/* Action Buttons Bar */}
<div className="pt-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-sm">
<button className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-all shadow-sm active:scale-[0.99] cursor-pointer" type="submit">
<span className="material-symbols-outlined text-[20px]">how_to_reg</span>
<span>Save Patient</span>
</button>
<button className="inline-flex items-center justify-center px-5 h-11 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg font-medium hover:bg-surface-container-high transition-all cursor-pointer" type="reset">
            Cancel
          </button>
</div>
<div className="flex items-center gap-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
<span className="font-body-sm text-body-sm">Generates instant biometric QR &amp; ABHA sync token</span>
</div>
</div>
</form>
</div>
{/* Recently Added Patients Table Section */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
{/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md mb-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">history</span>
</div>
<div className="flex items-center gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Recently Added</h3>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
            {recentPatients.length} Onboarded Today
          </span>
</div>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Patients registered during current active trauma shift.</p>
</div>
{/* Rows List */}
<div className="flex flex-col divide-y divide-surface-container-low">
  {recentPatients.map((pt) => (
    <div key={pt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm hover:bg-surface-container-low/60 rounded-lg px-2 transition-all animate-fade-in">
      <div className="flex items-center gap-space-md min-w-0">
        <div className={`w-10 h-10 rounded-full font-headline-sm text-headline-sm flex items-center justify-center flex-shrink-0 font-bold ${pt.avatarBg}`}>
          {pt.initials}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">{pt.name}</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-mono font-medium">{pt.tempId}</span>
            <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>{pt.status}</span>
            </span>
          </div>
          <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <span>{pt.phone}</span>
            <span>•</span>
            <span>{pt.timeText}</span>
            <span>•</span>
            <span>{pt.category}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-sm self-end sm:self-center pl-12 sm:pl-0">
        <button onClick={() => navigate('/doctor/patient-history')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md font-medium transition-all group cursor-pointer" type="button">
          <span>View Chart</span>
          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </button>
      </div>
    </div>
  ))}
</div>
</div>
</div>
    </div>
  );
}
