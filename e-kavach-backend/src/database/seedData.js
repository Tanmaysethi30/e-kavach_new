const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = 'password123';
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const seedHospitals = [
  {
    id: 'hosp-apollo-greams',
    name: 'Apollo Greams Trauma Hub',
    code: 'AP-HSP-842-TN',
    address: '21 Greams Lane, Off Greams Road, Thousand Lights',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600006',
    geoLat: 13.0604,
    geoLng: 80.2496,
    departments: ['Cardiology', 'Emergency & Trauma', 'Neurology', 'Orthopedics', 'ICU & Critical Care', 'Pharmacy'],
    contactNumbers: { er: '+91 44 2829 0200', helpline: '1066', ambulance: '108' },
    icuBedsTotal: 50,
    icuBedsOccupied: 46,
    wardBedsTotal: 400,
    wardBedsOccupied: 336,
    status: 'ACTIVE'
  },
  {
    id: 'HOSP-1',
    name: 'AIIMS New Delhi Trauma Center',
    code: 'AIIMS-TC-01',
    address: 'Ansari Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pinCode: '110029',
    geoLat: 28.5672,
    geoLng: 77.2100,
    departments: ['Polytrauma', 'Neurotrauma', 'Hyperbaric O2'],
    icuBedsTotal: 20,
    icuBedsOccupied: 6,
    wardBedsTotal: 100,
    wardBedsOccupied: 58,
    status: 'ACTIVE'
  },
  {
    id: 'HOSP-2',
    name: 'Fortis Malar Hospital',
    code: 'FORTIS-MLR-02',
    address: 'Adyar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600020',
    geoLat: 13.0067,
    geoLng: 80.2570,
    departments: ['Cardiothoracic', 'ECMO Support', 'Burns'],
    icuBedsTotal: 15,
    icuBedsOccupied: 7,
    wardBedsTotal: 80,
    wardBedsOccupied: 58,
    status: 'ACTIVE'
  },
  {
    id: 'HOSP-3',
    name: 'Stanley Medical College & Hospital',
    code: 'STANLEY-MCH-03',
    address: 'Royapuram',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600001',
    geoLat: 13.1075,
    geoLng: 80.2928,
    departments: ['Micro-Reconstructive', 'Toxicological Emergency'],
    icuBedsTotal: 25,
    icuBedsOccupied: 6,
    wardBedsTotal: 150,
    wardBedsOccupied: 90,
    status: 'ACTIVE'
  },
  {
    id: 'HOSP-4',
    name: 'Manipal Hospital Old Airport Road',
    code: 'MANIPAL-BLR-04',
    address: 'HAL Airport Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560017',
    geoLat: 12.9592,
    geoLng: 77.6534,
    departments: ['Organ Retrieval', 'Interventional Radiology'],
    icuBedsTotal: 20,
    icuBedsOccupied: 9,
    wardBedsTotal: 120,
    wardBedsOccupied: 86,
    status: 'ACTIVE'
  }
];

const seedUsers = [
  {
    id: 'user-patient-rajesh',
    email: 'rajesh.sharma@ekavach.health',
    phone: '+91 98401 22819',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'patient',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-kavitha',
    email: 'dr.kavitha@apollo.health',
    phone: '+91 98401 99420',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-arvind',
    email: 'dr.arvind@aiims.edu',
    phone: '+91 98112 44301',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-shalini',
    email: 'dr.shalini@manipal.health',
    phone: '+91 98801 77210',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-rajeshnair',
    email: 'dr.rajesh@fortis.health',
    phone: '+91 98440 33890',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-priya',
    email: 'dr.priya@apollo.health',
    phone: '+91 98402 11980',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-doctor-zaid',
    email: 'dr.zaid@aiims.edu',
    phone: '+91 98119 55602',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    status: 'ACTIVE'
  },
  {
    id: 'user-admin-nambiar',
    email: 'admin.nambiar@apollo.health',
    phone: '+91 98401 84200',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'hospital',
    status: 'ACTIVE'
  }
];

