import {
  users,
  healthMetrics,
  preventionTips,
  dailyGoals,
  reminders,
  caregivers,
  urgentAlerts,
  healthArticles,
  footpadPressure,
  imuData,
  type User,
  type UpsertUser,
  type HealthMetric,
  type InsertHealthMetric,
  type PreventionTip,
  type InsertPreventionTip,
  type DailyGoal,
  type InsertDailyGoal,
  type Reminder,
  type InsertReminder,
  type Caregiver,
  type InsertCaregiver,
  type UrgentAlert,
  type InsertUrgentAlert,
  type HealthArticle,
  type InsertHealthArticle,
  type FootpadPressure,
  type InsertFootpadPressure,
  type IMUData,
  type InsertIMUData,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Health metrics
  getLatestHealthMetrics(userId: string): Promise<HealthMetric | undefined>;
  createHealthMetrics(data: InsertHealthMetric): Promise<HealthMetric>;

  // Prevention tips
  getPreventionTips(userId: string): Promise<PreventionTip | undefined>;
  upsertPreventionTips(data: InsertPreventionTip): Promise<PreventionTip>;

  // Daily goals
  getTodayGoals(userId: string): Promise<DailyGoal | undefined>;
  upsertDailyGoals(data: InsertDailyGoal): Promise<DailyGoal>;

  // Reminders
  getReminders(userId: string): Promise<Reminder[]>;
  createReminder(data: InsertReminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;

  // Caregivers
  getCaregivers(userId: string): Promise<Caregiver[]>;
  createCaregiver(data: InsertCaregiver): Promise<Caregiver>;
  updateCaregiverEmergency(id: string, emergencyNotifications: boolean): Promise<void>;

  // Urgent alerts
  getUrgentAlerts(userId: string): Promise<UrgentAlert[]>;
  createUrgentAlert(data: InsertUrgentAlert): Promise<UrgentAlert>;
  markAlertAsRead(id: string): Promise<void>;

  // Health articles
  getHealthArticles(limit?: number): Promise<HealthArticle[]>;
  createHealthArticle(data: InsertHealthArticle): Promise<HealthArticle>;

  // Footpad pressure
  getFootpadPressure(userId: string, limit?: number): Promise<FootpadPressure[]>;
  createFootpadPressure(data: InsertFootpadPressure): Promise<FootpadPressure>;

  // IMU data
  getIMUData(userId: string, limit?: number): Promise<IMUData[]>;
  createIMUData(data: InsertIMUData): Promise<IMUData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Health metrics
  async getLatestHealthMetrics(userId: string): Promise<HealthMetric | undefined> {
    const [metric] = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(1);
    return metric;
  }

  async createHealthMetrics(data: InsertHealthMetric): Promise<HealthMetric> {
    const [metric] = await db
      .insert(healthMetrics)
      .values(data)
      .returning();
    return metric;
  }

  // Prevention tips
  async getPreventionTips(userId: string): Promise<PreventionTip | undefined> {
    const [tips] = await db
      .select()
      .from(preventionTips)
      .where(eq(preventionTips.userId, userId));
    return tips;
  }

  async upsertPreventionTips(data: InsertPreventionTip): Promise<PreventionTip> {
    const [tips] = await db
      .insert(preventionTips)
      .values(data)
      .onConflictDoUpdate({
        target: preventionTips.userId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return tips;
  }

  // Daily goals
  async getTodayGoals(userId: string): Promise<DailyGoal | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [goals] = await db
      .select()
      .from(dailyGoals)
      .where(
        and(
          eq(dailyGoals.userId, userId),
          eq(dailyGoals.date, today)
        )
      );
    return goals;
  }

  async upsertDailyGoals(data: InsertDailyGoal): Promise<DailyGoal> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [goals] = await db
      .insert(dailyGoals)
      .values({ ...data, date: today })
      .onConflictDoUpdate({
        target: [dailyGoals.userId, dailyGoals.date],
        set: data,
      })
      .returning();
    return goals;
  }

  // Reminders
  async getReminders(userId: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.isActive, true)))
      .orderBy(reminders.scheduledTime);
  }

  async createReminder(data: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(data)
      .returning();
    return reminder;
  }

  async deleteReminder(id: string): Promise<void> {
    await db
      .update(reminders)
      .set({ isActive: false })
      .where(eq(reminders.id, id));
  }

  // Caregivers
  async getCaregivers(userId: string): Promise<Caregiver[]> {
    return await db
      .select()
      .from(caregivers)
      .where(eq(caregivers.userId, userId))
      .orderBy(caregivers.createdAt);
  }

  async createCaregiver(data: InsertCaregiver): Promise<Caregiver> {
    const [caregiver] = await db
      .insert(caregivers)
      .values(data)
      .returning();
    return caregiver;
  }

  async updateCaregiverEmergency(id: string, emergencyNotifications: boolean): Promise<void> {
    await db
      .update(caregivers)
      .set({ emergencyNotifications })
      .where(eq(caregivers.id, id));
  }

  // Urgent alerts
  async getUrgentAlerts(userId: string): Promise<UrgentAlert[]> {
    return await db
      .select()
      .from(urgentAlerts)
      .where(eq(urgentAlerts.userId, userId))
      .orderBy(desc(urgentAlerts.createdAt));
  }

  async createUrgentAlert(data: InsertUrgentAlert): Promise<UrgentAlert> {
    const [alert] = await db
      .insert(urgentAlerts)
      .values(data)
      .returning();
    return alert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db
      .update(urgentAlerts)
      .set({ isRead: true })
      .where(eq(urgentAlerts.id, id));
  }

  // Health articles
  async getHealthArticles(limit: number = 10): Promise<HealthArticle[]> {
    return await db
      .select()
      .from(healthArticles)
      .orderBy(desc(healthArticles.publishedAt))
      .limit(limit);
  }

  async createHealthArticle(data: InsertHealthArticle): Promise<HealthArticle> {
    const [article] = await db
      .insert(healthArticles)
      .values(data)
      .returning();
    return article;
  }

  // Footpad pressure
  async getFootpadPressure(userId: string, limit: number = 10): Promise<FootpadPressure[]> {
    return await db
      .select()
      .from(footpadPressure)
      .where(eq(footpadPressure.userId, userId))
      .orderBy(desc(footpadPressure.recordedAt))
      .limit(limit);
  }

  async createFootpadPressure(data: InsertFootpadPressure): Promise<FootpadPressure> {
    const [pressure] = await db
      .insert(footpadPressure)
      .values(data)
      .returning();
    return pressure;
  }

  // IMU data
  async getIMUData(userId: string, limit: number = 10): Promise<IMUData[]> {
    return await db
      .select()
      .from(imuData)
      .where(eq(imuData.userId, userId))
      .orderBy(desc(imuData.recordedAt))
      .limit(limit);
  }

  async createIMUData(data: InsertIMUData): Promise<IMUData> {
    const [imu] = await db
      .insert(imuData)
      .values(data)
      .returning();
    return imu;
  }
}

export const storage = new DatabaseStorage();
