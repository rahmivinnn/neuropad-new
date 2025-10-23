import express from "express";

const router = express.Router();
const imuHistory: any[] = [];

router.post('/imu-simulate/push', (req, res) => {
  const sample = { ...req.body, recordedAt: Date.now() };
  imuHistory.push(sample);
  res.json(sample);
});

router.get('/imu-simulate/history', (_req, res) => {
  res.json(imuHistory.slice(-100));
});

export default router;