const seedPatientProfiles = [
  {
    id: 'patient-rajesh',
    userId: 'user-patient-rajesh',
    name: 'Rajesh V. Sharma',
    abhaNumber: '9824-8819-3320-TN',
    bloodGroup: 'O+ (Rh Pos)',
    gender: 'Male',
    dob: new Date('1972-06-15'),
    chronicConditions: ['Type II Diabetes (Insulin Dependent)', 'Mild Hypertension'],
    allergies: ['Penicillin (Severe anaphylaxis)'],
    implants: ['Coronary Stent (DES - 2021)'],
    emergencyContacts: [
      { name: 'Ananya S.', relation: 'Spouse', phone: '+91 98401 22819', priority: 1, verified: true },
      { name: 'Dr. Vivek Sharma', relation: 'Brother / Physician', phone: '+91 94440 88129', priority: 2, verified: true }
    ],
    emergencyToken: 'EK-TR-88190-V4',
    qrPayload: 'EKAVACH:ABHA:9824-8819-3320-TN:BLOOD:O_POS:ALLERGY:PENICILLIN:TOKEN:EK-TR-88190-V4',
    hospitalAffiliation: 'Apollo Greams Trauma Hub',
    tag: 'Verified Health ID'
  }
];

const seedDoctorProfiles = [
  {
    id: 'doctor-kavitha',
    userId: 'user-doctor-kavitha',
    name: 'Dr. Kavitha Menon',
    title: 'Chief Interventional Cardio',
    nmcNumber: 'MD-44912-TN',
    specialization: 'Interventional Cardiology & Electrophysiology',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'Apollo Greams Trauma Hub',
    department: 'Cardiology',
    tag: 'ID-9942',
    degrees: 'MD, DM, FACC',
    experienceYears: 18,
    consultationFee: 800,
    availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM', '05:30 PM']
  },
  {
    id: 'doctor-arvind',
    userId: 'user-doctor-arvind',
    name: 'Dr. Arvind Swaminathan',
    title: 'Lead Neurosurgeon & Stroke Specialist',
    nmcNumber: 'MD-38291-DL',
    specialization: 'Neurosurgery & Cerebrovascular Trauma',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'AIIMS New Delhi Trauma Center',
    department: 'Neurology',
    tag: 'ID-8821',
    degrees: 'MS, MCh (Neurosurgery), FINR',
    experienceYears: 15,
    consultationFee: 1000,
    availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '04:30 PM']
  },
  {
    id: 'doctor-shalini',
    userId: 'user-doctor-shalini',
    name: 'Dr. Shalini Deshmukh',
    title: 'Senior Pulmonologist & Critical Care',
    nmcNumber: 'MD-51204-KA',
    specialization: 'Pulmonary Medicine, ARDS & Bronchoscopy',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'Manipal Hospital Old Airport Road',
    department: 'Pulmonology',
    tag: 'ID-7714',
    degrees: 'MD, DNB (Resp Diseases), FCCP',
    experienceYears: 12,
    consultationFee: 750,
    availableSlots: ['09:00 AM', '10:30 AM', '01:30 PM', '03:30 PM', '05:00 PM']
  },
  {
    id: 'doctor-rajeshnair',
    userId: 'user-doctor-rajeshnair',
    name: 'Dr. Rajesh K. Nair',
    title: 'Chief Orthopedic Trauma Surgeon',
    nmcNumber: 'MD-41908-TN',
    specialization: 'Orthopedics, Joint Reconstruction & Polytrauma',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'Fortis Malar Hospital',
    department: 'Orthopedics',
    tag: 'ID-6602',
    degrees: 'MS (Ortho), DNB, FRCS (Tr & Orth)',
    experienceYears: 20,
    consultationFee: 850,
    availableSlots: ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM']
  },
  {
    id: 'doctor-priya',
    userId: 'user-doctor-priya',
    name: 'Dr. Priya R. Sundaram',
    title: 'Consultant Emergency Medicine',
    nmcNumber: 'MD-60419-TN',
    specialization: 'Emergency Medicine & Golden Hour Resuscitation',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'Apollo Greams Trauma Hub',
    department: 'Emergency Medicine',
    tag: 'ID-5519',
    degrees: 'MD (Emergency Medicine), MRCEM',
    experienceYears: 9,
    consultationFee: 600,
    availableSlots: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '06:00 PM']
  },
  {
    id: 'doctor-zaid',
    userId: 'user-doctor-zaid',
    name: 'Dr. Mohammed Zaid',
    title: 'Director of Nephrology & Renal Transplant',
    nmcNumber: 'MD-47712-DL',
    specialization: 'Nephrology, Dialysis & Renal Transplantation',
    credentialStatus: 'VERIFIED',
    hospitalAffiliation: 'AIIMS New Delhi Trauma Center',
    department: 'Nephrology',
    tag: 'ID-4420',
    degrees: 'MD, DM (Nephrology), FISN',
    experienceYears: 16,
    consultationFee: 900,
    availableSlots: ['11:00 AM', '12:30 PM', '03:30 PM', '05:00 PM']
  }
];

