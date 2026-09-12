/**
 * E-KAVACH Patient Emergency Health Registry & QR Reference Engine
 * 
 * Provides secure local/mock resolution for:
 * 1. Automatic QR Code Generation based on profile completeness
 * 2. Privacy-preserving secure encoded references (no readable plain-text medical data in QR)
 * 3. Stable Emergency ID persistence across medical profile updates
 * 4. Dual lookup support for Doctor QR Scanner & Emergency Responder Scanner
 */

const STORAGE_KEY_REGISTRY = 'ekavach_emergency_registry';
const STORAGE_KEY_EMERGENCY_ID = 'ekavach_patient_emergency_id';

// Default baseline clinical profile (Rajesh V. Sharma)
export const DEFAULT_PATIENT_PROFILE = {
  id: 'patient-rajesh',
  emergencyId: 'EK-EMG-9824-8819',
  abhaNumber: '9824-8819-3320-TN',
  token: 'EK-TR-8819-V4',
  name: 'Rajesh V. Sharma',
  fullName: 'Rajesh V. Sharma',
  dob: '1984-08-14',
  age: '42 Yrs',
  gender: 'Male',
  phone: '+91 98401 77312',
  aadhaarNumber: 'XXXX-XXXX-3320',
  address: 'Greams Road, Thousand Lights',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600006',
  hospital: 'Apollo Greams Trauma Hub (Connected)',
  bloodGroup: 'O+',
  allergies: 'Penicillin (Severe anaphylaxis)',
  conditions: 'Hypertension, Mild Asthmatic Bronchitis',
  chronicConditions: 'Type II Diabetes (Fair Glycemic Control), Primary Essential Hypertension',
  pastIllnesses: 'Mild Asthmatic Bronchitis (2020), Dengue Fever (2019)',
  surgeries: 'Coronary Stent (DES - 2021), Laparoscopic Appendectomy (2015)',
  medicalHistoryNotes: 'Cardiac stent placed in LAD in 2021. Regular cardiology follow-up with Dr. Kavitha Menon. Penicillin allergy strictly flagged across all ABDM health nodes.',
  bpLevel: '128/82 mmHg (Optimal)',
  bloodSugar: 'Fasting 118 mg/dL (HbA1c 6.8%)',
  hasDiabetes: 'Yes',
  diabetesType: 'Type 2 Diabetes Mellitus',
  diabetesMedication: 'Metformin 500mg BD',
  currentMedications: 'Rosuvastatin 10mg (Bedtime), Telmisartan 40mg + Amlodipine 5mg (Morning), Salbutamol Inhaler 100mcg (PRN)',
  medicalAlerts: 'CRITICAL: Severe Penicillin Allergy (Anaphylaxis Risk) • Coronary Stent in situ (DES 2021)',
  emergencyContactName: 'Ananya S. Sharma',
  emergencyContactRelation: 'Spouse',
  emergencyContactPhone: '+91 98401 22819',
  emergencyInstructions: 'Patient has high sensitivity to penicillin. In unconscious trauma, contact spouse Ananya S. Sharma immediately and direct to Apollo Greams Trauma Bay.',
  prescriptions: [
    {
      id: 'rx-1',
      title: 'Rosuvastatin 10mg',
      dosage: '1 Tablet Daily (Bedtime)',
      duration: '30 Days',
      doctorName: 'Dr. Kavitha Menon',
      diagnosis: 'Dyslipidemia / Cardiovascular Prophylaxis',
      prescribedAt: '15-Oct-2026',
      status: 'ACTIVE',
    },
    {
      id: 'rx-2',
      title: 'Telmisartan 40mg + Amlodipine 5mg',
      dosage: '1 Tablet Daily (Morning)',
      duration: '60 Days',
      doctorName: 'Dr. Kavitha Menon',
      diagnosis: 'Primary Essential Hypertension',
      prescribedAt: '15-Oct-2026',
      status: 'ACTIVE',
    },
    {
      id: 'rx-3',
      title: 'Salbutamol Inhaler 100mcg',
      dosage: '2 Puffs PRN (As needed)',
      duration: 'PRN',
      doctorName: 'Dr. Suresh Rao',
      diagnosis: 'Mild Asthmatic Bronchitis',
      prescribedAt: '02-Sep-2026',
      status: 'ACTIVE',
    },
  ],
  labReports: [
    {
      id: 'lab-1',
      title: 'Comprehensive Metabolic Panel (CMP) + Lipid Profile',
      facility: 'Apollo Central Diagnostic Laboratory',
      date: '18-Oct-2026',
      summary: 'Total Cholesterol: 168 mg/dL • HDL: 48 mg/dL • LDL: 94 mg/dL',
      flag: 'NORMAL',
    },
    {
      id: 'lab-2',
      title: 'Glycated Hemoglobin (HbA1c) & Fasting Blood Sugar',
      facility: 'Greams PathLab Care',
      date: '14-Oct-2026',
      summary: 'HbA1c: 6.8% (Fair Control) • Fasting Glucose: 118 mg/dL',
      flag: 'ATTENTION',
    },
    {
      id: 'lab-3',
      title: '12-Lead Resting Electrocardiogram (ECG)',
      facility: 'Apollo Greams Trauma Heart Station',
      date: '24-Sep-2026',
      summary: 'Normal Sinus Rhythm • Rate 72 bpm • No ischemic ST shifts',
      flag: 'NORMAL',
    },
  ],
  profileCompleted: true,
  issuedAt: new Date().toISOString(),
};

