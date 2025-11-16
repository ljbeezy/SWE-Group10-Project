const User = require('../models/User');
const Symptom = require('../models/Symptom');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.getPatientSymptomHistory = async (req, res) => {
    try {
        const history = await Symptom.find({ patient: req.params.patientId }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'email role')
      .sort({ date: 'asc' });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getDoctorMessages = async (req, res) => {
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

exports.replyToMessage = async (req, res) => {
  const { patientId, content } = req.body;

  if (!patientId || !content) {
    return res.status(400).json({ message: 'Patient ID and message content are required.' });
  }

  try {
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Recipient is not a valid patient.' });
    }

    const newMessage = new Message({
      from: req.user.id,
      to: patientId,
      content
    });

    await newMessage.save();
    res.status(201).json({ message: 'Reply sent successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllDoctors = async (req, res) => {
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

    if (appointment.doctor.toString() !== req.user.id) {
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