import express from "express";

const router = express.Router();
const scans: any[] = [];

// Push a sensor scan sample (stub)
router.post('/sensor-scan', (req, res) => {
  const payload = { ...req.body, recordedAt: Date.now() };
  scans.push(payload);
  res.json(payload);
});

// Read recent sensor scan history (stub)
router.get('/sensor-scan', (_req, res) => {
  res.json(scans.slice(-50));
});

export default router;