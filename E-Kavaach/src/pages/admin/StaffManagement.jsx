import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function StaffManagement() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Critical Care Nurse',
    dept: 'ICU',
    ext: 'Ext. 4105 • Shift A',
    status: 'On Duty'
  });

  const initialStaffList = [
    { id: 'ST-1042', initials: 'PR', name: 'Priya R.', role: 'Critical Care Nurse', dept: 'ICU', status: 'On Duty', ext: 'Ext. 4102 • Shift A' },
    { id: 'ST-2189', initials: 'KM', name: 'Karthik M.', role: 'Radiology & CT Specialist', dept: 'Diagnostic Bay', status: 'On Duty', ext: 'Ext. 2219 • Shift A' },
    { id: 'ST-3401', initials: 'DS', name: 'Deepa S.', role: 'Trauma Triage Nurse', dept: 'ER Bay', status: 'Off Duty', ext: 'Ext. 1104 • Shift C' },
    { id: 'ST-4820', initials: 'RA', name: 'Rajeshwari Ananthan', role: 'Senior OT Technician', dept: 'Surgical Wing', status: 'On Duty', ext: 'Ext. 3381 • Shift A' },
    { id: 'ST-5091', initials: 'AK', name: 'Anand Kumar', role: 'Clinical Pharmacist', dept: 'Pharmacy', status: 'On Duty', ext: 'Ext. 5509 • Shift A' },
    { id: 'ST-6124', initials: 'SD', name: 'Sunita Deshmukh', role: 'Inpatient Head Nurse', dept: 'General Ward', status: 'Off Duty', ext: 'Ext. 4201 • Shift B' },
    { id: 'ST-7730', initials: 'BV', name: 'Balaji Venkatesh', role: 'Biomedical Equipment Engineer', dept: 'ICU & Telemetry', status: 'On Duty', ext: 'Ext. 6112 • On Call' },
    { id: 'ST-8812', initials: 'MN', name: 'Meera Namboodiri', role: 'Pediatric Care Assistant', dept: 'NICU / PICU', status: 'On Duty', ext: 'Ext. 4810 • Shift A' },
  ];

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('ekavach_staff_list');
    return saved ? JSON.parse(saved) : initialStaffList;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) {
      showToast('Please enter the staff member name.');
      return;
    }
    const idNum = Math.floor(1000 + Math.random() * 9000);
    const initials = newStaff.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    const member = {
      id: `ST-${idNum}`,
      initials,
      name: newStaff.name,
      role: newStaff.role,
      dept: newStaff.dept,
      status: newStaff.status,
      ext: newStaff.ext
    };

    const updated = [member, ...staffList];
    setStaffList(updated);
    localStorage.setItem('ekavach_staff_list', JSON.stringify(updated));
    setShowAddModal(false);
    setNewStaff({ name: '', role: 'Critical Care Nurse', dept: 'ICU', ext: 'Ext. 4105 • Shift A', status: 'On Duty' });
    showToast(`Staff member ${member.name} registered under ID #${member.id}.`);
  };

  const handleUpdateStaff = (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    const updated = staffList.map(s => s.id === editingStaff.id ? editingStaff : s);
    setStaffList(updated);
    localStorage.setItem('ekavach_staff_list', JSON.stringify(updated));
    setEditingStaff(null);
    showToast(`Updated roster profile for ${editingStaff.name}.`);
  };

  const filteredStaff = staffList.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.dept.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'On Duty') return s.status === 'On Duty';
    if (activeFilter === 'Off Duty') return s.status === 'Off Duty';
    if (activeFilter === 'ICU') return s.dept.toLowerCase().includes('icu');
    if (activeFilter === 'General Ward') return s.dept.toLowerCase().includes('general');
    if (activeFilter === 'Pharmacy') return s.dept.toLowerCase().includes('pharmacy');
    if (activeFilter === 'Emergency & Trauma') return s.dept.toLowerCase().includes('er') || s.dept.toLowerCase().includes('trauma');
    return true;
  });

  const onDutyCount = staffList.filter(s => s.status === 'On Duty').length;
  const offDutyCount = staffList.filter(s => s.status === 'Off Duty').length;

  return (
    <div className="w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#004d6c] text-white rounded-xl shadow-xl transition-all">
          <span className="material-symbols-outlined text-xl text-[#02C39A]">badge</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Staff Management Update</span>
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Add Hospital Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Clinical Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior ICU Staff Nurse"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <select
                    value={newStaff.dept}
                    onChange={(e) => setNewStaff({ ...newStaff, dept: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ICU">ICU Node</option>
                    <option value="ER Bay">Emergency Trauma</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Surgical Wing">Surgical Wing</option>
                    <option value="Diagnostic Bay">Diagnostic Bay</option>
                    <option value="NICU / PICU">NICU / PICU</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                    Shift Status
                  </label>
                  <select
                    value={newStaff.status}
                    onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="On Duty">On Duty</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Contact / Extension
                </label>
                <input
                  type="text"
                  placeholder="Ext. 4105 • Shift A"
                  value={newStaff.ext}
                  onChange={(e) => setNewStaff({ ...newStaff, ext: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">edit</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Edit Staff Profile</h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Clinical Role
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                    Shift Status
                  </label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="On Duty">On Duty</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingStaff.dept}
                    onChange={(e) => setEditingStaff({ ...editingStaff, dept: e.target.value })}
                    className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1">
                  Extension &amp; Shift
                </label>
                <input
                  type="text"
                  value={editingStaff.ext}
                  onChange={(e) => setEditingStaff({ ...editingStaff, ext: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile Drawer / Modal */}
      {selectedStaffProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">badge</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Staff Credential Profile</h3>
              </div>
              <button
                onClick={() => setSelectedStaffProfile(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary font-bold text-xl flex items-center justify-center">
                {selectedStaffProfile.initials}
              </div>
              <div>
                <h4 className="font-headline-sm text-base text-primary font-bold">{selectedStaffProfile.name}</h4>
                <div className="text-xs text-on-surface-variant">Staff ID #{selectedStaffProfile.id}</div>
                <div className="text-xs font-semibold text-secondary mt-0.5">{selectedStaffProfile.role}</div>
              </div>
            </div>

            <div className="mt-5 bg-surface-container-low p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Assigned Department:</span>
                <span className="font-semibold text-on-surface">{selectedStaffProfile.dept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Current Status:</span>
                <span className={`font-semibold ${selectedStaffProfile.status === 'On Duty' ? 'text-[#008774]' : 'text-on-surface-variant'}`}>
                  {selectedStaffProfile.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Contact / Ext:</span>
                <span className="font-mono text-on-surface">{selectedStaffProfile.ext}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Security Clearance:</span>
                <span className="font-semibold text-primary">Level-2 Clinical Workstation</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(selectedStaffProfile);
                  setSelectedStaffProfile(null);
                }}
                className="px-4 py-2 bg-surface-container text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Edit Roster
              </button>
              <button
                type="button"
                onClick={() => setSelectedStaffProfile(null)}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full">
        <div className="px-grid-margin py-space-xl space-y-space-lg max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs mb-space-2xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> COMMAND NODE 01
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">• Staff Operations &amp; Roster</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Staff Management</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">View and manage all hospital staff members.</p>
            </div>
            <div className="flex items-center gap-space-sm shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                {staffList.length} Staff Members
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-primary ring-2 ring-primary shadow-sm hover:bg-surface-container-low transition-all font-label-lg text-label-lg font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                + Add Staff
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Search staff by name or role"
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFilter('All')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold whitespace-nowrap shadow-sm transition-colors ${
                  activeFilter === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                All ({staffList.length})
              </button>
              <button
                onClick={() => setActiveFilter('On Duty')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'On Duty' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                On Duty ({onDutyCount})
              </button>
              <button
                onClick={() => setActiveFilter('Off Duty')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'Off Duty' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                Off Duty ({offDutyCount})
              </button>
              <span className="h-4 w-px bg-outline-variant/50 mx-1"></span>
              <button
                onClick={() => setActiveFilter('ICU')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'ICU' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                By Department: ICU
              </button>
              <button
                onClick={() => setActiveFilter('General Ward')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'General Ward' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                General Ward
              </button>
              <button
                onClick={() => setActiveFilter('Pharmacy')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'Pharmacy' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                Pharmacy
              </button>
              <button
                onClick={() => setActiveFilter('Emergency & Trauma')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'Emergency & Trauma' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                Emergency &amp; Trauma
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="px-space-md py-3.5">STAFF NAME</th>
                    <th className="px-space-md py-3.5">ROLE</th>
                    <th className="px-space-md py-3.5">DEPARTMENT</th>
                    <th className="px-space-md py-3.5">SHIFT STATUS</th>
                    <th className="px-space-md py-3.5">CONTACT / EXT</th>
                    <th className="px-space-md py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-low/70 transition-colors">
                      <td className="px-space-md py-4">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary font-label-md font-bold flex items-center justify-center shrink-0">
                            {s.initials}
                          </div>
                          <div>
                            <div className="font-label-lg text-label-lg font-semibold text-primary">{s.name}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">Staff ID #{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-space-md py-4 text-on-surface font-medium">{s.role}</td>
                      <td className="px-space-md py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                          {s.dept}
                        </span>
                      </td>
                      <td className="px-space-md py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${
                          s.status === 'On Duty'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-surface-container-high text-on-surface-variant'
                        } font-label-sm text-label-sm font-semibold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'On Duty' ? 'bg-tertiary mr-1.5 animate-pulse' : 'bg-outline mr-1.5'
                          }`}></span>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-space-md py-4 text-on-surface-variant font-label-sm">{s.ext}</td>
                      <td className="px-space-md py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingStaff(s)}
                          className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold mr-3 transition-colors cursor-pointer"
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSelectedStaffProfile(s)}
                          className="text-primary hover:text-secondary font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                          type="button"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-space-md py-space-sm bg-surface-container-low border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing {filteredStaff.length > 0 ? 1 : 0}–{filteredStaff.length} of {staffList.length} staff members
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                    showToast('Navigated to previous page.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-label-sm font-medium transition-colors cursor-pointer"
                  type="button"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1 rounded-lg text-label-sm font-semibold shadow-sm transition-colors ${
                    currentPage === 1 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
                  }`}
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(2);
                    showToast('Page 2 of staff roster loaded.');
                  }}
                  className={`px-3 py-1 rounded-lg text-label-sm font-medium transition-colors ${
                    currentPage === 2 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(3);
                    showToast('Page 3 of staff roster loaded.');
                  }}
                  className={`px-3 py-1 rounded-lg text-label-sm font-medium transition-colors ${
                    currentPage === 3 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  3
                </button>
                <span className="px-1.5 text-on-surface-variant text-label-sm">...</span>
                <button
                  onClick={() => {
                    setCurrentPage(6);
                    showToast('Page 6 of staff roster loaded.');
                  }}
                  className={`px-3 py-1 rounded-lg text-label-sm font-medium transition-colors ${
                    currentPage === 6 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  6
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(6, currentPage + 1));
                    showToast('Navigated to next page.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-label-sm font-medium transition-colors cursor-pointer"
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