const seedHospitalAdminProfiles = [
  {
    id: 'admin-nambiar',
    userId: 'user-admin-nambiar',
    hospitalId: 'hosp-apollo-greams',
    name: 'Dr. R. K. Nambiar',
    title: 'Hospital Administrator',
    designation: 'Chief Medical Officer & Hospital Administrator',
    tag: 'VERIFIED ADMIN'
  }
];

const seedEmergencyPass = [
  {
    id: 'pass-rajesh',
    patientProfileId: 'patient-rajesh',
    passToken: 'EK-TR-88190-V4',
    bloodGroup: 'O+ (Rh Pos)',
    criticalAllergies: 'Severe Penicillin anaphylaxis reaction.',
    chronicConditions: 'Type II Diabetes (Insulin Dependent), Mild Hypertension',
    implants: 'Coronary Stent (DES - 2021)',
    iceContacts: [
      { name: 'Ananya S.', relation: 'Spouse', phone: '+91 98401 22819', priority: 1 },
      { name: 'Dr. Vivek Sharma', relation: 'Brother / Physician', phone: '+91 94440 88129', priority: 2 }
    ],
    status: 'ACTIVE',
    qrMatrix: 'data:image/svg+xml;utf8,<svg ...></svg>'
  }
];

const seedAbhaAccounts = [
  {
    id: 'abha-rajesh',
    patientProfileId: 'patient-rajesh',
    abhaNumber: '9824-8819-3320-TN',
    phrAddress: 'rajesh.sharma@abdm',
    linkedMobile: '+91 98401 22819',
    aadhaarRef: 'XXXX-XXXX-4819',
    qrPayload: 'ABDM:PHR:rajesh.sharma@abdm:ABHA:9824-8819-3320-TN',
    verificationStatus: 'LEVEL-4 CERTIFIED',
    issueDate: new Date('2023-01-10')
  }
];

const seedGovernmentSchemes = [
  {
    id: 'scheme-pmjay',
    name: 'Ayushman Bharat PM-JAY',
    code: 'PMJAY',
    description: 'National Health Protection Scheme providing cashless coverage up to ₹5,00,000 per family per year for secondary and tertiary care.',
    coverageAmount: 500000.00,
    department: 'National Health Authority (NHA)',
    eligibilityRules: { seccCategory: 'D1-D7', incomeLimit: 250000 }
  },
  {
    id: 'scheme-cmchis',
    name: 'Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
    code: 'CMCHIS',
    description: 'Tamil Nadu State health assurance cover up to ₹5,00,000 for critical surgeries and trauma procedures.',
    coverageAmount: 500000.00,
    department: 'Govt of Tamil Nadu Dept of Health',
    eligibilityRules: { stateResident: true, rationCardRequired: true }
  },
  {
    id: 'scheme-esi',
    name: 'Employees State Insurance Scheme',
    code: 'ESI',
    description: 'Full medical care and disability protection for insured formal sector employees and dependents.',
    coverageAmount: 1000000.00,
    department: 'Ministry of Labour & Employment',
    eligibilityRules: { wageThreshold: 21000 }
  }
];

