import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ name, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    if (role === "doctor") user.isApproved = false;
    else if (role === "admin") user.isApproved = true;
    else user.isApproved = true;
    await user.save();
    if (role === "doctor") {
      const doctor = new Doctor({
        userId: user._id,
        specialization: "General Practitioner", 
        bio: "New doctor, profile not yet updated",
      });
      await doctor.save();
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    if (!user.isApproved && user.role === "doctor")
      return res.status(403).json({ msg: "Doctor not approved yet" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

export default router;
