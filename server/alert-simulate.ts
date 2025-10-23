import express from "express";

const router = express.Router();
const alerts: any[] = [];

router.post('/alert-simulate/push', (req, res) => {
  const alert = { ...req.body, id: `${Date.now()}`, createdAt: Date.now() };
  alerts.push(alert);
  res.json(alert);
});

router.get('/alert-simulate/history', (_req, res) => {
  res.json(alerts.slice(-50));
});

export default router;