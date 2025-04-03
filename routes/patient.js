import express from "express";
import auth from "../middleware/auth.js";
import Appointment from "../models/Appointment.js";
import TimeSlot from "../models/TimeSlot.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";

const router = express.Router();
router.get("/doctors", auth, async (req, res) => {
  if (req.user.role !== "patient")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const doctors = await User.find({
      role: "doctor",
      isApproved: true,
    }).select("name email");
    if (!doctors.length) {
      console.log("No approved doctors found in User collection");
      return res.status(404).json({ msg: "No approved doctors found" });
    }

    const doctorDetails = await Doctor.find({
      userId: { $in: doctors.map((d) => d._id) },
    });
    if (!doctorDetails.length) {
      console.log("No doctor profiles found in Doctor collection");
      return res.status(404).json({ msg: "No doctor profiles found" });
    }

    const availableTimeSlots = await TimeSlot.find({ isBooked: false });
    if (!availableTimeSlots.length) {
      console.log("No available time slots found");
      return res
        .status(404)
        .json({ msg: "No doctors with available time slots" });
    }

    const doctorsWithSlots = doctorDetails.filter((d) =>
      availableTimeSlots.some(
        (t) => t.doctorId.toString() === d.userId.toString()
      )
    );
    if (!doctorsWithSlots.length) {
      console.log("No doctors with available time slots");
      return res
        .status(404)
        .json({ msg: "No doctors with available time slots" });
    }

    const result = doctorsWithSlots.map((d) => ({
      ...d._doc,
      name:
        doctors.find((u) => u._id.toString() === d.userId.toString())?.name ||
        "Unknown",
      email:
        doctors.find((u) => u._id.toString() === d.userId.toString())?.email ||
        "Unknown",
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/appointments", auth, async (req, res) => {
  if (req.user.role !== "patient")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate("doctorId", "name")
      .populate("timeSlotId");
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.post("/book", auth, async (req, res) => {
  if (req.user.role !== "patient")
    return res.status(403).json({ msg: "Access denied" });
  const { timeSlotId } = req.body;

  try {
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) return res.status(404).json({ msg: "Time slot not found" });
    if (timeSlot.isBooked)
      return res.status(400).json({ msg: "Time slot already booked" });

    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId: timeSlot.doctorId,
      timeSlotId,
    });
    timeSlot.isBooked = true;
    await timeSlot.save();
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.put("/cancel/:id", auth, async (req, res) => {
  if (req.user.role !== "patient")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.patientId.toString() !== req.user.id) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    if (appointment.status === "cancelled") {
      return res.status(400).json({ msg: "Appointment already cancelled" });
    }

    appointment.status = "cancelled";
    const timeSlot = await TimeSlot.findById(appointment.timeSlotId);
    timeSlot.isBooked = false;
    await timeSlot.save();
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error("Error cancelling appointment:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/timeslots/:doctorId", auth, async (req, res) => {
  if (req.user.role !== "patient") {
    console.log("Access denied: User is not a patient");
    return res.status(403).json({ msg: "Access denied" });
  }
  const { doctorId } = req.params;

  try {
    console.log(`Fetching time slots for doctor ID: ${doctorId}`);
    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
      isApproved: true,
    });
    if (!doctor) {
      console.log(`Doctor not found or not approved for ID: ${doctorId}`);
      return res.status(404).json({ msg: "Doctor not found or not approved" });
    }

    const timeSlots = await TimeSlot.find({ doctorId, isBooked: false });
    console.log(
      `Found ${timeSlots.length} available time slots for doctor ID: ${doctorId}`
    );
    res.json(timeSlots); 
  } catch (err) {
    console.error("Error fetching patient time slots:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
