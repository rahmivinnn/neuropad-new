import express from "express";

const router = express.Router();
const reminders: any[] = [];

router.post('/reminder-simulate/push', (req, res) => {
  const reminder = { ...req.body, id: `${Date.now()}`, createdAt: Date.now() };
  reminders.push(reminder);
  res.json(reminder);
});

router.get('/reminder-simulate/history', (_req, res) => {
  res.json(reminders.slice(-50));
});

export default router;