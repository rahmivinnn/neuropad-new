import express from "express";
import { storage } from "./storage";
import { insertHealthMetricSchema } from "@shared/schema";

const router = express.Router();

// Stateful realistic simulation values
let currentBpm = 72;
let currentFootPressure = 85; // mmHg (demo)
let bluetoothConnected = true;
let batteryLevel = 85;
let anomaliesDetected = 0;
let lastUpdate = Date.now();

// More realistic BPM simulation with trends
function nextBpm(): number {
  const now = Date.now();
  // Update every 8-12 seconds for more stable readings
  if (now - lastUpdate > 8000 + Math.random() * 4000) {
    const trend = Math.sin(now / 120000) * 2; // Slower, more subtle trend
    const drift = Math.round((Math.random() - 0.5) * 2); // Reduced to +/- 1 bpm drift
    currentBpm = Math.min(110, Math.max(55, currentBpm + drift + trend));
    lastUpdate = now;
  }
  return Math.round(currentBpm);
}

// More realistic pressure simulation
function nextPressure(): number {
  const now = Date.now();
  // Update even less frequently for stable readings
  if (now - lastUpdate > 10000 + Math.random() * 5000) {
    const trend = Math.cos(now / 90000) * 1; // Much slower, subtle trend
    const drift = Math.round((Math.random() - 0.5) * 4); // Reduced to +/- 2 mmHg drift
    currentFootPressure = Math.min(100, Math.max(20, currentFootPressure + drift + trend));
    lastUpdate = now;
  }
  return Math.round(currentFootPressure * 10) / 10; // Keep one decimal place
}

// Simulate occasional connection drops
function checkBluetoothStatus() {
  // Reduced to 1% chance of connection drop for more stability
  if (Math.random() < 0.01) {
    bluetoothConnected = !bluetoothConnected;
    // If disconnected, battery drain stops
    if (!bluetoothConnected) {
      batteryLevel = Math.max(0, batteryLevel - Math.floor(Math.random() * 3));
    }
  }
  // If connected, very slowly drain battery
  else if (bluetoothConnected && Math.random() < 0.1) {
    batteryLevel = Math.max(0, batteryLevel - 1);
  }
  // Occasionally recharge if low
  else if (batteryLevel < 20 && Math.random() < 0.05) {
    batteryLevel = Math.min(100, batteryLevel + Math.floor(Math.random() * 5) + 3);
  }
}

// Simulate anomaly detection
function checkForAnomalies(bpm: number) {
  // Increase anomalies if BPM is outside normal range
  if (bpm > 100 || bpm < 60) {
    if (Math.random() < 0.1) { // Reduced to 10% chance for more stability
      anomaliesDetected = Math.min(10, anomaliesDetected + 1);
    }
  }
  // Occasionally reset anomalies
  else if (Math.random() < 0.02) {
    anomaliesDetected = Math.max(0, anomaliesDetected - 1);
  }
}

// GET next simulated metric without persistence
router.get("/health-metric-simulate/next", (_req, res) => {
  checkBluetoothStatus();
  const bpm = nextBpm();
  const footPressure = nextPressure();
  checkForAnomalies(bpm);
  
  res.json({
    bpm,
    footPressure,
    bluetoothConnected,
    batteryLevel,
    anomaliesDetected,
    timestamp: Date.now(),
  });
});

// POST and attempt to persist to health_metrics when a session exists
router.post("/health-metric-simulate/push", async (req: any, res) => {
  try {
    checkBluetoothStatus();
    const bpm = nextBpm();
    const footPressure = nextPressure();
    checkForAnomalies(bpm);

    const userId = req.session?.userId as string | undefined;
    const payload = {
      userId,
      heartRate: bpm,
      footPressure: String(footPressure),
      bluetoothConnected,
      batteryLevel,
      anomaliesDetected,
    } as any;

    if (userId) {
      const data = insertHealthMetricSchema.parse(payload);
      const saved = await storage.createHealthMetrics(data);
      return res.json({ saved: true, metrics: saved });
    }
    return res.json({ saved: false, record: { ...payload, timestamp: Date.now() } });
  } catch (error) {
    console.error("Error in health-metric-simulate/push:", error);
    res.status(500).json({ message: "Failed to simulate health metrics" });
  }
});

export default router;