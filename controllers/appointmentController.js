import Appointment from "../models/Appointment.js";

export const bookAppointment = async (req, res) => {
  try {
    const { userId, doctorId, date, time } = req.body;
    const newAppointment = new Appointment({ userId, doctorId, date, time });

    await newAppointment.save();
    res.status(201).json({ message: "Appointment booked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error booking appointment", error });
  }
};
