import express from "express";
import auth from "../middleware/auth.js";
import Doctor from "../models/Doctor.js";
import TimeSlot from "../models/TimeSlot.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();
router.post("/profile", auth, async (req, res) => {
  if (req.user.role !== "doctor")
    return res.status(403).json({ msg: "Access denied" });
  const { specialization, bio } = req.body;

  try {
    let doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      doctor = new Doctor({ userId: req.user.id, specialization, bio });
    } else {
      doctor.specialization = specialization;
      doctor.bio = bio;
    }
    await doctor.save();
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.post("/timeslots", auth, async (req, res) => {
  if (req.user.role !== "doctor")
    return res.status(403).json({ msg: "Access denied" });
  const { date, startTime, endTime } = req.body;

  try {
    const timeSlot = new TimeSlot({
      doctorId: req.user.id,
      date,
      startTime,
      endTime,
    });
    await timeSlot.save();
    res.json(timeSlot);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/appointments", auth, async (req, res) => {
  if (req.user.role !== "doctor")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate("patientId", "name")
      .populate("timeSlotId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/timeslots", auth, async (req, res) => {
  const { doctorId } = req.query; 
  if (!doctorId) return res.status(400).json({ msg: "Doctor ID is required" });

  try {
    const timeSlots = await TimeSlot.find({ doctorId, isBooked: false });
    if (!timeSlots.length) {
      return res
        .status(404)
        .json({ msg: "No available time slots for this doctor" });
    }
    res.json(timeSlots);
  } catch (err) {
    console.error("Error fetching time slots:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
