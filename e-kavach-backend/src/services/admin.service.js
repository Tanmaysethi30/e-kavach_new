const db = require('../database/db');
const socketService = require('./socket.service');

class AdminService {
  async getHospitalDetails(user = {}) {
    const hospitalId = user.hospitalId || user.id || 'hosp-apollo-greams';
    const hospitalName = user.hospital || user.name || 'Apollo Greams Trauma Hub';

    let hospital = await db.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      hospital = (await db.hospital.findMany()).find(
        (h) => h.id === hospitalId || h.name.toLowerCase() === hospitalName.toLowerCase()
      );
    }

    if (!hospital) {
      hospital = await db.hospital.create({
        data: {
          id: hospitalId,
          name: hospitalName,
          code: user.hospitalId || user.tag || 'AP-HSP-842-TN',
          address: user.address || '21 Greams Lane, Off Greams Road, Thousand Lights',
          city: user.city || 'Chennai',
          state: user.state || 'Tamil Nadu',
          pinCode: user.pinCode || '600006',
          geoLat: 13.0604,
          geoLng: 80.2496,
          departments: ['Cardiology', 'Emergency & Trauma', 'Neurology', 'Orthopedics', 'ICU & Critical Care', 'Surgery', 'Pediatrics', 'Radiology'],
          facilities: ['O2 Cryo Tank', 'Invasive Ventilators', 'Central Telemetry', 'Trauma Bays', 'Helipad'],
          contactNumbers: { er: user.phone || '+91 44 2829 0200', helpline: '1066', ambulance: '108', email: user.email || 'admin@apollo.org' },
          icuBedsTotal: 50,
          icuBedsOccupied: 46,
          wardBedsTotal: 400,
          wardBedsOccupied: 336,
          status: 'ACTIVE',
          accreditation: 'NABH / JCI Accredited',
          oxygenReservesPct: 98,
          ventilatorsInUse: 14,
          ventilatorsTotal: 18,
          telemetryActivePct: 100,
        },
      });
    }

    let beds = await db.bed.findMany({ where: { hospitalId } });
    if (!beds || beds.length === 0) {
      // Seed default wards for this hospital
      const initialWards = [
        { wardType: 'TRAUMA_BAY', name: 'Trauma & Emergency Bay', location: 'Ground Floor • Wing A', category: 'Emergency', totalBeds: 8, occupiedBeds: 6, availableBeds: 2 },
        { wardType: 'ICU', name: 'Intensive Care Unit (ICU Node 1-3)', location: '2nd Floor • Wing B', category: 'Critical Care', totalBeds: 50, occupiedBeds: 46, availableBeds: 4 },
        { wardType: 'CCU', name: 'Cardiac Care Unit (CCU)', location: '3rd Floor • Wing A', category: 'Critical Care', totalBeds: 32, occupiedBeds: 28, availableBeds: 4 },
        { wardType: 'SURGICAL', name: 'Surgical Post-Op Recovery', location: '4th Floor • Wing C', category: 'Inpatient', totalBeds: 40, occupiedBeds: 31, availableBeds: 9 },
        { wardType: 'GENERAL', name: 'General Medical Ward', location: 'Floors 5 & 6 • East Wing', category: 'Inpatient', totalBeds: 180, occupiedBeds: 152, availableBeds: 28 },
        { wardType: 'DELUXE', name: 'Semi-Private & Deluxe Inpatient', location: '7th Floor • Wing D', category: 'Inpatient', totalBeds: 90, occupiedBeds: 75, availableBeds: 15 },
        { wardType: 'NICU', name: 'Pediatric & Neonatal ICU (NICU)', location: '3rd Floor • Wing C', category: 'Critical Care', totalBeds: 30, occupiedBeds: 26, availableBeds: 4 },
        { wardType: 'ISOLATION', name: 'Isolation & Infectious Disease', location: 'Ground Floor • Annex', category: 'Critical Care', totalBeds: 20, occupiedBeds: 18, availableBeds: 2 }
      ];

      beds = [];
      for (const w of initialWards) {
        const created = await db.bed.create({
          data: {
            ...w,
            hospitalId,
          }
        });
        beds.push(created);
      }
    }

    const doctors = await db.doctorProfile.findMany();
    const staff = await db.staffMember.findMany({ where: { hospitalId } });

    const totalBeds = beds.reduce((acc, b) => acc + (b.totalBeds || 0), 0);
    const occupiedBeds = beds.reduce((acc, b) => acc + (b.occupiedBeds || 0), 0);
    const availableBeds = beds.reduce((acc, b) => acc + (b.availableBeds || Math.max(0, (b.totalBeds || 0) - (b.occupiedBeds || 0))), 0);

