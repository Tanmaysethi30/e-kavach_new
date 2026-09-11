const patientService = require('../services/patient.service');

class PatientController {
  async getMe(req, res, next) {
    try {
      const profile = await patientService.getProfile(req.user.id);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const updated = await patientService.updateProfile(req.user.id, req.body);
      res.json({ success: true, message: 'Patient profile updated successfully', profile: updated });
    } catch (err) {
      next(err);
    }
  }

  async getAbha(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const abha = await patientService.getAbhaDetails(patientId);
      res.json({ success: true, abha });
    } catch (err) {
      next(err);
    }
  }

  async generateAbha(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const result = await patientService.generateAbha(patientId, req.body);
      res.json({ success: true, message: 'ABHA generated successfully', abha: result });
    } catch (err) {
      next(err);
    }
  }

  async getEmergencyPass(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const pass = await patientService.getEmergencyPass(patientId);
      res.json({ success: true, emergencyPass: pass });
    } catch (err) {
      next(err);
    }
  }

  async getHealthHistory(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const history = await patientService.getHealthHistory(patientId);
      res.json({ success: true, history });
    } catch (err) {
      next(err);
    }
  }

  async uploadRecord(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const record = await patientService.uploadRecord(patientId, req.user.id, {
        ...req.body,
        file: req.file,
      });
      res.status(201).json({ success: true, message: 'Record uploaded successfully', record });
    } catch (err) {
      next(err);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const record = await patientService.deleteRecord(patientId, req.params.id);
      res.json({ success: true, message: 'Record deleted successfully', record });
    } catch (err) {
      next(err);
    }
  }

  async getDoctors(req, res, next) {
    try {
      const doctors = await patientService.getDoctors();
      res.json({ success: true, doctors });
    } catch (err) {
      next(err);
    }
  }

  async getAppointments(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const appointments = await patientService.getAppointments(patientId);
      res.json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  }

  async createAppointment(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const appointment = await patientService.createAppointment(patientId, req.body);
      res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment });
    } catch (err) {
      next(err);
    }
  }

  async quickIdAndBook(req, res, next) {
    try {
      const result = await patientService.quickIdAndBook(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await patientService.cancelAppointment(id);
      res.json({ success: true, message: 'Appointment cancelled successfully', appointment: updated });
    } catch (err) {
      next(err);
    }
  }

  async getSchemes(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const schemes = await patientService.getSchemes(patientId);
      res.json({ success: true, ...schemes });
    } catch (err) {
      next(err);
    }
  }

  async updateConsent(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const consent = await patientService.updateConsent(patientId, req.body);
      res.json({ success: true, message: 'Consent settings updated successfully', consent });
    } catch (err) {
      next(err);
    }
  }

  async getConsentRequests(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const requests = await patientService.getConsentRequests(patientId);
      res.json({ success: true, requests });
    } catch (err) {
      next(err);
    }
  }

  async respondConsent(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const updated = await patientService.respondConsent(patientId, req.body);
      res.json({ success: true, message: `Consent request ${req.body.action === 'APPROVE' ? 'approved' : 'declined'} successfully`, consent: updated });
    } catch (err) {
      next(err);
    }
  }

  async getAccessLogs(req, res, next) {
    try {
      const patientId = req.user.patientProfile ? req.user.patientProfile.id : 'patient-rajesh';
      const logs = await patientService.getAccessLogs(patientId);
      res.json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }

  async createAccessLog(req, res, next) {
    try {
      const log = await patientService.createAccessLog(req.body);
      res.status(201).json({ success: true, log });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PatientController();
