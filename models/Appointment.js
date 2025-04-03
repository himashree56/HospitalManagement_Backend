import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Appointment', appointmentSchema);