/**
 * Validates whether the patient profile has all required demographic and clinical fields
 */
export function validateProfileCompleteness(data) {
  if (!data) return { isComplete: false, missingFields: ['Name', 'Blood Group', 'Address', 'Pincode', 'Emergency Contact'] };

  const missing = [];
  const name = data.name || data.fullName;
  if (!name || !name.trim()) missing.push('Full Name');
  if (!data.bloodGroup || !data.bloodGroup.trim()) missing.push('Blood Group');
  if (!data.gender || !data.gender.trim()) missing.push('Gender');
  if (!data.address || !data.address.trim()) missing.push('Address');
  if (!data.pincode || !data.pincode.trim()) missing.push('Pincode');
  if (!data.emergencyContactName || !data.emergencyContactName.trim()) missing.push('Emergency Contact Name');
  if (!data.emergencyContactPhone || !data.emergencyContactPhone.trim()) missing.push('Emergency Contact Phone');

  const isComplete = missing.length === 0;
  return { isComplete, missingFields: missing };
}

/**
 * Generates or retrieves the existing stable Emergency ID for a patient
 */
export function getOrCreateEmergencyId(patient) {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_EMERGENCY_ID);
    if (existing && existing.startsWith('EK-EMG-')) {
      return existing;
    }
  } catch (_e) {}

  const abha = patient?.abhaNumber || patient?.id || '';
  const cleanAbha = abha.replace(/[^0-9A-Za-z]/g, '');
  const suffix = cleanAbha.length >= 4 ? cleanAbha.slice(-4) : Math.floor(1000 + Math.random() * 9000);
  const newId = `EK-EMG-${suffix}`;
  
  try {
    localStorage.setItem(STORAGE_KEY_EMERGENCY_ID, newId);
  } catch (_e) {}

  return newId;
}

/**
 * Creates the privacy-safe QR reference payload
 * IMPORTANT: Does NOT expose plain-text clinical diagnoses or records in QR!
 */
export function createQrReferencePayload(patient) {
  const emergencyId = patient.emergencyId || getOrCreateEmergencyId(patient);
  const abhaNumber = patient.abhaNumber || patient.id || '9824-8819-3320-TN';

  return JSON.stringify({
    protocol: 'EKAVACH_EMERGENCY_HEALTH_ID',
    emergencyId: emergencyId,
    ref: emergencyId,
    abhaNumber: abhaNumber,
    version: '2.4',
    authScheme: 'ABDM_TIER1_TOKEN',
    issuedAt: new Date().toISOString(),
  });
}

/**
 * Loads the local emergency registry map from LocalStorage
 */
export function getRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_e) {}

  // Initialize registry with default patient
  const initial = {
    [DEFAULT_PATIENT_PROFILE.emergencyId]: DEFAULT_PATIENT_PROFILE,
    [DEFAULT_PATIENT_PROFILE.abhaNumber]: DEFAULT_PATIENT_PROFILE,
    'patient-rajesh': DEFAULT_PATIENT_PROFILE,
    '9824-8819-3320-TN': DEFAULT_PATIENT_PROFILE,
  };
  try {
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(initial));
  } catch (_e) {}
  return initial;
}

/**
 * Saves or updates a patient in the emergency registry.
 * Automatically keeps the same Emergency ID and updates all health profile attributes.
 */
