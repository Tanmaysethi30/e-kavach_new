import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HospitalDetails() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWingFilter, setActiveWingFilter] = useState('All Wings');
  const [reallocModalOpen, setReallocModalOpen] = useState(false);
  const [selectedWardForRealloc, setSelectedWardForRealloc] = useState(null);
  const [reallocBedsToAdd, setReallocBedsToAdd] = useState(2);

  const initialWards = [
    {
      id: 1,
      name: 'Trauma & Emergency Bay',
      location: 'Ground Floor • Wing A',
      category: 'Emergency',
      totalBeds: 8,
      occupied: 6,
      available: 2,
      status: 'High Ingress Flow',
      statusType: 'secondary',
      pct: 75,
      actionType: 'manage'
    },
    {
      id: 2,
      name: 'Intensive Care Unit (ICU Node 1-3)',
      location: '2nd Floor • Wing B',
      category: 'Critical Care',
      totalBeds: 50,
      occupied: 46,
      available: 4,
      status: 'Nearing Capacity',
      statusType: 'secondary',
      pct: 92,
      actionType: 'manage'
    },
    {
      id: 3,
      name: 'Cardiac Care Unit (CCU)',
      location: '3rd Floor • Wing A',
      category: 'Critical Care',
      totalBeds: 32,
      occupied: 28,
      available: 4,
      status: 'Stable',
      statusType: 'tertiary',
      pct: 87.5,
      actionType: 'roster'
    },
    {
      id: 4,
      name: 'Surgical Post-Op Recovery',
      location: '4th Floor • Wing C',
      category: 'Inpatient',
      totalBeds: 40,
      occupied: 31,
      available: 9,
      status: 'Available',
      statusType: 'tertiary',
      pct: 77.5,
      actionType: 'roster'
    },
    {
      id: 5,
      name: 'General Medical Ward',
      location: 'Floors 5 & 6 • East Wing',
      category: 'Inpatient',
      totalBeds: 180,
      occupied: 152,
      available: 28,
      status: 'Available',
      statusType: 'tertiary',
      pct: 84.4,
      actionType: 'roster'
    },
    {
      id: 6,
      name: 'Semi-Private & Deluxe Inpatient',
      location: '7th Floor • Wing D',
      category: 'Inpatient',
      totalBeds: 90,
      occupied: 75,
      available: 15,
      status: 'Available',
      statusType: 'tertiary',
      pct: 83.3,
      actionType: 'roster'
    },
    {
      id: 7,
      name: 'Pediatric & Neonatal ICU (NICU)',
      location: '3rd Floor • Wing C',
      category: 'Critical Care',
      totalBeds: 30,
      occupied: 26,
      available: 4,
      status: 'Stable',
      statusType: 'tertiary',
      pct: 86.7,
      actionType: 'roster'
    },
    {
      id: 8,
      name: 'Isolation & Infectious Disease',
      location: 'Ground Floor • Annex',
      category: 'Critical Care',
      totalBeds: 20,
      occupied: 18,
      available: 2,
      status: 'Nearing Capacity',
      statusType: 'secondary',
      pct: 90,
      actionType: 'manage'
    }
  ];

  const [wards, setWards] = useState(() => {
    const saved = localStorage.getItem('ekavach_hospital_wards');
    return saved ? JSON.parse(saved) : initialWards;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCapacityReport = () => {
    const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
    const totalOccupied = wards.reduce((sum, w) => sum + w.occupied, 0);
    const totalAvailable = wards.reduce((sum, w) => sum + w.available, 0);

    let csvContent = `E-KAVACH HOSPITAL COMMAND NODE 01 - CAPACITY & BED ALLOCATION REPORT
Generated: ${new Date().toLocaleString()}
Facility: Apollo Greams Super-Speciality Trauma Center, Chennai Node #01
Total Capacity: ${totalBeds} Beds | Occupied: ${totalOccupied} | Available: ${totalAvailable}

Ward Name,Location,Category,Total Beds,Occupied,Available,Occupancy Rate,Status\n`;

    wards.forEach(w => {
      csvContent += `"${w.name}","${w.location}","${w.category}",${w.totalBeds},${w.occupied},${w.available},"${w.pct}%","${w.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `E-KAVACH_Capacity_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ward Capacity & Bed Distribution Report exported successfully.');
  };

  const handleOpenRealloc = (ward = null) => {
    setSelectedWardForRealloc(ward || wards[0]);
    setReallocModalOpen(true);
  };

  const handleConfirmRealloc = () => {
    if (!selectedWardForRealloc) return;
    const count = parseInt(reallocBedsToAdd, 10) || 0;
    const updated = wards.map(w => {
      if (w.id === selectedWardForRealloc.id) {
        const newTotal = w.totalBeds + count;
        const newAvailable = Math.max(0, w.available + count);
        const newPct = parseFloat(((w.occupied / newTotal) * 100).toFixed(1));
        return {
          ...w,
          totalBeds: newTotal,
          available: newAvailable,
          pct: newPct,
          status: newPct > 90 ? 'Nearing Capacity' : 'Available'
        };
      }
      return w;
    });
    setWards(updated);
    localStorage.setItem('ekavach_hospital_wards', JSON.stringify(updated));
    setReallocModalOpen(false);
    showToast(`Allocated +${count} reserve beds to ${selectedWardForRealloc.name}.`);
  };

  const filteredWards = wards.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          w.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeWingFilter === 'All Wings') return true;
    if (activeWingFilter === 'Critical Care') return w.category === 'Critical Care';
    if (activeWingFilter === 'Inpatient') return w.category === 'Inpatient';
    if (activeWingFilter === 'Emergency') return w.category === 'Emergency';
    return true;
  });

  return (
    <div className="w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#004d6c] text-white rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-xl text-[#02C39A]">apartment</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Hospital Command Update</span>
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

      {/* Quick Ward Reallocation Modal */}
      {reallocModalOpen && selectedWardForRealloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">swap_horiz</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Quick Ward Reallocation</h3>
              </div>
              <button
                onClick={() => setReallocModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Target Ward
                </label>
                <select
                  value={selectedWardForRealloc.id}
                  onChange={(e) => {
                    const found = wards.find(w => w.id === parseInt(e.target.value, 10));
                    if (found) setSelectedWardForRealloc(found);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.available} available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Transfer Beds From Reserve
                </label>
                <div className="flex items-center gap-3">
                  {[2, 4, 6, 10].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setReallocBedsToAdd(amt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                        reallocBedsToAdd === amt
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      +{amt} Beds
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg text-xs text-on-surface-variant space-y-1">
                <div className="flex justify-between">
                  <span>Current Capacity:</span>
                  <span className="font-semibold text-on-surface">{selectedWardForRealloc.totalBeds} beds ({selectedWardForRealloc.occupied} occupied)</span>
                </div>
                <div className="flex justify-between">
                  <span>New Projected Available:</span>
                  <span className="font-semibold text-primary">{selectedWardForRealloc.available + reallocBedsToAdd} beds</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setReallocModalOpen(false)}
                className="px-4 py-2 border border-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRealloc}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                type="button"
              >
                Confirm Allocation
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
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> COMMAND NODE 01
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">• Apollo Greams Super-Speciality Trauma Center</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Hospital Details</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Live overview of beds, patients, staffing, and ICU capacity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="">Synced 2 min ago</span>
              </div>
              <button
                onClick={handleExportCapacityReport}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container-low transition-all font-label-lg text-label-lg font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Capacity Report
              </button>
              <button
                onClick={() => handleOpenRealloc()}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary shadow-md hover:bg-primary/90 transition-all font-label-lg text-label-lg font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                + Quick Ward Reallocation
              </button>
            </div>
          </div>

          {/* 3. Ward & Facility Bed Distribution Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md mb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <h2 className="font-headline-md text-headline-md text-primary">Ward &amp; Facility Bed Distribution</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Real-time telemetry of wing-wise bed occupancy, current triage load, and live bed allocations.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="relative min-w-0 sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-space-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Filter by ward or wing..."
                    type="text"
                  />
                </div>
                <div className="inline-flex items-center rounded-lg bg-surface-container-low p-0.5 text-label-sm font-medium">
                  {['All Wings', 'Critical Care', 'Inpatient', 'Emergency'].map(wing => (
                    <button
                      key={wing}
                      onClick={() => setActiveWingFilter(wing)}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        activeWingFilter === wing
                          ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      type="button"
                    >
                      {wing}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ward Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="px-space-md py-3 rounded-l-lg">Ward &amp; Location</th>
                    <th className="px-space-md py-3">Total Capacity</th>
                    <th className="px-space-md py-3">Occupancy Level</th>
                    <th className="px-space-md py-3">Availability</th>
                    <th className="px-space-md py-3">Status</th>
                    <th className="px-space-md py-3 text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {filteredWards.map(w => (
                    <tr key={w.id} className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="px-space-md py-3.5">
                        <div className="font-label-lg text-label-lg font-semibold text-primary">{w.name}</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">{w.location}</div>
                      </td>
                      <td className="px-space-md py-3.5 font-medium text-on-surface">{w.totalBeds} Total Beds</td>
                      <td className="px-space-md py-3.5 min-w-[160px]">
                        <div className="flex items-center justify-between font-label-sm text-label-sm mb-1">
                          <span className={`font-semibold ${w.pct > 90 ? 'text-secondary' : 'text-on-surface'}`}>{w.pct}%</span>
                          <span className="text-on-surface-variant">{w.occupied} / {w.totalBeds}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              w.pct >= 90 ? 'bg-secondary' : 'bg-tertiary'
                            }`}
                            style={{ width: `${Math.min(100, w.pct)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-space-md py-3.5">
                        <div className={`font-label-md text-label-md font-semibold ${w.available <= 4 ? 'text-secondary' : 'text-primary'}`}>
                          {w.available} Available
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">{w.occupied} Occupied</div>
                      </td>
                      <td className="px-space-md py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${
                          w.statusType === 'secondary'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed'
                        } font-label-sm text-label-sm font-semibold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            w.statusType === 'secondary' ? 'bg-secondary' : 'bg-tertiary'
                          } mr-1.5`}></span>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-space-md py-3.5 text-right whitespace-nowrap">
                        {w.actionType === 'manage' ? (
                          <button
                            onClick={() => handleOpenRealloc(w)}
                            className="inline-flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm font-semibold cursor-pointer"
                            type="button"
                          >
                            Manage Allocation
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/admin/staff')}
                            className="inline-flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm font-semibold cursor-pointer"
                            type="button"
                          >
                            View Ward Roster
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Life Support & Essential Infrastructure Summary Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">health_and_safety</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">Oxygen &amp; Life Support Inventory</h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Continuous monitoring of emergency life-support apparatus linked to ABDM grid status.
                </p>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>All Telemetry Online
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {/* Tank reserves */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Medical O2 Tank Reserves</div>
                  <div className="font-headline-md text-headline-md text-primary font-bold mt-1">98% Reserves</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Liquid O2 Bulk Cryo: 24,500L Normal</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                  Healthy
                </span>
              </div>
              {/* Ventilator Availability */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Ventilator Availability</div>
                  <div className="font-headline-md text-headline-md text-secondary font-bold mt-1">14 / 18 In Use</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">4 Invasive units ready on reserve</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Nearing Cap
                </span>
              </div>
              {/* Telemetry Monitors */}
              <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Telemetry Monitors Active</div>
                  <div className="font-headline-md text-headline-md text-primary font-bold mt-1">100% Active</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">128 Central telemetry feeds paired</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                  Nominal
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
