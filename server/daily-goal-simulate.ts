import express from "express";

const router = express.Router();
const goals: any[] = [];

router.post('/daily-goal-simulate/push', (req, res) => {
  const goal = { ...req.body, createdAt: Date.now() };
  goals.push(goal);
  res.json(goal);
});

router.get('/daily-goal-simulate/history', (_req, res) => {
  res.json(goals.slice(-50));
});

export default router;