const seedSchemeEnrollments = [
  {
    id: 'enrollment-rajesh-pmjay',
    patientProfileId: 'patient-rajesh',
    schemeId: 'scheme-pmjay',
    status: 'RENEWAL_DUE',
    policyNumber: 'PMJAY-TN-2024-991204',
    claimHistory: [
      { date: '2025-11-14', hospital: 'Apollo Greams', procedure: 'Cardiac Angiogram & Stenting', amountClaimed: 185000, status: 'APPROVED' }
    ]
  },
  {
    id: 'enrollment-rajesh-cmchis',
    patientProfileId: 'patient-rajesh',
    schemeId: 'scheme-cmchis',
    status: 'ENROLLED',
    policyNumber: 'CMCHIS-CHE-882190',
    claimHistory: []
  }
];

const seedBeds = [
  { id: 'bed-icu', hospitalId: 'hosp-apollo-greams', wardType: 'ICU', wardName: 'Intensive Coronary Care Unit', totalBeds: 50, occupiedBeds: 46, availableBeds: 4, status: 'HIGH_LOAD' },
  { id: 'bed-ccu', hospitalId: 'hosp-apollo-greams', wardType: 'CCU', wardName: 'Critical Care Unit', totalBeds: 32, occupiedBeds: 28, availableBeds: 4, status: 'HIGH_LOAD' },
  { id: 'bed-trauma', hospitalId: 'hosp-apollo-greams', wardType: 'TRAUMA_BAY', wardName: 'Emergency Trauma Bays', totalBeds: 8, occupiedBeds: 6, availableBeds: 2, status: 'OPERATIONAL' },
  { id: 'bed-general', hospitalId: 'hosp-apollo-greams', wardType: 'GENERAL', wardName: 'Inpatient General & Special Wards', totalBeds: 360, occupiedBeds: 302, availableBeds: 58, status: 'OPERATIONAL' }
];

const seedTriageEntries = [
  {
    id: 'triage-1',
    patientProfileId: 'patient-rajesh',
    hospitalId: 'hosp-apollo-greams',
    assignedDoctorId: 'doctor-kavitha',
    triageColor: 'RED',
    priorityLevel: 'Priority 1 (Critical)',
    bayNumber: 'Bay 02',
    patientName: 'Rajesh V. Sharma',
    abhaNumber: '9824-8819-3320-TN',
    arrivalTime: new Date(Date.now() - 15 * 60 * 1000),
    vitals: { heartRate: '112 bpm', bp: '190/115', spO2: '88%', respRate: '24 /min' },
    condition: 'Acute Myocardial Infarction • ST Elevation',
    status: 'ATTENDING'
  },
  {
    id: 'triage-2',
    patientProfileId: null,
    hospitalId: 'hosp-apollo-greams',
    assignedDoctorId: null,
    triageColor: 'YELLOW',
    priorityLevel: 'Priority 2 (Urgent)',
    bayNumber: 'Bay 04',
    patientName: 'Meenakshi Sundaram',
    abhaNumber: '7712-4401-TN',
    arrivalTime: new Date(Date.now() - 32 * 60 * 1000),
    vitals: { heartRate: '84 bpm', bp: '135/85', spO2: '97%', respRate: '18 /min' },
    condition: 'Polytrauma / Right Femur Compound Fracture',
    status: 'INGRESS'
  },
  {
    id: 'triage-3',
    patientProfileId: null,
    hospitalId: 'hosp-apollo-greams',
    assignedDoctorId: null,
    triageColor: 'GREEN',
    priorityLevel: 'Priority 3 (Stable)',
    bayNumber: 'Bay 06',
    patientName: 'Harish K. Varma',
    abhaNumber: '4402-9918-TN',
    arrivalTime: new Date(Date.now() - 55 * 60 * 1000),
    vitals: { heartRate: '72 bpm', bp: '120/80', spO2: '99%', respRate: '16 /min' },
    condition: 'Deep Forearm Laceration / Suture In Progress',
    status: 'INGRESS'
  }
];

