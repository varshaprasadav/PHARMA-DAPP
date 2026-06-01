import express from "express";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import mongoose from "mongoose";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const medicineSchema = new mongoose.Schema({
  medicineId: { type: String, required: true, unique: true },
  name: String,
  batchNumber: String,
  manufacturingDate: String,
  expiryDate: String,
  manufacturerName: String,
  txHash: String,
  qrPath: String,
  createdAt: { type: Date, default: Date.now },
});

const Medicine = mongoose.model("Medicine", medicineSchema);

router.post("/medicine/save", async (req, res) => {
  try {
    const { medicineId, name, batchNumber, manufacturingDate, expiryDate, manufacturerName, txHash } = req.body;

    const qrDir = join(__dirname, "../../public/qr");
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrData = JSON.stringify({ medicineId, name, batchNumber });
    const qrPath = `/qr/${medicineId}.png`;
    const qrFullPath = join(qrDir, `${medicineId}.png`);
    await QRCode.toFile(qrFullPath, qrData, { width: 200 });

    await Medicine.findOneAndUpdate(
      { medicineId },
      { medicineId, name, batchNumber, manufacturingDate, expiryDate, manufacturerName, txHash, qrPath },
      { upsert: true, new: true }
    );

    res.json({ success: true, qrPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/medicine/:id", async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ medicineId: req.params.id });
    if (!medicine) return res.status(404).json({ error: "Not found in DB" });
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/medicines", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
