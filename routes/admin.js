import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

const router = express.Router();
router.get("/doctors", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.put("/approve/:id", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== "doctor")
      return res.status(404).json({ msg: "Doctor not found" });
    doctor.isApproved = true;
    await doctor.save();
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/appointments", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .populate("timeSlotId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
router.get("/users", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied" });
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