const seedStaffMembers = [
  { id: 'ST-1042', hospitalId: 'hosp-apollo-greams', initials: 'PR', name: 'Priya R.', role: 'Critical Care Nurse', department: 'ICU', status: 'ON_DUTY', extension: 'Ext. 4102 • Shift A' },
  { id: 'ST-2189', hospitalId: 'hosp-apollo-greams', initials: 'KM', name: 'Karthik M.', role: 'Radiology & CT Specialist', department: 'Diagnostic Bay', status: 'ON_DUTY', extension: 'Ext. 2219 • Shift A' },
  { id: 'ST-3401', hospitalId: 'hosp-apollo-greams', initials: 'DS', name: 'Deepa S.', role: 'Trauma Triage Nurse', department: 'ER Bay', status: 'OFF_DUTY', extension: 'Ext. 1104 • Shift C' },
  { id: 'ST-4820', hospitalId: 'hosp-apollo-greams', initials: 'RA', name: 'Rajeshwari Ananthan', role: 'Senior OT Technician', department: 'Surgical Wing', status: 'ON_DUTY', extension: 'Ext. 3381 • Shift A' },
  { id: 'ST-5091', hospitalId: 'hosp-apollo-greams', initials: 'AK', name: 'Anand Kumar', role: 'Clinical Pharmacist', department: 'Pharmacy', status: 'ON_DUTY', extension: 'Ext. 5509 • Shift A' },
  { id: 'ST-6124', hospitalId: 'hosp-apollo-greams', initials: 'SD', name: 'Sunita Deshmukh', role: 'Inpatient Head Nurse', department: 'General Ward', status: 'OFF_DUTY', extension: 'Ext. 4201 • Shift B' },
  { id: 'ST-7730', hospitalId: 'hosp-apollo-greams', initials: 'BV', name: 'Balaji Venkatesh', role: 'Biomedical Equipment Engineer', department: 'ICU & Telemetry', status: 'ON_DUTY', extension: 'Ext. 6112 • On Call' },
  { id: 'ST-8812', hospitalId: 'hosp-apollo-greams', initials: 'MN', name: 'Meera Namboodiri', role: 'Pediatric Care Assistant', department: 'NICU / PICU', status: 'ON_DUTY', extension: 'Ext. 4810 • Shift A' }
];

const seedPharmacyItems = [
  { id: 'pharm-1', hospitalId: 'hosp-apollo-greams', name: 'Metformin 500mg', genericName: 'Generic: Metformin Hydrochloride • Oral Tablet', category: 'Diabetes', lotNumber: 'Lot #MT-8819', storageLocation: 'Main Dispensary (Rack B-04)', stockQty: 4200, unit: 'units', reorderThreshold: 1000, status: 'IN_STOCK', icon: 'pill' },
  { id: 'pharm-2', hospitalId: 'hosp-apollo-greams', name: 'Epinephrine 1mg/mL', genericName: 'Emergency Crash-Cart Reserve • 1:1000 IV', category: 'Emergency Resuscitation', lotNumber: 'Lot #EP-4401', storageLocation: 'ER Bay 1-3 & Trauma Crash Cart', stockQty: 320, unit: 'Amps', reorderThreshold: 150, status: 'IN_STOCK', icon: 'vaccines' },
  { id: 'pharm-3', hospitalId: 'hosp-apollo-greams', name: 'Cefotaxime 1g IV', genericName: 'Broad-spectrum Cephalosporin Antibiotic', category: 'Antibiotics', lotNumber: 'Lot #CF-9921', storageLocation: 'Inpatient Central Stock', stockQty: 42, unit: 'Vials', reorderThreshold: 100, status: 'LOW_STOCK', icon: 'science' },
  { id: 'pharm-4', hospitalId: 'hosp-apollo-greams', name: 'Rosuvastatin 10mg', genericName: 'Lipid-lowering HMG-CoA Reductase Inhibitor', category: 'Cardiovascular', lotNumber: 'Lot #RS-2041', storageLocation: 'Main Dispensary (Rack C-02)', stockQty: 1800, unit: 'units', reorderThreshold: 500, status: 'IN_STOCK', icon: 'pill' },
  { id: 'pharm-5', hospitalId: 'hosp-apollo-greams', name: 'Aspirin 75mg Gastro-Resistant', genericName: 'Antiplatelet Platelet Aggregation Inhibitor', category: 'Cardiovascular', lotNumber: 'Lot #AS-7718', storageLocation: 'Main Dispensary (Rack C-03)', stockQty: 2400, unit: 'units', reorderThreshold: 500, status: 'IN_STOCK', icon: 'pill' },
  { id: 'pharm-6', hospitalId: 'hosp-apollo-greams', name: 'Insulin Glargine 100 IU/mL', genericName: 'Long-Acting Basal Recombinant Insulin Soln', category: 'Diabetes', lotNumber: 'Lot #IN-8891', storageLocation: 'Cold Vault 4°C (Unit 2)', stockQty: 110, unit: 'Pens', reorderThreshold: 50, status: 'IN_STOCK', icon: 'vaccines' }
];

