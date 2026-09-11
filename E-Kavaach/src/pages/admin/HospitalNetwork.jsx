import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HospitalNetwork() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [transferModalHospital, setTransferModalHospital] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [newConnectNode, setNewConnectNode] = useState({
    name: '',
    location: '',
    cluster: 'chennai',
    specialties: 'General Trauma, Emergency'
  });

  const initialHospitals = [
    {
      id: 'HOSP-1',
      name: 'AIIMS New Delhi Trauma Center',
      subtext: 'Apex National Super-Specialty Center • ABDM Tier-1 Node',
      location: 'Ansari Nagar, New Delhi',
      subloc: 'National Central Hub • PIN 110029',
      icuBeds: 14,
      wardBeds: 42,
      specialties: 'Polytrauma, Neurotrauma, Hyperbaric O2',
      status: 'connected',
      region: 'national',
      icon: 'local_hospital'
    },
    {
      id: 'HOSP-2',
      name: 'Fortis Malar Hospital',
      subtext: 'Super-Specialty Trauma & Critical Care Unit',
      location: 'Adyar, Chennai, Tamil Nadu',
      subloc: 'South Chennai Node • 4.8 km away',
      icuBeds: 8,
      wardBeds: 22,
      specialties: 'Cardiothoracic, ECMO Support, Burns',
      status: 'connected',
      region: 'chennai south',
      icon: 'domain'
    },
    {
      id: 'HOSP-3',
      name: 'Stanley Medical College & Hospital',
      subtext: 'Government Medical College & State Trauma Center',
      location: 'Royapuram, Chennai, Tamil Nadu',
      subloc: 'North Chennai Node • 8.2 km away',
      icuBeds: 19,
      wardBeds: 60,
      specialties: 'Micro-Reconstructive, Toxicological Emergency',
      status: 'connected',
      region: 'chennai',
      icon: 'emergency'
    },
    {
      id: 'HOSP-4',
      name: 'Manipal Hospital Old Airport Road',
      subtext: 'Tertiary Multi-Specialty & Organ Transplant Center',
      location: 'Bengaluru, Karnataka',
      subloc: 'Inter-State Corridor Node • 290 km',
      icuBeds: 11,
      wardBeds: 34,
      specialties: 'Organ Retrieval, Interventional Radiology',
      status: 'connected',
      region: 'south',
      icon: 'corporate_fare'
    },
    {
      id: 'HOSP-5',
      name: 'Sankara Eye Institute & Multi-Specialty',
      subtext: 'Specialized Tertiary Eye & Emergency Trauma Node',
      location: 'Pammal, Chennai, Tamil Nadu',
      subloc: 'South-West Chennai • 11.4 km away',
      icuBeds: 0,
      wardBeds: 12,
      specialties: 'Ophthalmic Trauma, Maxillofacial Repair',
      status: 'pending',
      region: 'chennai south',
      icon: 'visibility'
    },
    {
      id: 'HOSP-6',
      name: 'Gleneagles HealthCity',
      subtext: 'Hepato-Biliary & Critical Care Supercluster',
      location: 'Perumbakkam, Chennai, Tamil Nadu',
      subloc: 'OMR Sub-Hub • 14.1 km away',
      icuBeds: 6,
      wardBeds: 18,
      specialties: 'Hepatic Trauma, Multi-Organ Failure Unit',
      status: 'connected',
      region: 'chennai south',
      icon: 'medical_information'
    },
    {
      id: 'HOSP-7',
      name: 'Christian Medical College (CMC) Vellore',
      subtext: 'National Level-1 Trauma & Research Facility',
      location: 'Ida Scudder Road, Vellore, Tamil Nadu',
      subloc: 'Regional Apex Node • 138 km away',
      icuBeds: 0,
      wardBeds: 45,
      specialties: 'Trauma Resuscitation, Specialized Surgery',
      status: 'pending',
      region: 'south',
      icon: 'health_and_safety'
    }
  ];

  const [hospitals, setHospitals] = useState(() => {
    const saved = localStorage.getItem('ekavach_hospital_network');
    return saved ? JSON.parse(saved) : initialHospitals;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestConnection = (e) => {
    e.preventDefault();
    if (!newConnectNode.name.trim()) {
      showToast('Please enter hospital name.');
      return;
    }
    const item = {
      id: `HOSP-${Date.now()}`,
      name: newConnectNode.name,
      subtext: 'ABDM Health Exchange Node • Verification in progress',
      location: newConnectNode.location || 'Chennai, Tamil Nadu',
      subloc: 'Regional Node',
      icuBeds: 5,
      wardBeds: 20,
      specialties: newConnectNode.specialties,
      status: 'pending',
      region: newConnectNode.cluster,
      icon: 'domain'
    };

    const updated = [item, ...hospitals];
    setHospitals(updated);
    localStorage.setItem('ekavach_hospital_network', JSON.stringify(updated));
    setShowConnectModal(false);
    setNewConnectNode({ name: '', location: '', cluster: 'chennai', specialties: 'General Trauma, Emergency' });
    showToast(`Invitation dispatched to ${item.name} via ABDM FHIR Protocol.`);
  };

  const handleResendInvite = (h) => {
    showToast(`Resent cryptographic handshake invitation to ${h.name}.`);
  };

  const handleCancelRequest = (h) => {
    const updated = hospitals.filter(item => item.id !== h.id);
    setHospitals(updated);
    localStorage.setItem('ekavach_hospital_network', JSON.stringify(updated));
    showToast(`Cancelled connection request for ${h.name}.`);
  };

  const handleDispatchTransfer = (e) => {
    e.preventDefault();
    showToast(`Inter-hospital transfer dispatched to ${transferModalHospital?.name}. 108 Ambulance Unit #04 notified.`);
    setTransferModalHospital(null);
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.specialties.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'connected') return h.status === 'connected';
    if (activeFilter === 'pending') return h.status === 'pending';
    if (activeFilter === 'chennai') return h.region.includes('chennai');
    if (activeFilter === 'south') return h.region.includes('south');
    if (activeFilter === 'national') return h.region.includes('national');
    return true;
  });

  const connectedCount = hospitals.filter(h => h.status === 'connected').length;
  const pendingCount = hospitals.filter(h => h.status === 'pending').length;

  return (
    <div className="w-full">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#004d6c] text-white rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-xl text-[#02C39A]">hub</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Hospital Network Command</span>
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

      {/* Coordinate Transfer Modal */}
      {transferModalHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">swap_horizontal_circle</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Coordinate Patient Transfer</h3>
              </div>
              <button
                onClick={() => setTransferModalHospital(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDispatchTransfer} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Destination Hospital Node
                </label>
                <div className="p-3 rounded-lg bg-surface-container-low text-xs space-y-1">
                  <div className="font-bold text-primary">{transferModalHospital.name}</div>
                  <div className="text-on-surface-variant">{transferModalHospital.location}</div>
                  <div className="text-[#008774] font-semibold">{transferModalHospital.icuBeds} ICU Beds Available</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Select Patient to Transfer
                </label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Rajesh V. Sharma (ABHA: 9824-8819-TN) - Priority 1 AMI</option>
                  <option>Meenakshi Sundaram (ABHA: 7712-4401-TN) - Priority 2 Polytrauma</option>
                  <option>Harish K. Varma (ABHA: 4402-9918-TN) - Priority 3 Suture</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Transfer Transit Fleet
                </label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>108 Advanced Cardiac Life Support (ACLS) Unit #04</option>
                  <option>Apollo Private Emergency Mobile ICU</option>
                  <option>Helicopter Medevac Trauma Link (AIIMS)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setTransferModalHospital(null)}
                  className="px-4 py-2 border border-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Network Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Network &amp; FHIR Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">FHIR v4.0.1 Direct Stream</div>
                  <div className="text-on-surface-variant">Real-time mutual bed telemetry exchange</div>
                </div>
                <span className="text-[#008774] font-bold">Active</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">Auto-Accept Trauma Transfers</div>
                  <div className="text-on-surface-variant">Instant bay booking if capacity &gt; 15%</div>
                </div>
                <span className="text-primary font-bold">Enabled</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-on-surface">ABDM Grid Handshake Latency</div>
                  <div className="text-on-surface-variant">Port #842 TLS Secured</div>
                </div>
                <span className="font-mono text-secondary font-bold">0.08s</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast('Network settings saved to Apollo Local Gateway.');
                }}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">add_link</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Request Network Link</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRequestConnection} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Partner Hospital Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MIOT International Hospital"
                  value={newConnectNode.name}
                  onChange={(e) => setNewConnectNode({ ...newConnectNode, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  City &amp; Region
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manapakkam, Chennai"
                  value={newConnectNode.location}
                  onChange={(e) => setNewConnectNode({ ...newConnectNode, location: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Cluster Scope
                </label>
                <select
                  value={newConnectNode.cluster}
                  onChange={(e) => setNewConnectNode({ ...newConnectNode, cluster: e.target.value })}
                  className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="chennai">Chennai Central / Suburbs</option>
                  <option value="south">South Cluster (Tamil Nadu / Karnataka)</option>
                  <option value="national">National Trauma Grid</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 border border-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Send ABDM Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full pb-space-2xl">
        {/* Top Regional Context & Page Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md py-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm font-semibold tracking-wider text-secondary uppercase">COMMAND NODE 01 • REGIONAL INTER-HOSPITAL GRID</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">ABDM HEALTH EXCHANGE</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">Hospital Network</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Coordinate with partner hospitals for patient transfers, ICU bed telemetry, and seamless regional resource sharing.</p>
          </div>
          {/* Right Header Badges */}
          <div className="flex items-center gap-space-sm self-start md:self-center">
            <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <span className="font-label-md text-label-md font-semibold tracking-wide">{connectedCount} Connected</span>
            </div>
            <div className="px-space-sm py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">
              {pendingCount} Pending
            </div>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Connected Facilities</span>
              <span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
            </div>
            <div className="mt-3">
              <div className="font-headline-md text-headline-md text-primary font-bold">{connectedCount} Active</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">8 Tertiary, 4 Super-Specialty</div>
            </div>
            <div className="mt-3 pt-2 bg-surface-container-low rounded px-2 py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="">Active Grid Mesh</span>
              <span className="text-secondary font-semibold">100% Reachable</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Open Bed Availability</span>
              <span className="material-symbols-outlined text-secondary text-[22px]">single_bed</span>
            </div>
            <div className="mt-3">
              <div className="font-headline-md text-headline-md text-primary font-bold">142 Beds</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">38 ICU Beds across network</div>
            </div>
            <div className="mt-3 pt-2 bg-surface-container-low rounded px-2 py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="">Ventilators Standby</span>
              <span className="text-primary font-semibold">27 Units</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Active Transfers Today</span>
              <span className="material-symbols-outlined text-secondary text-[22px]">swap_horizontal_circle</span>
            </div>
            <div className="mt-3">
              <div className="font-headline-md text-headline-md text-primary font-bold">6 Transfers</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">4 Inbound, 2 Outbound</div>
            </div>
            <div className="mt-3 pt-2 bg-surface-container-low rounded px-2 py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="">Average Transit Time</span>
              <span className="text-primary font-semibold">18 Mins</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">ABDM Trauma Handshake</span>
              <span className="material-symbols-outlined text-secondary text-[22px]">sync_saved_locally</span>
            </div>
            <div className="mt-3">
              <div className="font-headline-md text-headline-md text-primary font-bold">100% Synced</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Avg Latency 0.08s</div>
            </div>
            <div className="mt-3 pt-2 bg-surface-container-low rounded px-2 py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="">FHIR Protocol</span>
              <span className="text-secondary font-semibold">v4.0.1 Direct</span>
            </div>
          </div>
        </div>

        {/* Search, Filter & Action Toolbar */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-lg flex flex-col xl:flex-row gap-space-md items-stretch xl:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-space-sm items-stretch md:items-center flex-1">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
              <input
                className="w-full h-10 pl-9 pr-space-md bg-surface-container-low text-on-surface placeholder-outline font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospitals by name or location"
                type="text"
              />
            </div>
            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: `All (${hospitals.length})` },
                { key: 'connected', label: `Connected (${connectedCount})` },
                { key: 'pending', label: `Pending (${pendingCount})` },
                { key: 'chennai', label: 'Chennai Central', icon: 'location_on' },
                { key: 'south', label: 'South Cluster' },
                { key: 'national', label: 'National Trauma Grid' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium transition-all cursor-pointer ${
                    activeFilter === f.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  } ${f.key === 'chennai' ? 'hidden sm:inline-flex items-center gap-1' : f.key === 'south' ? 'hidden lg:inline-flex' : f.key === 'national' ? 'hidden 2xl:inline-flex' : ''}`}
                  type="button"
                >
                  <span>{f.label}</span>
                  {f.icon && <span className="material-symbols-outlined text-[14px]">{f.icon}</span>}
                </button>
              ))}
            </div>
          </div>
          {/* Request Connection Primary Action */}
          <div className="flex items-center gap-space-xs shrink-0">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container font-label-lg text-label-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="">Network Settings</span>
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_link</span>
              <span className="">+ Request Connection</span>
            </button>
          </div>
        </div>

        {/* Connected Hospitals Table Module */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs bg-surface-container-lowest">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Connected Hospitals &amp; Partner Network</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Real-time mutual transfer channels, ICU telemetry, and direct medical coordination.</p>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="inline-flex items-center gap-1 text-secondary font-medium">
                <span className="material-symbols-outlined text-[16px]">wifi_tethering</span> Real-Time Stream Active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-space-lg font-semibold">Hospital &amp; Details</th>
                  <th className="py-3.5 px-space-md font-semibold">Cluster &amp; Location</th>
                  <th className="py-3.5 px-space-md font-semibold">Bed Telemetry &amp; Specialties</th>
                  <th className="py-3.5 px-space-md font-semibold">Connection Status</th>
                  <th className="py-3.5 px-space-lg font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <div className={`w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 ${
                          h.status === 'connected' ? 'text-primary' : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-[22px]">{h.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-label-lg text-label-lg font-bold text-primary truncate">{h.name}</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant truncate">{h.subtext}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-space-md">
                      <div className="font-body-md text-body-md text-on-surface font-medium">{h.location}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{h.subloc}</div>
                    </td>
                    <td className="py-4 px-space-md">
                      <div className="flex items-center gap-2">
                        <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold ${
                          h.icuBeds > 0 ? 'bg-surface-container text-primary' : 'bg-surface-container-high text-on-surface-variant font-medium'
                        }`}>
                          {h.icuBeds > 0 ? `${h.icuBeds} ICU Beds Available` : '0 ICU Beds Available'}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">• {h.wardBeds} Ward Beds</span>
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{h.specialties}</div>
                    </td>
                    <td className="py-4 px-space-md">
                      {h.status === 'connected' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-space-lg text-right">
                      {h.status === 'connected' ? (
                        <div className="flex items-center justify-end gap-space-sm">
                          <button
                            onClick={() => setTransferModalHospital(h)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary font-label-sm text-label-sm font-semibold transition-colors shadow-sm cursor-pointer"
                            type="button"
                          >
                            Coordinate Transfer
                          </button>
                          <button
                            onClick={() => navigate('/doctor/messages')}
                            className="text-secondary hover:text-primary font-label-sm text-label-sm font-medium transition-colors cursor-pointer"
                            type="button"
                          >
                            Message Hub
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-space-sm">
                          <button
                            onClick={() => handleResendInvite(h)}
                            className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                            type="button"
                          >
                            Resend Invite
                          </button>
                          <button
                            onClick={() => handleCancelRequest(h)}
                            className="text-outline hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                            type="button"
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
