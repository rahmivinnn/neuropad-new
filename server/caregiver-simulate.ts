import express from "express";

const router = express.Router();
const caregivers: any[] = [];

router.post('/caregiver-simulate/push', (req, res) => {
  const cg = { ...req.body, id: `${Date.now()}`, createdAt: Date.now() };
  caregivers.push(cg);
  res.json(cg);
});

router.get('/caregiver-simulate/history', (_req, res) => {
  res.json(caregivers.slice(-50));
});

export default router;