export function savePatientToRegistry(patientData, broadcast = true, source = 'system') {
  if (!patientData) return null;

  const registry = getRegistry();
  const emergencyId = patientData.emergencyId || getOrCreateEmergencyId(patientData);
  const abhaNumber = patientData.abhaNumber || patientData.id || '9824-8819-3320-TN';

  // Inherit existing medical history/records or defaults if not provided
  const existing = registry[emergencyId] || registry[abhaNumber] || DEFAULT_PATIENT_PROFILE;

  const updatedProfile = {
    ...existing,
    ...patientData,
    emergencyId,
    abhaNumber,
    token: `EK-TR-${abhaNumber.replace(/[^0-9]/g, '').slice(-4) || '8819'}-V4`,
    name: patientData.name || patientData.fullName || existing.name,
    fullName: patientData.name || patientData.fullName || existing.fullName,
    bloodGroup: patientData.bloodGroup || existing.bloodGroup,
    allergies: patientData.allergies || existing.allergies,
    conditions: patientData.conditions || existing.conditions,
    chronicConditions: patientData.chronicConditions || patientData.conditions || existing.chronicConditions,
    pastIllnesses: patientData.pastIllnesses || existing.pastIllnesses,
    surgeries: patientData.surgeries || existing.surgeries,
    bpLevel: patientData.bpLevel || existing.bpLevel,
    bloodSugar: patientData.bloodSugar || existing.bloodSugar,
    hasDiabetes: patientData.hasDiabetes || existing.hasDiabetes,
    diabetesType: patientData.diabetesType || existing.diabetesType,
    diabetesMedication: patientData.diabetesMedication || existing.diabetesMedication,
    currentMedications: patientData.currentMedications || existing.currentMedications,
    emergencyContactName: patientData.emergencyContactName || existing.emergencyContactName,
    emergencyContactRelation: patientData.emergencyContactRelation || existing.emergencyContactRelation,
    emergencyContactPhone: patientData.emergencyContactPhone || existing.emergencyContactPhone,
    emergencyInstructions: patientData.emergencyInstructions || existing.emergencyInstructions,
    prescriptions: patientData.prescriptions || existing.prescriptions,
    labReports: patientData.labReports || existing.labReports,
    profileCompleted: true,
    lastUpdated: new Date().toISOString(),
  };

  registry[emergencyId] = updatedProfile;
  registry[abhaNumber] = updatedProfile;
  if (updatedProfile.id) {
    registry[updatedProfile.id] = updatedProfile;
  }

  try {
    localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(registry));
    localStorage.setItem(STORAGE_KEY_EMERGENCY_ID, emergencyId);
  } catch (_e) {}

  // Broadcast real-time update event so Patient Dashboard, Doctor Scanner, and Emergency Responder immediately sync
  if (broadcast) {
    try {
      window.dispatchEvent(
        new CustomEvent('ekavach_patient_profile_updated', {
          detail: { emergencyId, patient: updatedProfile, source },
        })
      );
    } catch (_e) {}
  }

  return updatedProfile;
}

/**
 * Looks up a patient by Emergency ID, ABHA number, Token, or raw QR payload
 * Used by Doctor QR Scanner and Emergency Responder QR Scanner
 */
export function lookupPatientInRegistry(query) {
  if (!query) return DEFAULT_PATIENT_PROFILE;

  const registry = getRegistry();
  const rawStr = String(query).trim();

  // 1. Try parsing JSON format
  if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawStr);
      const candidates = [
        parsed.emergencyId,
        parsed.ref,
        parsed.abhaNumber,
        parsed.abha,
        parsed.token,
        parsed.passToken,
        parsed.id,
      ].filter(Boolean);

      for (const key of candidates) {
        if (registry[key]) return registry[key];
      }
    } catch (_e) {}
  }

  // 2. Direct key match in registry
  if (registry[rawStr]) {
    return registry[rawStr];
  }

  // 3. Normalize search (strip hyphens/spaces)
  const cleanQuery = rawStr.replace(/[^0-9A-Za-z]/g, '').toLowerCase();
  for (const [key, profile] of Object.entries(registry)) {
    const cleanKey = String(key).replace(/[^0-9A-Za-z]/g, '').toLowerCase();
    const cleanAbha = (profile.abhaNumber || '').replace(/[^0-9A-Za-z]/g, '').toLowerCase();
    const cleanEmg = (profile.emergencyId || '').replace(/[^0-9A-Za-z]/g, '').toLowerCase();
    const cleanToken = (profile.token || '').replace(/[^0-9A-Za-z]/g, '').toLowerCase();
    const cleanName = (profile.name || '').replace(/[^0-9A-Za-z]/g, '').toLowerCase();

    if (
      cleanKey.includes(cleanQuery) ||
      cleanAbha.includes(cleanQuery) ||
      cleanEmg.includes(cleanQuery) ||
      cleanToken.includes(cleanQuery) ||
      cleanName.includes(cleanQuery)
    ) {
      return profile;
    }
  }

  // 4. Fallback to active logged in user if stored in local storage
  try {
    const savedUser = localStorage.getItem('ekavach_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.role === 'patient') {
        return {
          ...DEFAULT_PATIENT_PROFILE,
          ...parsed,
          emergencyId: parsed.emergencyId || getOrCreateEmergencyId(parsed),
        };
      }
    }
  } catch (_e) {}

  return DEFAULT_PATIENT_PROFILE;
}

/**
 * Parses and resolves a patient from a raw QR code string payload
 */
export function parsePatientFromQrString(qrString) {
  return lookupPatientInRegistry(qrString);
}
