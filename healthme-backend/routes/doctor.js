const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.get('/patients', [authMiddleware, checkRole('doctor')], doctorController.getAllPatients);
router.get('/patients/:patientId/symptoms', [authMiddleware, checkRole('doctor')], doctorController.getPatientSymptomHistory);
router.get('/appointments', [authMiddleware, checkRole('doctor')], doctorController.getDoctorAppointments);
router.put('/appointments/:appointmentId/cancel', [authMiddleware, checkRole('doctor')], doctorController.cancelAppointment);
router.get('/messages', [authMiddleware, checkRole('doctor')], doctorController.getDoctorMessages);
router.post('/messages', [authMiddleware, checkRole('doctor')], doctorController.replyToMessage);

module.exports = router;