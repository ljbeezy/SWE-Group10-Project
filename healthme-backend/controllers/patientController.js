const Symptom = require('../models/Symptom');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');
const User = require('../models/User');

exports.logSymptom = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ message: 'Symptoms are required and must be an array of strings.' });
    }

    const newSymptomLog = new Symptom({
      symptoms,
      patient: req.user.id
    });

    await newSymptomLog.save();

    res.status(201).json({ message: 'Symptoms logged successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSymptomHistory = async (req, res) => {
  try {
    const history = await Symptom.find({ patient: req.user.id }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.scheduleAppointment = async (req, res) => {
  const { doctorId, date, reason } = req.body;
  if (!doctorId || !date || !reason) {
    return res.status(400).json({ message: 'Doctor, date, and reason are required.' });
  }

  try {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const newAppointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      date,
      reason
    });
    await newAppointment.save();
    res.status(201).json({ message: 'Appointment scheduled successfully.', appointment: newAppointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'email role')
      .sort({ date: 'asc' });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.sendMessage = async (req, res) => {
  const { doctorId, content } = req.body;

  if (!doctorId || !content) {
    return res.status(400).json({ message: 'Doctor ID and message content are required.' });
  }

  try {
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Recipient is not a valid doctor.' });
    }

    const newMessage = new Message({
      from: req.user.id,
      to: doctorId,
      content
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPatientMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user.id }, { to: req.user.id }]
    })
    .populate('from', 'email role')
    .populate('to', 'email role')
    .sort({ createdAt: 'asc' });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment.' });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled.' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};