    const formattedWards = beds.map((w, idx) => {
      const total = w.totalBeds || 10;
      const occ = w.occupiedBeds || 0;
      const avail = w.availableBeds !== undefined ? w.availableBeds : Math.max(0, total - occ);
      const pct = total > 0 ? parseFloat(((occ / total) * 100).toFixed(1)) : 0;
      return {
        id: w.id || idx + 1,
        wardType: w.wardType,
        name: w.name || `${w.wardType} Ward`,
        location: w.location || 'Main Building',
        category: w.category || (w.wardType === 'ICU' || w.wardType === 'CCU' ? 'Critical Care' : 'Inpatient'),
        totalBeds: total,
        occupied: occ,
        available: avail,
        pct,
        status: pct >= 90 ? 'Nearing Capacity' : 'Available',
        statusType: pct >= 90 ? 'secondary' : 'tertiary',
        actionType: 'manage'
      };
    });

    return {
      hospital: {
        id: hospital.id,
        name: hospital.name,
        code: hospital.code || 'AP-HSP-842-TN',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        pinCode: hospital.pinCode || '',
        contactPhone: hospital.contactNumbers?.er || user.phone || '+91 44 2829 0200',
        emergencyEmail: hospital.contactNumbers?.email || user.email || 'admin@apollo.org',
        helpline: hospital.contactNumbers?.helpline || '1066',
        ambulance: hospital.contactNumbers?.ambulance || '108',
        departments: hospital.departments || ['Cardiology', 'Emergency & Trauma', 'ICU & Critical Care'],
        facilities: hospital.facilities || ['O2 Tank', 'Ventilators', 'Telemetry'],
        oxygenReservesPct: hospital.oxygenReservesPct || 98,
        ventilatorsInUse: hospital.ventilatorsInUse || 14,
        ventilatorsTotal: hospital.ventilatorsTotal || 18,
        telemetryActivePct: hospital.telemetryActivePct || 100,
        status: hospital.status || 'ACTIVE',
        accreditation: hospital.accreditation || 'NABH Accredited',
      },
      metrics: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
      wards: formattedWards,
      doctors: doctors.slice(0, 10),
      staffCount: staff.length,
    };
  }

  async updateHospitalDetails(user = {}, updateData = {}) {
    const hospitalId = user.hospitalId || user.id || updateData.id || 'hosp-apollo-greams';

    let existing = await db.hospital.findUnique({ where: { id: hospitalId } });
    if (!existing) {
      existing = (await db.hospital.findMany()).find(
        (h) => h.id === hospitalId || h.name.toLowerCase() === (updateData.name || '').toLowerCase()
      );
    }

    const payload = {
      name: updateData.name || existing?.name || user.name || 'Apollo Greams Trauma Hub',
      code: updateData.code || existing?.code || 'AP-HSP-842-TN',
      address: updateData.address || existing?.address || '',
      city: updateData.city || existing?.city || '',
      state: updateData.state || existing?.state || '',
      pinCode: updateData.pinCode || updateData.pincode || existing?.pinCode || '',
      departments: updateData.departments || existing?.departments || [],
      facilities: updateData.facilities || existing?.facilities || [],
      contactNumbers: {
        er: updateData.contactPhone || existing?.contactNumbers?.er || '',
        email: updateData.emergencyEmail || existing?.contactNumbers?.email || '',
        helpline: updateData.helpline || existing?.contactNumbers?.helpline || '1066',
        ambulance: updateData.ambulance || existing?.contactNumbers?.ambulance || '108',
      },
      oxygenReservesPct: typeof updateData.oxygenReservesPct === 'number' ? updateData.oxygenReservesPct : (existing?.oxygenReservesPct || 98),
      ventilatorsInUse: typeof updateData.ventilatorsInUse === 'number' ? updateData.ventilatorsInUse : (existing?.ventilatorsInUse || 14),
      ventilatorsTotal: typeof updateData.ventilatorsTotal === 'number' ? updateData.ventilatorsTotal : (existing?.ventilatorsTotal || 18),
      telemetryActivePct: typeof updateData.telemetryActivePct === 'number' ? updateData.telemetryActivePct : (existing?.telemetryActivePct || 100),
      status: updateData.status || existing?.status || 'ACTIVE',
      accreditation: updateData.accreditation || existing?.accreditation || 'NABH Accredited',
    };

    let updatedHospital;
    if (existing) {
      updatedHospital = await db.hospital.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      updatedHospital = await db.hospital.create({
        data: {
          id: hospitalId,
          ...payload,
        },
      });
    }

    // Update beds if supplied
    if (Array.isArray(updateData.wards)) {
      for (const w of updateData.wards) {
        if (w.id) {
          const bedItem = await db.bed.findUnique({ where: { id: w.id } });
          if (bedItem) {
            await db.bed.update({
              where: { id: w.id },
              data: {
                name: w.name,
                location: w.location,
                category: w.category,
                totalBeds: w.totalBeds,
                occupiedBeds: w.occupied !== undefined ? w.occupied : w.occupiedBeds,
                availableBeds: w.available !== undefined ? w.available : Math.max(0, w.totalBeds - (w.occupied || 0)),
              },
            });
          }
        }
      }
    }

    try {
      socketService.broadcastTelemetry('hospital:updated', updatedHospital);
    } catch (_e) {}

    return this.getHospitalDetails(user);
  }

  async getDashboardSummary(user = {}) {
    const hospitalId = user.hospitalId || user.id || 'hosp-apollo-greams';
    const beds = await db.bed.findMany({ where: { hospitalId } });
    const triageEntries = await db.triageEntry.findMany({ where: { hospitalId } });
    const pharmacyItems = await db.pharmacyItem.findMany({ where: { hospitalId } });
    const staffMembers = await db.staffMember.findMany({ where: { hospitalId } });
    const hospitalDetails = await this.getHospitalDetails(user);

    const totalBeds = beds.reduce((acc, b) => acc + b.totalBeds, 0) || 450;
    const occupiedBeds = beds.reduce((acc, b) => acc + b.occupiedBeds, 0) || 382;
    const availableBeds = beds.reduce((acc, b) => acc + b.availableBeds, 0) || 68;

    const icuBed = beds.find((b) => b.wardType === 'ICU') || { totalBeds: 50, occupiedBeds: 46, availableBeds: 4 };
    const ccuBed = beds.find((b) => b.wardType === 'CCU') || { totalBeds: 32, occupiedBeds: 28, availableBeds: 4 };
    const traumaBed = beds.find((b) => b.wardType === 'TRAUMA_BAY') || { totalBeds: 8, occupiedBeds: 6, availableBeds: 2 };

    const redTriage = triageEntries.filter((t) => t.triageColor === 'RED').length;
    const yellowTriage = triageEntries.filter((t) => t.triageColor === 'YELLOW').length;
    const greenTriage = triageEntries.filter((t) => t.triageColor === 'GREEN').length;

    const lowStockItems = pharmacyItems.filter((p) => p.status === 'LOW_STOCK' || p.stockQty <= p.reorderThreshold);
    const onDutyStaff = staffMembers.filter((s) => s.status === 'ON_DUTY').length;

    return {
      hospital: {
        id: hospitalId,
        name: 'Apollo Greams Trauma Hub',
        code: 'AP-HSP-842-TN',
        status: 'OPERATIONAL',
      },
      bedMetrics: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availableBeds,
        occupancyRate: Math.round((occupiedBeds / totalBeds) * 100),
        icu: {
          total: icuBed.totalBeds,
          occupied: icuBed.occupiedBeds,
          available: icuBed.availableBeds,
          loadPct: Math.round((icuBed.occupiedBeds / icuBed.totalBeds) * 100),
        },
        ccu: {
          total: ccuBed.totalBeds,
          occupied: ccuBed.occupiedBeds,
          available: ccuBed.availableBeds,
        },
        traumaBay: {
          total: traumaBed.totalBeds,
          occupied: traumaBed.occupiedBeds,
          available: traumaBed.availableBeds,
        },
      },
      triageMetrics: {
        totalActive: triageEntries.length,
        red: redTriage,
        yellow: yellowTriage,
        green: greenTriage,
      },
      operationsMetrics: {
        totalStaff: staffMembers.length,
        onDutyStaff,
        lowStockPharmacyCount: lowStockItems.length,
      },
      recentIngress: triageEntries.slice(0, 5),
    };
  }

  async getBeds(hospitalId = 'hosp-apollo-greams') {
    return await db.bed.findMany({ where: { hospitalId } });
  }

  async updateBed(bedId, updateData) {
    const existing = await db.bed.findUnique({ where: { id: bedId } });
    if (!existing) {
      throw new Error(`Bed category with id ${bedId} not found`);
    }

    const occupied = typeof updateData.occupiedBeds === 'number' ? updateData.occupiedBeds : existing.occupiedBeds;
    const total = typeof updateData.totalBeds === 'number' ? updateData.totalBeds : existing.totalBeds;
    const available = Math.max(0, total - occupied);

    const updated = await db.bed.update({
      where: { id: bedId },
      data: {
        ...updateData,
        occupiedBeds: occupied,
        totalBeds: total,
        availableBeds: available,
      },
    });

    // Broadcast live telemetry update
    socketService.broadcastTelemetry('bed:update', updated);

    return updated;
  }

  async getPharmacy(hospitalId = 'hosp-apollo-greams') {
    return await db.pharmacyItem.findMany({ where: { hospitalId } });
  }

  async updatePharmacy(itemId, updateData) {
    const existing = await db.pharmacyItem.findUnique({ where: { id: itemId } });
    if (!existing) {
      throw new Error(`Pharmacy item with id ${itemId} not found`);
    }

    const stock = typeof updateData.stockQty === 'number' ? updateData.stockQty : existing.stockQty;
    const threshold = typeof updateData.reorderThreshold === 'number' ? updateData.reorderThreshold : existing.reorderThreshold;

    let status = 'IN_STOCK';
    if (stock <= 0) status = 'OUT_OF_STOCK';
    else if (stock <= threshold) status = 'LOW_STOCK';

    const updated = await db.pharmacyItem.update({
      where: { id: itemId },
      data: {
        ...updateData,
        stockQty: stock,
        status,
      },
    });

    // Broadcast if stock status changed
    if (status !== existing.status) {
      socketService.broadcastTelemetry('pharmacy:alert', {
        item: updated.name,
        status: updated.status,
        stockQty: updated.stockQty,
      });
    }

    return updated;
  }

  async getStaff(hospitalId = 'hosp-apollo-greams') {
    return await db.staffMember.findMany({ where: { hospitalId } });
  }

  async getDoctors() {
    return await db.doctorProfile.findMany();
  }

  async createDoctor(data) {
    const doctor = await db.doctorProfile.create({
      data: {
        name: data.name.startsWith('Dr.') ? data.name : `Dr. ${data.name}`,
        title: data.title || `${data.specialty || 'Specialist'} - Consultant`,
        nmcNumber: data.nmc || data.nmcNumber || `TN-MC-${Math.floor(10000 + Math.random() * 90000)}`,
        specialization: data.specialty || data.specialization || 'Interventional Cardiology',
        department: data.department || data.ward || 'Cardiology',
        hospitalAffiliation: data.hospitalAffiliation || 'Apollo Greams Trauma Hub',
        degrees: data.degrees || 'MD, DM',
        credentialStatus: 'VERIFIED',
        consultationFee: typeof data.consultationFee === 'number' ? data.consultationFee : 800,
        experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : 10,
        availableSlots: data.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'],
        status: data.status || 'Available',
      },
    });
    try {
      socketService.broadcastTelemetry('doctor:updated', doctor);
    } catch (_e) {}
    return doctor;
  }

  async updateDoctor(id, data) {
    const updated = await db.doctorProfile.update({
      where: { id },
      data,
    });
    try {
      socketService.broadcastTelemetry('doctor:updated', updated);
    } catch (_e) {}
    return updated;
  }

  async deleteDoctor(id) {
    const deleted = await db.doctorProfile.delete({
      where: { id },
    });
    try {
      socketService.broadcastTelemetry('doctor:deleted', { id });
    } catch (_e) {}
    return deleted;
  }

  async getPatients() {
    const patients = await db.patientProfile.findMany({
      include: {
        emergencyPass: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return patients;
  }

  async createPatient(data) {
    const profile = await db.patientProfile.create({
      data: {
        name: data.name,
        abhaNumber: data.abhaNumber || data.abha || `9824-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-TN`,
        bloodGroup: data.bloodGroup || 'O+ (Rh Pos)',
        gender: data.gender || (data.ageGender && data.ageGender.includes('F') ? 'Female' : 'Male'),
        hospitalAffiliation: 'Apollo Greams Trauma Hub',
        emergencyToken: `EK-TR-${Math.floor(10000 + Math.random() * 90000)}-V4`,
        chronicConditions: data.conditions || [],
        allergies: data.allergies || [],
        emergencyContacts: [
          { name: data.emergencyContact || 'Primary Relative', relation: 'Family', phone: data.phone || '+91 98401 22819', priority: 1 }
        ]
      }
    });

    try {
      socketService.broadcastTelemetry('patient:registered', {
        id: profile.id,
        name: profile.name,
        abha: profile.abhaNumber,
        timestamp: new Date().toISOString()
      });
    } catch (_e) {}

    return profile;
  }

  async getHospitalNetwork() {
    return await db.hospitalNetworkNode.findMany({
      orderBy: { distanceKm: 'asc' },
    });
  }
}

module.exports = new AdminService();