const seedNetworkNodes = [
  { id: 'HOSP-1', name: 'AIIMS New Delhi Trauma Center', subtext: 'Apex National Super-Specialty Center • ABDM Tier-1 Node', location: 'Ansari Nagar, New Delhi', subloc: 'National Central Hub • PIN 110029', icuBeds: 14, wardBeds: 42, specialties: 'Polytrauma, Neurotrauma, Hyperbaric O2', status: 'connected', region: 'national', distanceKm: 2180.0, o2ReserveHours: 120, bloodBankUnits: 450, latencySec: 0.08, icon: 'local_hospital' },
  { id: 'HOSP-2', name: 'Fortis Malar Hospital', subtext: 'Super-Specialty Trauma & Critical Care Unit', location: 'Adyar, Chennai, Tamil Nadu', subloc: 'South Chennai Node • 4.8 km away', icuBeds: 8, wardBeds: 22, specialties: 'Cardiothoracic, ECMO Support, Burns', status: 'connected', region: 'chennai south', distanceKm: 4.8, o2ReserveHours: 84, bloodBankUnits: 120, latencySec: 0.02, icon: 'domain' },
  { id: 'HOSP-3', name: 'Stanley Medical College & Hospital', subtext: 'Government Medical College & State Trauma Center', location: 'Royapuram, Chennai, Tamil Nadu', subloc: 'North Chennai Node • 8.2 km away', icuBeds: 19, wardBeds: 60, specialties: 'Micro-Reconstructive, Toxicological Emergency', status: 'connected', region: 'chennai', distanceKm: 8.2, o2ReserveHours: 96, bloodBankUnits: 210, latencySec: 0.03, icon: 'emergency' },
  { id: 'HOSP-4', name: 'Manipal Hospital Old Airport Road', subtext: 'Tertiary Multi-Specialty & Organ Transplant Center', location: 'Bengaluru, Karnataka', subloc: 'Inter-State Corridor Node • 290 km', icuBeds: 11, wardBeds: 34, specialties: 'Organ Retrieval, Interventional Radiology', status: 'connected', region: 'south', distanceKm: 290.0, o2ReserveHours: 104, bloodBankUnits: 340, latencySec: 0.05, icon: 'domain' }
];

const seedAppointments = [
  {
    id: 'apt-1',
    tokenNumber: 'EK-SLOT-101',
    patientProfileId: 'patient-rajesh',
    doctorProfileId: 'doctor-kavitha',
    hospitalId: 'hosp-apollo-greams',
    patientName: 'Rajesh V. Sharma',
    patientPhone: '+91 98401 22819',
    timeSlot: '10:30 AM',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow 10:30 AM
    mode: 'IN_PERSON',
    status: 'CONFIRMED',
    department: 'Cardiology',
    symptoms: 'Follow-up on coronary stent evaluation and HbA1c review.',
    notes: JSON.stringify({
      serviceType: 'DOCTOR_CONSULT',
      bookingFor: 'SELF',
      relation: 'Self',
      patientAge: '52',
      patientGender: 'Male',
      userNotes: 'Please bring latest fasting glucose reports.'
    })
  },
  {
    id: 'apt-2',
    tokenNumber: 'EK-SLOT-102',
    patientProfileId: 'patient-rajesh',
    doctorProfileId: 'doctor-kavitha',
    hospitalId: 'hosp-apollo-greams',
    patientName: 'Venkatesh Sharma',
    patientPhone: '+91 98401 22819',
    timeSlot: '11:45 AM',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    mode: 'IN_PERSON',
    status: 'PENDING',
    department: 'Cardiology',
    symptoms: 'Echocardiography & Lipid Workup for elderly family member',
    notes: JSON.stringify({
      serviceType: 'DIAGNOSTIC_TEST',
      bookingFor: 'OTHER',
      relation: 'Father',
      testName: 'Echocardiography & Lipid Profile',
      patientAge: '76',
      patientGender: 'Male',
      userNotes: 'Senior citizen wheelchair assistance requested at gate.'
    })
  }
];

