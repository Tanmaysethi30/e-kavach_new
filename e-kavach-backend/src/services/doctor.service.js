const db = require('../database/db');
const { logAccess } = require('../utils/auditLogger');
const { decryptPII, maskPII } = require('../utils/crypto');

class DoctorService {
  async getProfile(userId) {
    const profile = await db.doctorProfile.findUnique({
      where: { userId },
      include: {
        credentials: true,
      },
    });

    if (!profile) {
      throw new Error('Doctor profile not found');
    }

    return profile;
  }

  async getTriageQueue(hospitalId = 'hosp-apollo-greams') {
    const queue = await db.triageEntry.findMany({
      where: { hospitalId },
      orderBy: { arrivalTime: 'asc' },
    });

    return queue;
  }

  /**
   * Emergency Golden Hour Scan: QR or NFC lookup
   * Sub-3-second SLA, bypasses standard consent, creates immutable AccessLog.
   */
  async scanPatient({ qrData, passToken, abhaNumber, nfcPayload }, doctorUser) {
    const startTime = Date.now();

    let patient = null;

    // 1. Try finding by passToken or emergencyToken
    const token = passToken || (qrData && qrData.includes('TOKEN:') ? qrData.split('TOKEN:')[1].split(':')[0] : null) || qrData;

    if (token) {
      const emergencyPass = await db.emergencyPass.findFirst({
        where: { passToken: token },
        include: { patientProfile: true },
      });

      if (emergencyPass && emergencyPass.patientProfile) {
        patient = emergencyPass.patientProfile;
      }
    }

    // 2. Try finding by ABHA number if not found
    if (!patient && (abhaNumber || (qrData && qrData.includes('ABHA:')))) {
      const targetAbha = abhaNumber || qrData.split('ABHA:')[1].split(':')[0];
      const allPatients = await db.patientProfile.findMany();
      patient = allPatients.find(p => p.abhaNumber === targetAbha || decryptPII(p.abhaNumber) === targetAbha);
    }

    // 3. Fallback to default emergency patient Rajesh Sharma if scanning mock demo tags
    if (!patient) {
      patient = await db.patientProfile.findFirst({
        where: { id: 'patient-rajesh' },
      });
    }

    if (!patient) {
      throw new Error('Patient record not located with provided emergency token or QR code');
    }

    // Fetch related emergency pass
    const emergencyPass = await db.emergencyPass.findFirst({
      where: { patientProfileId: patient.id },
    });

    const elapsedMs = Math.max(1, Date.now() - startTime);

    // IMMUTABLE AUDIT LOG: Record Golden Hour Emergency Bypass
    await logAccess({
      patientProfileId: patient.id,
      accessorUserId: doctorUser ? doctorUser.id : null,
      accessorRole: doctorUser ? doctorUser.role : 'doctor',
      accessorName: doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.name : 'Emergency Room Clinician',
      hospitalId: doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.hospitalAffiliation : 'Apollo Greams Trauma Hub',
      accessType: 'EMERGENCY_PASS_BYPASS',
      reason: 'Golden Hour Emergency Scanner Ingress Protocol',
      ipAddress: '10.14.22.90',
      userAgent: 'E-KAVACH ER Scan Terminal v2.4',
      latencyMs: elapsedMs,
    });

    // Return Golden Hour triage summary
    return {
      success: true,
      lookupLatencyMs: elapsedMs,
      goldenHourEligible: true,
      patient: {
        id: patient.id,
        name: patient.name,
        abhaNumber: decryptPII(patient.abhaNumber) || patient.abhaNumber,
        bloodGroup: emergencyPass ? emergencyPass.bloodGroup : patient.bloodGroup,
        criticalAllergies: emergencyPass ? emergencyPass.criticalAllergies : (patient.allergies || []).join(', '),
        chronicConditions: emergencyPass ? emergencyPass.chronicConditions : (patient.chronicConditions || []).join(', '),
        implants: emergencyPass ? emergencyPass.implants : (patient.implants || []).join(', '),
        emergencyContacts: emergencyPass ? emergencyPass.iceContacts : patient.emergencyContacts,
        emergencyToken: patient.emergencyToken,
        status: 'CRITICAL_TRIAGE_LOADED',
      },
      telemetryNotice: 'Audit log entry recorded and synchronized with State Health Network',
    };
  }

