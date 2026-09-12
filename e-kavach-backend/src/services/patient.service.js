const db = require('../database/db');
const { decryptPII, encryptPII, maskPII } = require('../utils/crypto');
const { logAccess } = require('../utils/auditLogger');
const {
  findNearbyHospitals,
  geocodeLocation,
  reverseGeocode,
  calculateHaversineDistance,
} = require('../utils/hospitalLocator');

class PatientService {
  async getProfile(userId) {
    let profile = await db.patientProfile.findUnique({
      where: { userId },
      include: {
        abhaAccount: true,
        emergencyPass: true,
      },
    });

    if (!profile) {
      // Fallback search by id or first patient profile
      profile = await db.patientProfile.findFirst({
        include: { abhaAccount: true, emergencyPass: true },
      });
    }

    if (!profile) {
      throw new Error('Patient profile not found');
    }

    return {
      ...profile,
      abhaNumber: decryptPII(profile.abhaNumber) || profile.abhaNumber,
    };
  }

  async updateProfile(userId, updateData) {
    let profile = await db.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await db.patientProfile.findFirst({});
    }

    if (!profile) {
      throw new Error('Patient profile not found');
    }

    const updatedProfile = await db.patientProfile.update({
      where: { id: profile.id },
      data: {
        ...(updateData.fullName || updateData.name ? { name: updateData.fullName || updateData.name } : {}),
        ...(updateData.bloodGroup ? { bloodGroup: updateData.bloodGroup } : {}),
        ...(updateData.gender ? { gender: updateData.gender } : {}),
        ...(updateData.age ? { age: updateData.age } : {}),
        ...(updateData.dob ? { dob: new Date(updateData.dob) } : {}),
        ...(updateData.aadhaarNumber || updateData.aadhaar ? { aadhaarNumber: updateData.aadhaarNumber || updateData.aadhaar } : {}),
        ...(updateData.address ? { address: updateData.address } : {}),
        ...(updateData.phone ? { phone: updateData.phone } : {}),
        ...(updateData.pincode ? { pincode: updateData.pincode } : {}),
        ...(updateData.state ? { state: updateData.state } : {}),
        ...(updateData.city ? { city: updateData.city } : {}),
        ...(updateData.emergencyContactName ? { emergencyContactName: updateData.emergencyContactName } : {}),
        ...(updateData.emergencyContactPhone ? { emergencyContactPhone: updateData.emergencyContactPhone } : {}),
        ...(updateData.emergencyContactRelation ? { emergencyContactRelation: updateData.emergencyContactRelation } : {}),
        ...(updateData.bpLevel ? { bpLevel: updateData.bpLevel } : {}),
        ...(updateData.hasDiabetes ? { hasDiabetes: updateData.hasDiabetes } : {}),
        ...(updateData.diabetesType ? { diabetesType: updateData.diabetesType } : {}),
        ...(updateData.diabetesMedication ? { diabetesMedication: updateData.diabetesMedication } : {}),
        ...(updateData.chronicConditions ? { chronicConditions: Array.isArray(updateData.chronicConditions) ? updateData.chronicConditions : [updateData.chronicConditions] } : {}),
        ...(updateData.allergies ? { allergies: Array.isArray(updateData.allergies) ? updateData.allergies : [updateData.allergies] } : {}),
        ...(updateData.emergencyContacts ? { emergencyContacts: updateData.emergencyContacts } : {}),
        updatedAt: new Date(),
      },
    });

    if (updateData.email || updateData.phone) {
      await db.user.update({
        where: { id: profile.userId },
        data: {
          ...(updateData.email ? { email: updateData.email } : {}),
          ...(updateData.phone ? { phone: updateData.phone } : {}),
        },
      }).catch(() => {});
    }

    const pass = await db.emergencyPass.findFirst({ where: { patientProfileId: profile.id } });
    if (pass) {
      await db.emergencyPass.update({
        where: { id: pass.id },
        data: {
          bloodGroup: updatedProfile.bloodGroup,
          criticalAllergies: (updatedProfile.allergies || []).join(', ') || 'None reported',
          chronicConditions: (updatedProfile.chronicConditions || []).join(', ') || 'None reported',
          iceContacts: updatedProfile.emergencyContacts || pass.iceContacts,
          updatedAt: new Date(),
        },
      }).catch(() => {});
    }

