const { seedHospitals, seedUsers, seedPatientProfiles, seedDoctorProfiles, seedHospitalAdminProfiles, seedEmergencyPass, seedAbhaAccounts, seedGovernmentSchemes, seedSchemeEnrollments, seedBeds, seedTriageEntries, seedStaffMembers, seedPharmacyItems, seedNetworkNodes, seedAppointments, seedMedicalRecords, seedConsentGrants, seedAccessLogs } = require('./seedData');
const { encryptPII, decryptPII } = require('../utils/crypto');
const fs = require('fs');
const path = require('path');

const DB_FILE_PATH = path.join(__dirname, 'local_db.json');

/**
 * High-performance Persistent Local Repository Engine with Prisma Query Interface
 */
class InMemoryRepository {
  constructor() {
    this.loadFromDisk();
  }

  loadFromDisk() {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.data = JSON.parse(raw);
        console.log('✅ Connected to local disk database pipeline (local_db.json)');
        return;
      } catch (err) {
        console.warn('⚠️ Could not load existing local_db.json, re-initializing seed:', err.message);
      }
    }

    // Seed initial local database
    this.data = {
      user: JSON.parse(JSON.stringify(seedUsers)),
      hospital: JSON.parse(JSON.stringify(seedHospitals)),
      patientProfile: JSON.parse(JSON.stringify(seedPatientProfiles)),
      doctorProfile: JSON.parse(JSON.stringify(seedDoctorProfiles)),
      hospitalAdminProfile: JSON.parse(JSON.stringify(seedHospitalAdminProfiles)),
      emergencyPass: JSON.parse(JSON.stringify(seedEmergencyPass)),
      abhaAccount: JSON.parse(JSON.stringify(seedAbhaAccounts)),
      governmentScheme: JSON.parse(JSON.stringify(seedGovernmentSchemes)),
      patientSchemeEnrollment: JSON.parse(JSON.stringify(seedSchemeEnrollments)),
      bed: JSON.parse(JSON.stringify(seedBeds)),
      triageEntry: JSON.parse(JSON.stringify(seedTriageEntries)),
      staffMember: JSON.parse(JSON.stringify(seedStaffMembers)),
      pharmacyItem: JSON.parse(JSON.stringify(seedPharmacyItems)),
      hospitalNetworkNode: JSON.parse(JSON.stringify(seedNetworkNodes)),
      appointment: JSON.parse(JSON.stringify(seedAppointments)),
      medicalRecord: JSON.parse(JSON.stringify(seedMedicalRecords)),
      consentGrant: JSON.parse(JSON.stringify(seedConsentGrants)),
      accessLog: JSON.parse(JSON.stringify(seedAccessLogs)),
      notification: [],
      conversation: [],
      message: [],
    };

    // Encrypt initial PII in patientProfile and abhaAccount
    this.data.patientProfile.forEach((p) => {
      p.abhaNumberEncrypted = encryptPII(p.abhaNumber);
    });
    this.data.abhaAccount.forEach((a) => {
      a.abhaNumberEncrypted = encryptPII(a.abhaNumber);
      a.linkedMobileEncrypted = encryptPII(a.linkedMobile);
    });

    this.saveToDisk();
  }

  saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('❌ Failed writing local database state to disk:', e.message);
    }
  }

  _matchWhere(item, where) {
    if (!where) return true;
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;

      if (key === 'OR' && Array.isArray(value)) {
        const matchesOr = value.some((subWhere) => this._matchWhere(item, subWhere));
        if (!matchesOr) return false;
        continue;
      }

      if (key === 'AND' && Array.isArray(value)) {
        const matchesAnd = value.every((subWhere) => this._matchWhere(item, subWhere));
        if (!matchesAnd) return false;
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        if ('in' in value && Array.isArray(value.in)) {
          if (!value.in.includes(item[key])) return false;
        } else if ('contains' in value) {
          const itemVal = String(item[key] || '').toLowerCase();
          const searchVal = String(value.contains).toLowerCase();
          if (!itemVal.includes(searchVal)) return false;
        } else if ('equals' in value) {
          if (item[key] !== value.equals) return false;
        } else if ('mode' in value && value.mode === 'insensitive' && 'equals' in value) {
          if (String(item[key] || '').toLowerCase() !== String(value.equals || '').toLowerCase()) return false;
        }
      } else {
        const itemVal = item[key];
        if (typeof itemVal === 'string' && typeof value === 'string') {
          if (itemVal.trim().toLowerCase() !== value.trim().toLowerCase() && itemVal !== value) {
            return false;
          }
        } else if (itemVal !== value) {
          return false;
        }
      }
    }
    return true;
  }

  _model(name) {
    const table = this.data[name];
    if (!table) {
      this.data[name] = [];
    }
    const currentTable = this.data[name];

    return {
      findUnique: async ({ where, include }) => {
        const found = currentTable.find((item) => this._matchWhere(item, where));
        return found ? this._attachRelations(name, JSON.parse(JSON.stringify(found)), include) : null;
      },
      findFirst: async ({ where, include, orderBy } = {}) => {
        let results = currentTable.filter((item) => this._matchWhere(item, where));
        if (orderBy) {
          results = this._sortResults(results, orderBy);
        }
        const found = results[0];
        return found ? this._attachRelations(name, JSON.parse(JSON.stringify(found)), include) : null;
      },
      findMany: async ({ where, include, orderBy, take, skip } = {}) => {
        let results = currentTable.filter((item) => this._matchWhere(item, where));
        if (orderBy) {
          results = this._sortResults(results, orderBy);
        }
        if (typeof skip === 'number') {
          results = results.slice(skip);
        }
        if (typeof take === 'number') {
          results = results.slice(0, take);
        }
        return results.map((item) => this._attachRelations(name, JSON.parse(JSON.stringify(item)), include));
      },
      create: async ({ data, include }) => {
        const newItem = {
          id: data.id || `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        currentTable.push(newItem);
        this.saveToDisk();
        return this._attachRelations(name, JSON.parse(JSON.stringify(newItem)), include);
      },
      update: async ({ where, data, include }) => {
        const index = currentTable.findIndex((item) => this._matchWhere(item, where));
        if (index === -1) {
          throw new Error(`Record to update not found in ${name}`);
        }
        currentTable[index] = {
          ...currentTable[index],
          ...data,
          updatedAt: new Date(),
        };
        this.saveToDisk();
        return this._attachRelations(name, JSON.parse(JSON.stringify(currentTable[index])), include);
      },
      upsert: async ({ where, create, update, include }) => {
        const index = currentTable.findIndex((item) => this._matchWhere(item, where));
        if (index === -1) {
          const newItem = {
            id: create.id || `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
          currentTable.push(newItem);
          this.saveToDisk();
          return this._attachRelations(name, JSON.parse(JSON.stringify(newItem)), include);
        } else {
          currentTable[index] = {
            ...currentTable[index],
            ...update,
            updatedAt: new Date(),
          };
          this.saveToDisk();
          return this._attachRelations(name, JSON.parse(JSON.stringify(currentTable[index])), include);
        }
      },
      delete: async ({ where }) => {
        const index = currentTable.findIndex((item) => this._matchWhere(item, where));
        if (index === -1) {
          throw new Error(`Record to delete not found in ${name}`);
        }
        const [deleted] = currentTable.splice(index, 1);
        this.saveToDisk();
        return deleted;
      },
      deleteMany: async ({ where }) => {
        const initialCount = currentTable.length;
        this.data[name] = currentTable.filter((item) => !this._matchWhere(item, where));
        this.saveToDisk();
        return { count: initialCount - this.data[name].length };
      },
      count: async ({ where } = {}) => {
        if (!where) return currentTable.length;
        return currentTable.filter((item) => this._matchWhere(item, where)).length;
      },
    };
  }

  _sortResults(results, orderBy) {
    if (!orderBy) return results;
    const [field, direction] = Object.entries(orderBy)[0] || [];
    if (!field) return results;
    return [...results].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)))) {
        valA = new Date(valA).getTime();
      }
      if (valB instanceof Date || (typeof valB === 'string' && !isNaN(Date.parse(valB)))) {
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return direction === 'desc' ? 1 : -1;
      if (valA > valB) return direction === 'desc' ? -1 : 1;
      return 0;
    });
  }

  _attachRelations(modelName, item, include) {
    if (!include || !item) return item;

    if (modelName === 'user') {
      if (include.patientProfile) {
        item.patientProfile = this.data.patientProfile.find((p) => p.userId === item.id) || null;
      }
      if (include.doctorProfile) {
        item.doctorProfile = this.data.doctorProfile.find((d) => d.userId === item.id) || null;
      }
      if (include.hospitalAdminProfile) {
        item.hospitalAdminProfile = this.data.hospitalAdminProfile.find((h) => h.userId === item.id) || null;
      }
    } else if (modelName === 'patientProfile') {
      if (include.emergencyPass) {
        item.emergencyPass = this.data.emergencyPass.find((e) => e.patientProfileId === item.id) || null;
      }
      if (include.abhaAccount) {
        item.abhaAccount = this.data.abhaAccount.find((a) => a.patientProfileId === item.id) || null;
      }
      if (include.user) {
        item.user = this.data.user.find((u) => u.id === item.userId) || null;
      }
    } else if (modelName === 'doctorProfile') {
      if (include.user) {
        item.user = this.data.user.find((u) => u.id === item.userId) || null;
      }
    } else if (modelName === 'hospitalAdminProfile') {
      if (include.user) {
        item.user = this.data.user.find((u) => u.id === item.userId) || null;
      }
      if (include.hospital) {
        item.hospital = this.data.hospital.find((h) => h.id === item.hospitalId) || null;
      }
    } else if (modelName === 'appointment') {
      if (include.doctorProfile) {
        item.doctorProfile = this.data.doctorProfile.find((d) => d.id === item.doctorProfileId) || null;
      }
      if (include.patientProfile) {
        item.patientProfile = this.data.patientProfile.find((p) => p.id === item.patientProfileId) || null;
      }
      if (include.hospital) {
        item.hospital = this.data.hospital.find((h) => h.id === item.hospitalId) || null;
      }
    }

    return item;
  }
}

const inMemoryDb = new InMemoryRepository();

const db = new Proxy({}, {
  get(target, prop) {
    // Model query proxy (e.g. db.user, db.patientProfile, etc.)
    return inMemoryDb._model(prop);
  },
});

module.exports = db;