const seedMedicalRecords = [
  {
    id: 'rec-1',
    patientProfileId: 'patient-rajesh',
    uploadedByUserId: 'user-doctor-kavitha',
    title: 'Comprehensive Metabolic Panel & HbA1c',
    recordType: 'LAB_REPORT',
    fileUrl: '/uploads/hba1c_report_rajesh.pdf',
    date: new Date('2026-10-18'),
    notes: 'HbA1c: 6.8%, Fasting Blood Sugar: 124 mg/dL. Creatinine: 0.9 mg/dL.'
  },
  {
    id: 'rec-2',
    patientProfileId: 'patient-rajesh',
    uploadedByUserId: 'user-doctor-kavitha',
    title: 'Cardiology Discharge Summary & Stent Protocol',
    recordType: 'DISCHARGE_SUMMARY',
    fileUrl: '/uploads/cardio_discharge_rajesh.pdf',
    date: new Date('2025-11-16'),
    notes: 'Drug-eluting stent successfully deployed in LAD. Patient stable on DAPT.'
  }
];

const seedConsentGrants = [
  {
    id: 'consent-kavitha',
    patientProfileId: 'patient-rajesh',
    grantedToDoctorId: 'doctor-kavitha',
    recordScope: 'ALL',
    status: 'ACTIVE',
    grantedAt: new Date('2024-01-01')
  }
];

const seedAccessLogs = [
  {
    id: 'log-1',
    patientProfileId: 'patient-rajesh',
    accessorUserId: 'user-doctor-kavitha',
    accessorRole: 'doctor',
    accessorName: 'Dr. Kavitha Menon',
    hospitalId: 'hosp-apollo-greams',
    accessType: 'CONSULTATION_VIEW',
    reason: 'Pre-consultation cardiac record review',
    ipAddress: '10.14.22.84',
    userAgent: 'Apollo-Greams-Workstation-ChromeOS',
    latencyMs: 18,
    timestamp: new Date(Date.now() - 3 * 3600 * 1000)
  },
  {
    id: 'log-2',
    patientProfileId: 'patient-rajesh',
    accessorUserId: 'user-doctor-kavitha',
    accessorRole: 'doctor',
    accessorName: 'Dr. Kavitha Menon',
    hospitalId: 'hosp-apollo-greams',
    accessType: 'EMERGENCY_PASS_BYPASS',
    reason: 'ER Bay 3 Emergency Triage Ingress Protocol',
    ipAddress: '10.14.22.90',
    userAgent: 'Apollo-ER-Bay3-Scanner',
    latencyMs: 12,
    timestamp: new Date(Date.now() - 24 * 3600 * 1000)
  }
];

module.exports = {
  seedHospitals,
  seedUsers,
  seedPatientProfiles,
  seedDoctorProfiles,
  seedHospitalAdminProfiles,
  seedEmergencyPass,
  seedAbhaAccounts,
  seedGovernmentSchemes,
  seedSchemeEnrollments,
  seedBeds,
  seedTriageEntries,
  seedStaffMembers,
  seedPharmacyItems,
  seedNetworkNodes,
  seedAppointments,
  seedMedicalRecords,
  seedConsentGrants,
  seedAccessLogs,
};