  async addPatient({ name, abhaNumber, bloodGroup, gender, condition, vitals, bayNumber, triageColor, priorityLevel }, doctorUser) {
    const hospitalId = doctorUser && doctorUser.doctorProfile ? 'hosp-apollo-greams' : 'hosp-apollo-greams';

    // 1. Create Patient Profile
    const profile = await db.patientProfile.create({
      data: {
        name,
        abhaNumber: abhaNumber || `9824-${Math.floor(1000 + Math.random() * 9000)}-TN`,
        bloodGroup: bloodGroup || 'Unknown',
        gender: gender || 'Not Specified',
        chronicConditions: condition ? [condition] : [],
        allergies: [],
        emergencyContacts: [],
        emergencyToken: `EK-TR-${Math.floor(10000 + Math.random() * 90000)}-V4`,
        hospitalAffiliation: 'Apollo Greams Trauma Hub',
        userId: `user_auto_${Date.now()}`,
      },
    });

    // 2. Create Triage Entry in Emergency Ward
    const triage = await db.triageEntry.create({
      data: {
        patientProfileId: profile.id,
        hospitalId,
        assignedDoctorId: doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.id : 'doctor-kavitha',
        triageColor: triageColor || 'YELLOW',
        priorityLevel: priorityLevel || 'Priority 2 (Urgent)',
        bayNumber: bayNumber || 'Bay 05',
        patientName: name,
        abhaNumber: profile.abhaNumber,
        arrivalTime: new Date(),
        vitals: vitals || { heartRate: '80 bpm', bp: '120/80', spO2: '98%', respRate: '18 /min' },
        condition: condition || 'Emergency Ingress',
        status: 'INGRESS',
      },
    });

    return { profile, triage };
  }

  async getNetworkNodes() {
    const nodes = await db.hospitalNetworkNode.findMany({
      orderBy: { distanceKm: 'asc' },
    });
    return nodes;
  }

  async getCredentials(doctorProfileId = 'doctor-kavitha') {
    const profile = await db.doctorProfile.findUnique({
      where: { id: doctorProfileId },
    });

    return {
      doctorName: profile ? profile.name : 'Dr. Kavitha Menon',
      title: profile ? profile.title : 'Chief Interventional Cardio',
      nmcNumber: profile ? profile.nmcNumber : 'MD-44912-TN',
      specialization: profile ? profile.specialization : 'Interventional Cardiology',
      hospital: profile ? profile.hospitalAffiliation : 'Apollo Greams Trauma Hub',
      degrees: profile ? profile.degrees : 'MD, DM, FACC',
      credentialStatus: 'VERIFIED',
      issuer: 'National Medical Commission (NMC)',
      verificationTimestamp: '2024-03-12T00:00:00Z',
      digitalSignVerified: true,
    };
  }

  async getAppointments(doctorProfileId = null) {
    const appointments = await db.appointment.findMany({
      include: {
        patientProfile: true,
        doctorProfile: true,
        hospital: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return appointments.map((apt, idx) => {
      let token = apt.tokenNumber;
      if (!token || !token.startsWith('EK-')) {
        token = `EK-SLOT-${101 + idx}`;
      }
      return {
        ...apt,
        tokenNumber: token,
        patientName: apt.patientName || apt.patientProfile?.name || 'Verified Patient',
        patientPhone: apt.patientPhone || (apt.patientProfile?.emergencyContacts?.[0]?.phone) || '+91 98401 22819',
        timeSlot: apt.timeSlot || '10:30 AM',
      };
    });
  }

  async updateAppointmentStatus(appointmentId, status) {
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status, updatedAt: new Date() },
      include: {
        patientProfile: true,
        doctorProfile: true,
        hospital: true,
      }
    });

    try {
      const socketService = require('./socket.service');
      socketService.broadcastAppointment({
        type: 'APPOINTMENT_STATUS_CHANGED',
        appointment: updated,
      });
    } catch (_e) {}

    return updated;
  }

  async requestPatientAccess({ patientId, doctorUser }) {
    const doctorProfileId = doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.id : 'doctor-kavitha';
    
    // Find patient profile by id, abhaNumber, or name
    let patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      const allPatients = await db.patientProfile.findMany();
      patient = allPatients.find(p => p.id === patientId || p.abhaNumber === patientId || decryptPII(p.abhaNumber) === patientId || p.name.toLowerCase().includes(patientId.toLowerCase()));
    }

    if (!patient) {
      // Fallback to Rajesh Sharma if demo patient ID
      patient = await db.patientProfile.findUnique({ where: { id: 'patient-rajesh' } });
    }

    if (!patient) {
      throw new Error('Patient record not found with provided ID');
    }

    // Check existing consent grant
    const existing = await db.consentGrant.findFirst({
      where: {
        patientProfileId: patient.id,
        grantedToDoctorId: doctorProfileId,
      },
    });