    return updatedProfile;
  }

  async getAbhaDetails(patientProfileId) {
    const abha = await db.abhaAccount.findFirst({
      where: { patientProfileId },
    });

    if (!abha) {
      // Return default ABDM profile if not yet created
      return {
        abhaNumber: '9824-8819-3320-TN',
        phrAddress: 'rajesh.sharma@abdm',
        linkedMobile: '+91 98401 22819',
        aadhaarRef: 'XXXX-XXXX-4819',
        verificationStatus: 'LEVEL-4 CERTIFIED',
        issueDate: '2023-01-10',
        qrPayload: 'ABDM:PHR:rajesh.sharma@abdm:ABHA:9824-8819-3320-TN',
      };
    }

    return {
      ...abha,
      abhaNumber: decryptPII(abha.abhaNumber) || abha.abhaNumber,
      linkedMobile: decryptPII(abha.linkedMobile) || abha.linkedMobile,
      aadhaarRef: decryptPII(abha.aadhaarRef) || abha.aadhaarRef,
    };
  }

  async generateAbha(patientProfileId, { phrPrefix = 'patient', linkedMobile, aadhaarNumber }) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newAbhaNumber = `9824-${Math.floor(1000 + Math.random() * 9000)}-${randomSuffix}-TN`;
    const phrAddress = `${phrPrefix.toLowerCase().replace(/[^a-z0-9]/g, '')}.${randomSuffix}@abdm`;

    const abha = await db.abhaAccount.upsert({
      where: { patientProfileId },
      create: {
        patientProfileId,
        abhaNumber: encryptPII(newAbhaNumber),
        phrAddress,
        linkedMobile: encryptPII(linkedMobile || '+91 98401 22819'),
        aadhaarRef: aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-4819',
        qrPayload: `ABDM:PHR:${phrAddress}:ABHA:${newAbhaNumber}`,
        verificationStatus: 'LEVEL-4 CERTIFIED',
        issueDate: new Date(),
      },
      update: {
        abhaNumber: encryptPII(newAbhaNumber),
        phrAddress,
        qrPayload: `ABDM:PHR:${phrAddress}:ABHA:${newAbhaNumber}`,
        updatedAt: new Date(),
      },
    });

    // Also update patientProfile
    await db.patientProfile.update({
      where: { id: patientProfileId },
      data: { abhaNumber: newAbhaNumber },
    });

    return {
      ...abha,
      abhaNumber: newAbhaNumber,
      linkedMobile: linkedMobile || '+91 98401 22819',
    };
  }

  async getEmergencyPass(patientProfileId) {
    const pass = await db.emergencyPass.findFirst({
      where: { patientProfileId },
    });

    if (!pass) {
      // Fallback to active pass
      return {
        passToken: 'EK-TR-88190-V4',
        bloodGroup: 'O+ (Rh Pos)',
        criticalAllergies: 'Severe Penicillin anaphylaxis reaction.',
        chronicConditions: 'Type II Diabetes (Insulin Dependent), Mild Hypertension',
        implants: 'Coronary Stent (DES - 2021)',
        iceContacts: [
          { name: 'Ananya S.', relation: 'Spouse', phone: '+91 98401 22819', priority: 1, verified: true },
          { name: 'Dr. Vivek Sharma', relation: 'Brother / Physician', phone: '+91 94440 88129', priority: 2, verified: true },
        ],
        status: 'ACTIVE',
        validUntil: '2027-12-31',
        qrMatrix: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a"/><text x="50" y="55" fill="%2306b6d4" font-size="8" text-anchor="middle">EKAVACH PASS</text></svg>',
      };
    }

    return pass;
  }

  async getHealthHistory(patientProfileId) {
    const records = await db.medicalRecord.findMany({
      where: { patientProfileId },
      orderBy: { date: 'desc' },
    });

    const consultations = await db.consultation.findMany({
      where: { patientProfileId },
      include: { doctorProfile: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      records,
      consultations,
      vitalsHistory: [
        { date: '2026-10-18', bloodPressure: '128/82', heartRate: '72 bpm', spO2: '98%', bloodSugar: '124 mg/dL' },
        { date: '2026-06-12', bloodPressure: '134/86', heartRate: '76 bpm', spO2: '97%', bloodSugar: '138 mg/dL' },
        { date: '2025-11-14', bloodPressure: '190/115', heartRate: '112 bpm', spO2: '88%', condition: 'Acute MI Emergency' },
      ],
      allergies: ['Penicillin (Severe anaphylaxis)'],
      conditions: ['Type II Diabetes (Insulin Dependent)', 'Mild Hypertension'],
      implants: ['Coronary Stent (DES - 2021)'],
    };
  }

  async getDoctors() {
    const doctors = await db.doctorProfile.findMany({
      include: { user: true }
    });
    return doctors.map(d => ({
      id: d.id,
      name: d.name,
      title: d.title,
      specialization: d.specialization,
      department: d.department,
      hospital: d.hospitalAffiliation || 'Apollo Greams Trauma Hub',
      nmcNumber: d.nmcNumber,
      degrees: d.degrees || 'MBBS, MD',
      experienceYears: d.experienceYears || 12,
      consultationFee: d.consultationFee || 750,
      availableSlots: d.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM', '05:30 PM'],
    }));
  }

  async uploadRecord(patientProfileId, userId, { title, recordType, notes, file }) {
    const newRecord = await db.medicalRecord.create({
      data: {
        patientProfileId,
        uploadedByUserId: userId,
        title: title || 'Clinical Document',
        recordType: recordType || 'LAB_REPORT',
        fileUrl: file ? `/uploads/${file.filename}` : '/uploads/sample_report.pdf',
        fileKey: file ? file.filename : null,
        date: new Date(),
        notes: notes || '',
      },
    });

    return newRecord;
  }

  async deleteRecord(patientProfileId, recordId) {
    const record = await db.medicalRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      const err = new Error('Record not found.');
      err.statusCode = 404;
      throw err;
    }
    if (patientProfileId && record.patientProfileId !== patientProfileId) {
      const err = new Error('Unauthorized: You do not have permission to delete this record.');
      err.statusCode = 403;
      throw err;
    }
    const deleted = await db.medicalRecord.delete({
      where: { id: recordId },
    });
    return deleted;
  }

  async verifyRecord(recordId, verifierInfo = {}) {
    const record = await db.medicalRecord.findUnique({
      where: { id: recordId }
    });
    if (!record) {
      const err = new Error('Medical record not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await db.medicalRecord.update({
      where: { id: recordId },
      data: {
        verificationStatus: verifierInfo.status || 'VERIFIED',
        verifiedBy: verifierInfo.verifierName || 'Dr. Kavitha Menon',
        verifiedAt: new Date(),
        verificationNotes: verifierInfo.notes || 'Verified clinical document against hospital health repository'
      }
    });
    return updated;
  }

  async getAppointments(patientProfileId) {
    const whereClause = patientProfileId ? {
      OR: [
        { patientProfileId },
        { patientProfileId: 'patient-rajesh' }
      ]
    } : {};
    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        doctorProfile: true,
        hospital: true,
        patientProfile: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return appointments.map((apt, idx) => {
      let token = apt.tokenNumber;
      if (!token || !token.startsWith('EK-')) {
        token = `EK-SLOT-${101 + idx}`;
      }
      const hospitalObj = typeof apt.hospital === 'object' && apt.hospital !== null ? apt.hospital : null;
      const hospitalName = hospitalObj?.name || (typeof apt.hospital === 'string' ? apt.hospital : 'Apollo Greams Trauma Hub');
      return {
        ...apt,
        tokenNumber: token,
        patientName: apt.patientName || apt.patientProfile?.name || 'Verified Patient',
        patientPhone: apt.patientPhone || (apt.patientProfile?.emergencyContacts?.[0]?.phone) || '+91 98401 22819',
        timeSlot: apt.timeSlot || '10:30 AM',
        hospital: hospitalName,
        hospitalDetails: hospitalObj || apt.hospital,
      };
    });
  }

  async createAppointment(patientProfileId, data) {
    const doctorProfileId = data.doctorProfileId || 'doctor-kavitha';
    const doctor = await db.doctorProfile.findUnique({
      where: { id: doctorProfileId }
    });

    const patient = await db.patientProfile.findUnique({
      where: { id: patientProfileId }
    });

    const scheduledDate = new Date(data.scheduledAt || Date.now() + 86400000);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeSlot = data.timeSlot || '10:30 AM';

    // Duplicate booking check: prevent double-click or simultaneous duplicate submissions
    const existingActive = await db.appointment.findFirst({
      where: {
        patientProfileId,
        doctorProfileId,
        timeSlot,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingActive) {
      const existingDateStr = new Date(existingActive.scheduledAt).toISOString().split('T')[0];
      if (existingDateStr === dateStr) {
        // Idempotent return: prevent unintended duplicate appointment creation on double-click
        return existingActive;
      }
    }

    // Package rich metadata (booking for self vs other patient, relation, diagnostic test, age, gender)
    let notesStr = data.notes || '';
    if (data.serviceType || data.relation || data.bookingFor || data.testName) {
      try {
        const metaObj = {
          serviceType: data.serviceType || 'DOCTOR_CONSULT',
          bookingFor: data.bookingFor || (data.relation && data.relation !== 'Self' ? 'OTHER' : 'SELF'),
          relation: data.relation || 'Self',
          testName: data.testName || null,
          patientAge: data.patientAge || data.age || '35',
          patientGender: data.patientGender || data.gender || 'Not Specified',
          patientAbha: data.patientAbha || data.abhaNumber || null,
          userNotes: typeof data.notes === 'string' ? data.notes : '',
        };
        notesStr = JSON.stringify(metaObj);
      } catch (_e) {
        notesStr = String(data.notes || '');
      }
    }

    const currentCount = await db.appointment.count();
    const generatedToken = data.tokenNumber || `EK-SLOT-${100 + currentCount + 1}`;

    const appointment = await db.appointment.create({
      data: {
        patientProfileId,
        doctorProfileId,
        hospitalId: data.hospitalId || (doctor && doctor.hospitalAffiliation ? (doctor.hospitalAffiliation.includes('AIIMS') ? 'HOSP-1' : doctor.hospitalAffiliation.includes('Fortis') ? 'HOSP-2' : doctor.hospitalAffiliation.includes('Manipal') ? 'HOSP-4' : 'hosp-apollo-greams') : 'hosp-apollo-greams'),
        patientName: data.patientName || (patient ? patient.name : 'Verified Patient'),
        patientPhone: data.patientPhone || (patient && patient.emergencyContacts && patient.emergencyContacts[0] ? patient.emergencyContacts[0].phone : '+91 98401 22819'),
        scheduledAt: new Date(data.scheduledAt || Date.now() + 86400000),
        timeSlot: data.timeSlot || '10:30 AM',
        mode: data.mode || 'IN_PERSON',
        // Access Control Rule: Patient bookings are always submitted as PENDING.
        // Patients cannot self-approve or decline appointments; only attending doctors have access to approve ('CONFIRMED') or decline ('DECLINED').
        status: 'PENDING',
        department: data.department || (doctor ? doctor.department : 'General Medicine'),
        symptoms: data.symptoms || data.testName || 'Routine Consultation',
        notes: notesStr,
        tokenNumber: generatedToken,
      },
      include: {
        doctorProfile: true,
        hospital: true,
        patientProfile: true,
      }
    });

    // Real-time broadcast
    try {
      const socketService = require('./socket.service');
      socketService.broadcastAppointment({
        type: 'APPOINTMENT_BOOKED',
        appointment,
        message: `Appointment booked for ${appointment.patientName} (${data.relation || 'Self'}) - Slot ${appointment.timeSlot}`,
      });
    } catch (_e) {}

    return appointment;
  }

  async quickIdAndBook(data) {
    const authService = require('./auth.service');
    let patient = null;
    let token = null;

    if (data.email || data.phone) {
      const existingUser = await db.user.findFirst({
        where: data.email ? { email: data.email } : { phone: data.phone },
        include: { patientProfile: true }
      });

      if (existingUser && existingUser.patientProfile) {
        patient = existingUser.patientProfile;
        const jwtUtils = require('../utils/jwt');
        token = jwtUtils.generateAccessToken({ userId: existingUser.id, role: 'patient' });
      }
    }

    if (!patient) {
      const abha = data.abhaNumber || `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-TN`;
      const registered = await authService.register({
        email: data.email || `patient_${Date.now()}@ekavach.health`,
        phone: data.phone || '+91 98401 ' + Math.floor(10000 + Math.random() * 90000),
        password: data.password || 'Ekavach@123',
        role: 'patient',
        name: data.name || 'Verified Patient',
        additionalDetails: {
          abhaNumber: abha,
          bloodGroup: data.bloodGroup || 'O+ (Rh Pos)',
          gender: data.gender || 'Not Specified',
          emergencyContacts: data.phone ? [{ name: 'Primary Contact', phone: data.phone, relation: 'Self', priority: 1 }] : [],
        }
      });
      token = registered.accessToken;
      patient = await db.patientProfile.findFirst({
        where: { abhaNumber: abha }
      });
    }

    const appointment = await this.createAppointment(patient ? patient.id : 'patient-rajesh', {
      ...data,
      patientName: data.name || (patient ? patient.name : 'Verified Patient'),
      patientPhone: data.phone,
    });

    return {
      success: true,
      patient,
      token,
      appointment,
      message: 'Health ID verified and appointment slot reserved in real-time!',
    };
  }

  async cancelAppointment(appointmentId) {
    const apt = await db.appointment.findUnique({
      where: { id: appointmentId }
    });
    if (!apt) throw new Error('Appointment not found');

    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', updatedAt: new Date() },
      include: { doctorProfile: true, hospital: true, patientProfile: true }
    });

    try {
      const socketService = require('./socket.service');
      socketService.broadcastAppointment({
        type: 'APPOINTMENT_CANCELLED',
        appointment: updated,
      });
    } catch (_e) {}

    return updated;
  }

  async getSchemes(patientProfileId) {
    const enrollments = await db.patientSchemeEnrollment.findMany({
      where: { patientProfileId },
      include: { scheme: true },
    });

    const allSchemes = await db.governmentScheme.findMany();

    return {
      enrollments,
      availableSchemes: allSchemes,
    };
  }

  async updateConsent(patientProfileId, { doctorProfileId, hospitalId, status = 'ACTIVE', recordScope = 'ALL' }) {
    const existing = await db.consentGrant.findFirst({
      where: {
        patientProfileId,
        grantedToDoctorId: doctorProfileId || undefined,
      },
    });

    if (existing) {
      const updated = await db.consentGrant.update({
        where: { id: existing.id },
        data: {
          status,
          recordScope,
          revokedAt: status === 'REVOKED' ? new Date() : null,
        },
      });
      return updated;
    }

    const created = await db.consentGrant.create({
      data: {
        patientProfileId,
        grantedToDoctorId: doctorProfileId,
        recordScope,
        status,
        grantedAt: new Date(),
      },
    });

    return created;
  }

  async getConsentRequests(patientProfileId) {
    const grants = await db.consentGrant.findMany({
      where: { patientProfileId },
      orderBy: { grantedAt: 'desc' },
    });

    const doctors = await db.doctorProfile.findMany();
    
    return grants.map(grant => {
      const doc = doctors.find(d => d.id === grant.grantedToDoctorId) || {
        name: 'Dr. Kavitha Menon',
        title: 'Chief Interventional Cardio',
        department: 'Cardiology',
        hospitalAffiliation: 'Apollo Greams Trauma Hub',
      };
      return {
        ...grant,
        doctorName: doc.name,
        doctorTitle: doc.title,
        department: doc.department,
        hospitalName: doc.hospitalAffiliation || 'Apollo Greams Trauma Hub',
      };
    });
  }

  async respondConsent(patientProfileId, { grantId, action }) {
    const grant = await db.consentGrant.findFirst({
      where: { id: grantId, patientProfileId },
    });

    if (!grant) {
      throw new Error('Data access request not found or unauthorized');
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'DECLINED';
    const updated = await db.consentGrant.update({
      where: { id: grantId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        revokedAt: action === 'DECLINE' ? new Date() : null,
      },
    });

    if (action === 'APPROVE') {
      await logAccess({
        patientProfileId,
        accessorRole: 'doctor',
        accessType: 'CONSENT_GRANTED_BY_PATIENT',
        reason: `Patient approved medical records and document access for Doctor ${grant.grantedToDoctorId || 'Clinician'}`,
        hospitalId: 'hosp-apollo-greams',
        latencyMs: 12,
      });
    }

    try {
      const socketService = require('./socket.service');
      socketService.broadcastConsentRequest({
        type: 'CONSENT_RESPONDED',
        grant: updated,
        action,
        patientProfileId,
        message: action === 'APPROVE' 
          ? `Patient approved data access request.` 
          : `Patient declined data access request.`
      });
    } catch (_e) {}

    return updated;
  }

  async getAccessLogs(patientProfileId) {
    const logs = await db.accessLog.findMany({
      where: { patientProfileId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return logs;
  }

  async createAccessLog(data) {
    const log = await db.accessLog.create({
      data: {
        id: data.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        patientProfileId: data.patientId || 'patient-rajesh',
        accessorRole: data.accessorRole || 'doctor',
        accessType: data.accessType || 'EMERGENCY_PASS_BYPASS',
        reason: data.reason || 'Emergency Triage Scan',
        hospitalId: data.hospitalId || 'hosp-apollo-greams',
        latencyMs: data.latencyMs || 0,
        timestamp: new Date(),
      },
    });
    return log;
  }

  async getNearbyHospitals(query = {}) {
    const rawLat = parseFloat(query.lat);
    const rawLng = parseFloat(query.lng);
    const hasUserCoords = !isNaN(rawLat) && !isNaN(rawLng);
    const locationQuery = query.location ? query.location.trim() : null;
    const radiusKm = parseFloat(query.radius) || 7;

    let searchTarget = null;
    if (locationQuery) {
      searchTarget = locationQuery;
    } else if (hasUserCoords) {
      searchTarget = { lat: rawLat, lng: rawLng };
    }

    // If a location query or specific coordinates are provided, run the full OpenStreetMap Nominatim + Overpass + Haversine locator
    if (searchTarget) {
      try {
        const locatorResult = await findNearbyHospitals(searchTarget, radiusKm);
        if (locatorResult && Array.isArray(locatorResult.hospitals) && locatorResult.hospitals.length > 0) {
          let filtered = locatorResult.hospitals;

          if (query.search) {
            const s = query.search.toLowerCase();
            filtered = filtered.filter(
              (h) =>
                h.name.toLowerCase().includes(s) ||
                h.city.toLowerCase().includes(s) ||
                h.address.toLowerCase().includes(s) ||
                (h.specialties && h.specialties.some((sp) => sp.toLowerCase().includes(s)))
            );
          }

          if (query.icuOnly === 'true' || query.filter === 'icu') {
            filtered = filtered.filter((h) => h.icuBedsAvailable > 0);
          }

          if (query.traumaOnly === 'true' || query.filter === 'trauma') {
            filtered = filtered.filter((h) => h.emergency24x7);
          }

          if (query.maxDistance) {
            const maxD = parseFloat(query.maxDistance);
            if (!isNaN(maxD)) {
              filtered = filtered.filter((h) => h.distanceKm <= maxD);
            }
          }

          filtered.sort((a, b) => a.distanceKm - b.distanceKm);

          return {
            success: true,
            userLocation: {
              lat: locatorResult.patientLocation.lat,
              lng: locatorResult.patientLocation.lng,
              areaName: locatorResult.patientLocation.areaName,
              city: locatorResult.patientLocation.city,
              state: locatorResult.patientLocation.state,
              displayName: locatorResult.patientLocation.displayName,
              label: `${locatorResult.patientLocation.areaName}, ${locatorResult.patientLocation.city}`,
              isDetected: true,
            },
            patientLocation: locatorResult.patientLocation,
            closestHospital: filtered[0] || locatorResult.closestHospital,
            radiusKm,
            count: filtered.length,
            hospitals: filtered,
          };
        }
      } catch (locatorErr) {
        console.warn('Locator execution warning:', locatorErr.message);
      }
    }

    // Default patient reference point if nothing provided: Central Reference Point (22.7196, 75.8577)
    const userLat = hasUserCoords ? rawLat : 22.7196;
    const userLng = hasUserCoords ? rawLng : 75.8577;

    const hospitals = await db.hospital.findMany();
    const schemaRecords = (await db.hospitalSchemaRecords?.findMany?.()) || [];
    const beds = await db.bed.findMany();

    function calcDistanceKm(lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
      return calculateHaversineDistance(lat1, lon1, lat2, lon2);
    }

    const enriched = hospitals.map((hosp) => {
      const schema = db.getHospitalSchema(hosp.id) || schemaRecords.find(s => s.hospital_id === hosp.id || s.id === hosp.id) || {};
      const hospBeds = beds.filter(b => b.hospitalId === hosp.id);

      const lat = typeof hosp.geoLat === 'number' ? hosp.geoLat : (schema.latitude || 22.7196);
      const lng = typeof hosp.geoLng === 'number' ? hosp.geoLng : (schema.longitude || 75.8577);

      const distanceKm = calcDistanceKm(userLat, userLng, lat, lng);
      const ambulanceMins = Math.max(2, Math.round(distanceKm * 1.6 + 2));
      const trafficMins = Math.max(4, Math.round(distanceKm * 2.6 + 4));

      const icuBedWard = hospBeds.find(b => b.wardType === 'ICU');
      const traumaWard = hospBeds.find(b => b.wardType === 'TRAUMA_BAY' || b.wardType === 'EMERGENCY');

      const icuBedsTotal = schema.icu_beds || hosp.icuBedsTotal || (icuBedWard ? icuBedWard.totalBeds : 30);
      const icuBedsOccupied = hosp.icuBedsOccupied || (icuBedWard ? icuBedWard.occupiedBeds : Math.max(0, icuBedsTotal - (schema.icu_available || 4)));
      const icuBedsAvailable = schema.icu_available !== undefined 
        ? schema.icu_available 
        : (icuBedWard ? icuBedWard.availableBeds : Math.max(0, icuBedsTotal - icuBedsOccupied));

      const totalBeds = schema.total_beds || hosp.wardBedsTotal || 350;
      const availableBeds = schema.available_beds !== undefined ? schema.available_beds : Math.max(0, totalBeds - (hosp.wardBedsOccupied || 280));

      const emergencyBedsTotal = schema.emergency_beds || (traumaWard ? traumaWard.totalBeds : 12);
      const emergencyBedsAvailable = schema.emergency_available !== undefined ? schema.emergency_available : (traumaWard ? traumaWard.availableBeds : 4);

      const ventilatorsTotal = schema.ventilator_count || hosp.ventilatorsTotal || 18;
      const ventilatorsInUse = hosp.ventilatorsInUse || Math.min(ventilatorsTotal - 3, 14);
      const ventilatorsAvailable = Math.max(1, ventilatorsTotal - ventilatorsInUse);

      const oxygenBeds = schema.oxygen_beds || Math.round(totalBeds * 0.35);
      const bloodBankAvailable = schema.blood_bank_available !== undefined ? schema.blood_bank_available : true;
      const emergency24x7 = schema.emergency_24x7 !== undefined ? schema.emergency_24x7 : true;

      const specialties = schema.specialities || hosp.departments || ['Emergency & Trauma', 'Critical Care', 'Cardiology', 'Neurology'];
      const facilities = hosp.facilities || ['24x7 Emergency Triage', 'Advanced Cath Lab', 'Central Telemetry Grid', 'O2 Cryo Reservoir', 'Trauma Bays'];

      let readinessScore = 95;
      if (icuBedsAvailable > 5) readinessScore += 4;
      if (emergencyBedsAvailable > 2) readinessScore += 1;
      if (icuBedsAvailable === 0) readinessScore -= 20;

      return {
        id: hosp.id,
        name: schema.hospital_name || hosp.name,
        code: hosp.code || schema.registration_number || 'EK-HSP-NODE',
        hospitalType: schema.hospital_type || (hosp.id.includes('STANLEY') || hosp.id.includes('AIIMS') ? 'Government' : 'Private'),
        address: schema.address || hosp.address,
        city: schema.city || hosp.city || 'Indore',
        state: schema.state || hosp.state || 'Madhya Pradesh',
        pincode: schema.pincode || hosp.pinCode || '452001',
        geoLat: lat,
        geoLng: lng,
        distanceKm,
        ambulanceMins,
        trafficMins,
        icuBedsTotal,
        icuBedsOccupied,
        icuBedsAvailable,
        totalBeds,
        availableBeds,
        emergencyBedsTotal,
        emergencyBedsAvailable,
        oxygenBeds,
        ventilatorsTotal,
        ventilatorsAvailable,
        bloodBankAvailable,
        emergency24x7,
        accreditation: hosp.accreditation || 'NABH / JCI Tier-1 Accredited',
        contactNumbers: {
          er: hosp.contactNumbers?.er || schema.contact_number || '+91 11 2658 8500',
          helpline: hosp.contactNumbers?.helpline || '1066',
          ambulance: hosp.contactNumbers?.ambulance || '108',
          email: schema.email || 'er.triage@ekavach.health'
        },
        specialties,
        facilities,
        status: hosp.status || 'ACTIVE',
        readinessScore: Math.min(100, readinessScore),
        isTraumaHub: true,
      };
    });

    let filtered = enriched;
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(s) ||
        h.city.toLowerCase().includes(s) ||
        h.address.toLowerCase().includes(s) ||
        h.specialties.some(sp => sp.toLowerCase().includes(s))
      );
    }

    if (query.icuOnly === 'true' || query.filter === 'icu') {
      filtered = filtered.filter(h => h.icuBedsAvailable > 0);
    }

    if (query.traumaOnly === 'true' || query.filter === 'trauma') {
      filtered = filtered.filter(h => h.emergency24x7);
    }

    if (query.maxDistance) {
      const maxD = parseFloat(query.maxDistance);
      if (!isNaN(maxD)) {
        filtered = filtered.filter(h => h.distanceKm <= maxD);
      }
    }

    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      userLocation: {
        lat: userLat,
        lng: userLng,
        areaName: 'Local Area',
        city: 'Indore',
        state: 'Madhya Pradesh',
        isDetected: hasUserCoords,
        label: hasUserCoords ? 'Detected Live GPS Location' : 'Default Patient Location (Indore)'
      },
      patientLocation: {
        lat: userLat,
        lng: userLng,
        areaName: 'Local Area',
        city: 'Indore',
        state: 'Madhya Pradesh',
        displayName: 'Indore, Madhya Pradesh, India',
      },
      closestHospital: filtered[0] || null,
      radiusKm,
      count: filtered.length,
      hospitals: filtered,
    };
  }

  async getIpLocation(reqIp = '') {
    try {
      const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          return {
            success: true,
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            city: data.city || 'Chennai',
            region: data.region || 'Tamil Nadu',
            country: data.country_name || 'India',
            label: `${data.city || 'Detected Area'}, ${data.region || 'India'} (IP Synced)`,
            source: 'IP_GEO',
          };
        }
      }
    } catch (e) {
      console.warn('IP Geolocation fallback warning:', e.message);
    }

    return {
      success: true,
      lat: 13.0604,
      lng: 80.2496,
      city: 'Chennai',
      region: 'Tamil Nadu',
      country: 'India',
      label: 'Thousand Lights, Chennai (Default Clinical Grid)',
      source: 'DEFAULT',
    };
  }

  async getRoute(query = {}) {
    const fromLat = parseFloat(query.fromLat);
    const fromLng = parseFloat(query.fromLng);
    const toLat = parseFloat(query.toLat);
    const toLng = parseFloat(query.toLng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      throw new Error('Valid fromLat, fromLng, toLat, and toLng coordinates are required.');
    }

    try {
      // Call Open Source Routing Machine for real road geometry & steps
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'EKavach-Health-Emergency/1.0' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Convert [lng, lat] to [lat, lng] for Leaflet
          const coordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMins = Math.max(1, Math.round(route.duration / 60));
          const ambulanceMins = Math.max(1, Math.round(durationMins * 0.65)); // Emergency siren priority speed

          const steps = (route.legs?.[0]?.steps || []).map((s, idx) => ({
            id: idx + 1,
            instruction: s.maneuver?.instruction || (s.name ? `Proceed onto ${s.name}` : 'Continue on route'),
            type: s.maneuver?.type || 'straight',
            modifier: s.maneuver?.modifier || '',
            name: s.name || 'Main Corridor',
            distanceMeters: Math.round(s.distance),
            distanceFormatted: s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`,
            durationSec: Math.round(s.duration),
            location: [s.maneuver?.location?.[1] || fromLat, s.maneuver?.location?.[0] || fromLng],
          }));

          return {
            success: true,
            provider: 'OSRM_REAL_ROADS',
            distanceKm,
            durationMins,
            ambulanceMins,
            coordinates,
            steps,
            summary: route.legs?.[0]?.summary || 'Fastest emergency corridor',
          };
        }
      }
    } catch (err) {
      console.warn('Real-road routing fetch warning, falling back to realistic spline:', err.message);
    }

    // Fallback: Generate high-resolution curved road path
    function calcDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    }

    const dist = calcDistanceKm(fromLat, fromLng, toLat, toLng);
    const ambulanceMins = Math.max(2, Math.round(dist * 1.5 + 2));
    const durationMins = Math.max(4, Math.round(dist * 2.4 + 4));

    // Generate 12 intermediate curved street vertices
    const coordinates = [];
    const numPoints = Math.max(10, Math.min(40, Math.round(dist * 3)));
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Bezier curve with realistic road deviations
      const curveOffset = Math.sin(t * Math.PI) * 0.008;
      const lat = fromLat + (toLat - fromLat) * t + curveOffset * (toLng > fromLng ? 1 : -1);
      const lng = fromLng + (toLng - fromLng) * t - curveOffset * (toLat > fromLat ? 1 : -1);
      coordinates.push([lat, lng]);
    }

    const steps = [
      {
        id: 1,
        instruction: 'Head toward the primary arterial corridor',
        type: 'depart',
        modifier: '',
        name: 'Local Access Road',
        distanceMeters: Math.round((dist * 1000) * 0.15),
        distanceFormatted: `${(dist * 0.15).toFixed(1)} km`,
        durationSec: 120,
      },
      {
        id: 2,
        instruction: 'Take the fast-lane emergency corridor towards the medical center',
        type: 'turn',
        modifier: 'straight',
        name: 'Arterial Highway',
        distanceMeters: Math.round((dist * 1000) * 0.7),
        distanceFormatted: `${(dist * 0.7).toFixed(1)} km`,
        durationSec: 360,
      },
      {
        id: 3,
        instruction: 'Turn into the Emergency Trauma Ingress Bay on your right',
        type: 'arrive',
        modifier: 'right',
        name: 'Hospital ER Ingress Ramp',
        distanceMeters: Math.round((dist * 1000) * 0.15),
        distanceFormatted: `${(dist * 0.15).toFixed(1)} km`,
        durationSec: 90,
      },
    ];

    return {
      success: true,
      provider: 'EMERGENCY_CORRIDOR_SPLINE',
      distanceKm: dist,
      durationMins,
      ambulanceMins,
      coordinates,
      steps,
      summary: 'Direct Emergency Transit Corridor',
    };
  }
}

module.exports = new PatientService();
