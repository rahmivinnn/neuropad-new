import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertHealthMetricSchema,
  insertPreventionTipSchema,
  insertDailyGoalSchema,
  insertReminderSchema,
  insertCaregiverSchema,
  insertUrgentAlertSchema,
  insertHealthArticleSchema,
  insertIMUDataSchema,
} from "@shared/schema";
import { z } from "zod";
import { analyzeFootPressure } from "./openai";
import footpadTrackRouter from './footpad-track';
import sensorScanRouter from './sensor-scan';
import imuSimulateRouter from './imu-simulate';
import healthMetricSimulateRouter from './health-metric-simulate';
import dailyGoalSimulateRouter from './daily-goal-simulate';
import reminderSimulateRouter from './reminder-simulate';
import caregiverSimulateRouter from './caregiver-simulate';
import alertSimulateRouter from './alert-simulate';
import articleSimulateRouter from './article-simulate';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Mapbox key endpoint
  app.get('/api/mapbox-key', (req, res) => {
    res.json({ key: process.env.MAPBOX_PUBLIC_KEY || '' });
  });

  // Simple login endpoint (demo mode)
  app.post('/api/simple-login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
      }

      // Extract name from email
      const firstName = email.split('@')[0].split('.')[0];
      const lastName = email.split('@')[0].split('.')[1] || '';
      const userId = `demo_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Upsert user to database
      await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
        profileImageUrl: null,
      });

      // Create session manually
      req.session.userId = userId;
      req.session.email = email;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, userId, email });
    } catch (error) {
      console.error("Error in simple login:", error);
      res.status(500).json({ message: "Login gagal" });
    }
  });

  // Simple auth middleware
  const simpleAuth = async (req: any, res: any, next: any) => {
    if (req.session?.userId) {
      // Create a user object compatible with isAuthenticated
      req.user = {
        claims: {
          sub: req.session.userId,
          email: req.session.email,
        }
      };
      return next();
    }
    return isAuthenticated(req, res, next);
  };

  // Auth routes
  app.get('/api/auth/user', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Health metrics routes
  app.get('/api/health-metrics', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getLatestHealthMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  app.post('/api/health-metrics', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertHealthMetricSchema.parse({ ...req.body, userId });
      const metrics = await storage.createHealthMetrics(data);
      res.json(metrics);
    } catch (error) {
      console.error("Error creating health metrics:", error);
      res.status(500).json({ message: "Failed to create health metrics" });
    }
  });

  // Prevention tips routes
  app.get('/api/prevention-tips', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tips = await storage.getPreventionTips(userId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching prevention tips:", error);
      res.status(500).json({ message: "Failed to fetch prevention tips" });
    }
  });

  app.put('/api/prevention-tips', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPreventionTipSchema.parse({ ...req.body, userId });
      const tips = await storage.upsertPreventionTips(data);
      res.json(tips);
    } catch (error) {
      console.error("Error updating prevention tips:", error);
      res.status(500).json({ message: "Failed to update prevention tips" });
    }
  });

  // Daily goals routes
  app.get('/api/daily-goals', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getTodayGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching daily goals:", error);
      res.status(500).json({ message: "Failed to fetch daily goals" });
    }
  });

  app.put('/api/daily-goals', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertDailyGoalSchema.parse({ ...req.body, userId });
      const goals = await storage.upsertDailyGoals(data);
      res.json(goals);
    } catch (error) {
      console.error("Error updating daily goals:", error);
      res.status(500).json({ message: "Failed to update daily goals" });
    }
  });

  // Reminders routes
  app.get('/api/reminders', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post('/api/reminders', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReminderSchema.parse({ ...req.body, userId });
      const reminder = await storage.createReminder(data);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.delete('/api/reminders/:id', simpleAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReminder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Caregivers routes
  app.get('/api/caregivers', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caregivers = await storage.getCaregivers(userId);
      res.json(caregivers);
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      res.status(500).json({ message: "Failed to fetch caregivers" });
    }
  });

  app.post('/api/caregivers', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertCaregiverSchema.parse({ ...req.body, userId });
      const caregiver = await storage.createCaregiver(data);
      res.json(caregiver);
    } catch (error) {
      console.error("Error creating caregiver:", error);
      res.status(500).json({ message: "Failed to create caregiver" });
    }
  });

  app.patch('/api/caregivers/:id/emergency', simpleAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { emergencyNotifications } = z.object({ emergencyNotifications: z.boolean() }).parse(req.body);
      await storage.updateCaregiverEmergency(id, emergencyNotifications);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating caregiver emergency:", error);
      res.status(500).json({ message: "Failed to update caregiver emergency" });
    }
  });

  // Urgent alerts routes
  app.get('/api/urgent-alerts', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUrgentAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching urgent alerts:", error);
      res.status(500).json({ message: "Failed to fetch urgent alerts" });
    }
  });

  app.post('/api/urgent-alerts', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertUrgentAlertSchema.parse({ ...req.body, userId });
      const alert = await storage.createUrgentAlert(data);
      res.json(alert);
    } catch (error) {
      console.error("Error creating urgent alert:", error);
      res.status(500).json({ message: "Failed to create urgent alert" });
    }
  });

  app.patch('/api/urgent-alerts/:id/read', simpleAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Health articles routes
  app.get('/api/health-articles', async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const articles = await storage.getHealthArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching health articles:", error);
      res.status(500).json({ message: "Failed to fetch health articles" });
    }
  });

  app.post('/api/health-articles', async (req: any, res) => {
    try {
      const data = insertHealthArticleSchema.parse(req.body);
      const article = await storage.createHealthArticle(data);
      res.json(article);
    } catch (error) {
      console.error("Error creating health article:", error);
      res.status(500).json({ message: "Failed to create health article" });
    }
  });

  // Footpad pressure routes
  app.get('/api/footpad-pressure', simpleAuth, async (req: any, res) => {
    try {
      // Get userId from session (simpleAuth stores it in session)
      const userId = req.session?.userId || req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const pressureData = await storage.getFootpadPressure(userId, limit);
      res.json(pressureData);
    } catch (error) {
      console.error("Error fetching footpad pressure:", error);
      res.status(500).json({ message: "Failed to fetch footpad pressure data" });
    }
  });

  app.post('/api/footpad-pressure', simpleAuth, async (req: any, res) => {
    try {
      // Get userId from session (simpleAuth stores it in session)
      const userId = req.session?.userId || req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const data = { ...req.body, userId };
      const pressure = await storage.createFootpadPressure(data);
      res.json(pressure);
    } catch (error) {
      console.error("Error creating footpad pressure:", error);
      res.status(500).json({ message: "Failed to create footpad pressure data" });
    }
  });

  // AI foot analysis endpoint with auto-save
  app.post('/api/analyze-foot', simpleAuth, async (req: any, res) => {
    try {
      const { image, foot } = req.body;
      // Get userId from session (simpleAuth stores it in session)
      const userId = req.session?.userId || req.user?.claims?.sub || req.user?.id;
      
      if (!image || !foot) {
        return res.status(400).json({ message: "Image and foot type required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      // Pass the complete data URL to AI
      const analysis = await analyzeFootPressure(image, foot);
      
      // Auto-save AI results to database if foot detected
      if (analysis.footDetected && analysis.pressurePoints && analysis.pressurePoints.length > 0) {
        const pressures = analysis.pressurePoints.map((p: any) => p.pressure);
        const avgPressure = pressures.reduce((sum: number, p: number) => sum + p, 0) / pressures.length;
        const maxPressure = Math.max(...pressures);

        try {
          await storage.createFootpadPressure({
            userId,
            foot,
            pressurePoints: analysis.pressurePoints,
            averagePressure: avgPressure.toString(),
            maxPressure: maxPressure.toString(),
            notes: `AI Analysis (${analysis.confidence}% confidence): ${analysis.analysis}`
          });
          console.log(`AI auto-saved footpad data for user ${userId}`);
        } catch (saveError) {
          console.error("Failed to auto-save AI analysis:", saveError);
          // Still return analysis even if save fails
        }
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing foot:", error);
      res.status(500).json({ message: "Failed to analyze foot image" });
    }
  });

  // IMU data routes
  app.get('/api/imu-data', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const imuData = await storage.getIMUData(userId, limit);
      res.json(imuData);
    } catch (error) {
      console.error("Error fetching IMU data:", error);
      res.status(500).json({ message: "Failed to fetch IMU data" });
    }
  });

  app.post('/api/imu-data', simpleAuth, async (req: any, res) => {
    try {
      const userId = req.session?.userId || req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const { accelerometer, gyroscope, magnetometer } = req.body;
      
      // Build data object for validation
      const data = {
        userId,
        accelerometerX: accelerometer?.x,
        accelerometerY: accelerometer?.y,
        accelerometerZ: accelerometer?.z,
        gyroscopeX: gyroscope?.x,
        gyroscopeY: gyroscope?.y,
        gyroscopeZ: gyroscope?.z,
        magnetometerX: magnetometer?.x,
        magnetometerY: magnetometer?.y,
        magnetometerZ: magnetometer?.z,
      };

      // Validate with schema first - this will catch missing/invalid fields
      const validatedData = insertIMUDataSchema.parse(data);
      
      // Transform to strings after validation
      const transformedData = {
        ...validatedData,
        accelerometerX: validatedData.accelerometerX?.toString(),
        accelerometerY: validatedData.accelerometerY?.toString(),
        accelerometerZ: validatedData.accelerometerZ?.toString(),
        gyroscopeX: validatedData.gyroscopeX?.toString(),
        gyroscopeY: validatedData.gyroscopeY?.toString(),
        gyroscopeZ: validatedData.gyroscopeZ?.toString(),
        magnetometerX: validatedData.magnetometerX?.toString(),
        magnetometerY: validatedData.magnetometerY?.toString(),
        magnetometerZ: validatedData.magnetometerZ?.toString(),
      };

      const imuRecord = await storage.createIMUData(transformedData);
      res.json(imuRecord);
    } catch (error: any) {
      console.error("Error creating IMU data:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid IMU data format", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create IMU data" });
    }
  });

  app.use('/api', footpadTrackRouter);
  app.use('/api', sensorScanRouter);
  app.use('/api', imuSimulateRouter);
  app.use('/api', healthMetricSimulateRouter);
  app.use('/api', dailyGoalSimulateRouter);
  app.use('/api', reminderSimulateRouter);
  app.use('/api', caregiverSimulateRouter);
  app.use('/api', alertSimulateRouter);
  app.use('/api', articleSimulateRouter);

  const httpServer = createServer(app);
  return httpServer;
}
