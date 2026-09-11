const aiService = require('../services/ai.service');

class AIController {
  async chat(req, res, next) {
    try {
      const patientProfileId = req.user?.patientProfile?.id || 'patient-rajesh';
      const { prompt, history } = req.body;

      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
      }

      const reply = await aiService.chatWithClinicalAI({
        patientProfileId,
        prompt,
        history: history || [],
      });

      res.json({
        success: true,
        reply,
      });
    } catch (err) {
      next(err);
    }
  }

  async analyzeDocument(req, res, next) {
    try {
      const patientProfileId = req.user?.patientProfile?.id || 'patient-rajesh';
      const { recordId, title, recordType, notes, fileUrl } = req.body;

      const analysis = await aiService.analyzePrescriptionOrDocument({
        patientProfileId,
        recordId,
        title,
        recordType,
        notes,
        fileUrl,
      });

      res.json({
        success: true,
        analysis,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AIController();