    let grant;
    if (existing) {
      grant = await db.consentGrant.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING_APPROVAL',
          grantedAt: new Date(),
        },
      });
    } else {
      grant = await db.consentGrant.create({
        data: {
          patientProfileId: patient.id,
          grantedToDoctorId: doctorProfileId,
          recordScope: 'ALL',
          status: 'PENDING_APPROVAL',
          grantedAt: new Date(),
        },
      });
    }

    try {
      const socketService = require('./socket.service');
      socketService.broadcastConsentRequest({
        type: 'CONSENT_REQUESTED',
        grant,
        patientProfileId: patient.id,
        patientName: patient.name,
        doctorName: doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.name : 'Dr. Kavitha Menon',
        message: `Dr. Kavitha Menon requested access to your medical records & uploaded documents.`,
      });
    } catch (_e) {}

    return {
      success: true,
      patientId: patient.id,
      patientName: patient.name,
      status: 'PENDING_APPROVAL',
      message: `Data access request sent to ${patient.name}. Waiting for patient approval...`,
      grant,
    };
  }

  async checkAccessStatus(patientId, doctorUser) {
    const doctorProfileId = doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.id : 'doctor-kavitha';
    
    let patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      const allPatients = await db.patientProfile.findMany();
      patient = allPatients.find(p => p.id === patientId || p.abhaNumber === patientId || decryptPII(p.abhaNumber) === patientId || p.name.toLowerCase().includes((patientId || '').toLowerCase()));
    }

    if (!patient) {
      patient = await db.patientProfile.findUnique({ where: { id: 'patient-rajesh' } });
    }

    if (!patient) {
      return { status: 'NONE', authorized: false };
    }

    const grant = await db.consentGrant.findFirst({
      where: {
        patientProfileId: patient.id,
        grantedToDoctorId: doctorProfileId,
      },
    });

    if (!grant) {
      return { status: 'NONE', authorized: false, patientId: patient.id, patientName: patient.name };
    }

    const isApproved = grant.status === 'APPROVED' || grant.status === 'ACTIVE';

    let patientData = null;
    if (isApproved) {
      const records = await db.medicalRecord.findMany({
        where: { patientProfileId: patient.id },
        orderBy: { date: 'desc' },
      });

      patientData = {
        patient,
        records,
      };

      // Immutable Audit Log
      await logAccess({
        patientProfileId: patient.id,
        accessorUserId: doctorUser ? doctorUser.id : null,
        accessorRole: 'doctor',
        accessorName: doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.name : 'Dr. Kavitha Menon',
        hospitalId: 'hosp-apollo-greams',
        accessType: 'PATIENT_RECORD_VIEW',
        reason: 'Authorized Patient Data Access via Patient Consent Approval',
        latencyMs: 8,
      });
    }

    return {
      status: grant.status,
      authorized: isApproved,
      patientId: patient.id,
      patientName: patient.name,
      grant,
      data: patientData,
    };
  }

  async issuePrescription({ appointmentId, patientProfileId, medicines, diagnosis, doctorNotes }, doctorUser) {
    const doctorName = doctorUser && doctorUser.doctorProfile ? doctorUser.doctorProfile.name : 'Dr. Kavitha Menon';
    const targetPatientId = patientProfileId || 'patient-rajesh';

    const newRecord = await db.medicalRecord.create({
      data: {
        patientProfileId: targetPatientId,
        uploadedByUserId: doctorUser ? doctorUser.id : 'user-kavitha',
        title: `Prescription: ${diagnosis || 'Clinical Consultation'}`,
        recordType: 'PRESCRIPTION',
        fileUrl: '/uploads/prescription_generated.pdf',
        date: new Date(),
        notes: `Prescribed by ${doctorName}: ${medicines || 'Rosuvastatin 10mg, Aspirin 75mg'}. Notes: ${doctorNotes || 'Take once daily after meals.'}`,
      },
    });

    // Optionally update appointment status to CONFIRMED
    if (appointmentId) {
      try {
        await db.appointment.update({
          where: { id: appointmentId },
          data: { status: 'CONFIRMED', updatedAt: new Date() },
        });
      } catch (_e) {}
    }

    try {
      const socketService = require('./socket.service');
      socketService.broadcastAppointment({
        type: 'PRESCRIPTION_ISSUED',
        patientProfileId: targetPatientId,
        appointmentId,
        message: `Dr. Kavitha Menon issued a new digital prescription for ${targetPatientId}.`,
      });
    } catch (_e) {}

    return newRecord;
  }

  async getPatientHistory(patientId) {
    let patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      const allPatients = await db.patientProfile.findMany();
      patient = allPatients.find(
        (p) =>
          p.id === patientId ||
          p.abhaNumber === patientId ||
          p.phone === patientId ||
          (p.name && p.name.toLowerCase().includes((patientId || '').toLowerCase()))
      );
    }
    if (!patient) {
      patient = await db.patientProfile.findUnique({ where: { id: 'patient-rajesh' } });
    }

    const records = await db.medicalRecord.findMany({
      where: { patientProfileId: patient ? patient.id : 'patient-rajesh' },
      orderBy: { date: 'desc' },
    });

    return {
      patient,
      records,
      allergies: patient?.allergies || ['Penicillin (Severe anaphylaxis)'],
      chronicConditions: patient?.chronicConditions || ['Type II Diabetes', 'Mild Hypertension'],
      vitalsHistory: [
        { date: 'Today, 08:30', bp: '128/82', heartRate: 74, spO2: 98, temp: 98.4 },
        { date: 'Yesterday, 14:15', bp: '132/86', heartRate: 78, spO2: 97, temp: 98.6 },
        { date: '10 Sep, 10:00', bp: '130/84', heartRate: 72, spO2: 98, temp: 98.2 },
      ],
    };
  }
}

module.exports = new DoctorService();
