import express from "express";

const router = express.Router();

// Record footpad movement or pressure events (stub for local dev)
router.post('/footpad-track', (req, res) => {
  res.json({ success: true, received: req.body ?? {} });
});

export default router;