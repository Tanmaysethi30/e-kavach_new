const doctorService = require('../services/doctor.service');

class DoctorController {
  async getMe(req, res, next) {
    try {
      const profile = await doctorService.getProfile(req.user.id);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  async getTriageQueue(req, res, next) {
    try {
      const queue = await doctorService.getTriageQueue();
      res.json({ success: true, queue });
    } catch (err) {
      next(err);
    }
  }

  async scanPatient(req, res, next) {
    try {
      const result = await doctorService.scanPatient(req.body, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addPatient(req, res, next) {
    try {
      const result = await doctorService.addPatient(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Patient registered and admitted to emergency queue',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getNetwork(req, res, next) {
    try {
      const network = await doctorService.getNetworkNodes();
      res.json({ success: true, network });
    } catch (err) {
      next(err);
    }
  }

  async getCredentials(req, res, next) {
    try {
      const doctorId = req.user.doctorProfile ? req.user.doctorProfile.id : 'doctor-kavitha';
      const credentials = await doctorService.getCredentials(doctorId);
      res.json({ success: true, credentials });
    } catch (err) {
      next(err);
    }
  }

  async getAppointments(req, res, next) {
    try {
      const doctorId = req.user.doctorProfile ? req.user.doctorProfile.id : 'doctor-kavitha';
      const appointments = await doctorService.getAppointments(doctorId);
      res.json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await doctorService.updateAppointmentStatus(id, status);
      res.json({ success: true, message: `Appointment status updated to ${status}`, appointment });
    } catch (err) {
      next(err);
    }
  }

  async requestPatientAccess(req, res, next) {
    try {
      const { patientId } = req.body;
      const result = await doctorService.requestPatientAccess({ patientId, doctorUser: req.user });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async checkAccessStatus(req, res, next) {
    try {
      const { patientId } = req.params;
      const result = await doctorService.checkAccessStatus(patientId, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async issuePrescription(req, res, next) {
    try {
      const record = await doctorService.issuePrescription(req.body, req.user);
      res.status(201).json({ success: true, message: 'Prescription issued successfully', record });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorController();
