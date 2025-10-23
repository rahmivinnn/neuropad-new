import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health metrics table
export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  heartRate: integer("heart_rate"),
  footPressure: decimal("foot_pressure", { precision: 10, scale: 2 }),
  bluetoothConnected: boolean("bluetooth_connected").default(false),
  batteryLevel: integer("battery_level").default(0),
  anomaliesDetected: integer("anomalies_detected").default(0),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Prevention tips settings
export const preventionTips = pgTable("prevention_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hydrationEnabled: boolean("hydration_enabled").default(true),
  walkingGoalsEnabled: boolean("walking_goals_enabled").default(true),
  saltReductionEnabled: boolean("salt_reduction_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily goals tracking
export const dailyGoals = pgTable("daily_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow(),
  hydrationProgress: integer("hydration_progress").default(0),
  walkingProgress: integer("walking_progress").default(0),
  saltProgress: integer("salt_progress").default(0),
});

// Reminders
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledTime: text("scheduled_time").notNull(), // e.g., "8:00 AM"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Caregivers
export const caregivers = pgTable("caregivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  contactInfo: text("contact_info").notNull(),
  emergencyNotifications: boolean("emergency_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Urgent alerts
export const urgentAlerts = pgTable("urgent_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  alertType: text("alert_type").notNull(), // stroke_risk, emergency_call, etc.
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // low, medium, high, critical
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health articles
export const healthArticles = pgTable("health_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // neuropathy, diabetes, foot_care, exercise, nutrition
  imageUrl: text("image_url"),
  readTime: integer("read_time").default(5), // in minutes
  publishedAt: timestamp("published_at").defaultNow(),
});

// Footpad pressure tracking
export const footpadPressure = pgTable("footpad_pressure", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  foot: text("foot").notNull(), // 'left' or 'right'
  pressurePoints: jsonb("pressure_points").notNull(), // Array of {x, y, pressure} objects
  averagePressure: decimal("average_pressure", { precision: 10, scale: 2 }),
  maxPressure: decimal("max_pressure", { precision: 10, scale: 2 }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// IMU (Inertial Measurement Unit) sensor data
export const imuData = pgTable("imu_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accelerometerX: decimal("accelerometer_x", { precision: 10, scale: 2 }),
  accelerometerY: decimal("accelerometer_y", { precision: 10, scale: 2 }),
  accelerometerZ: decimal("accelerometer_z", { precision: 10, scale: 2 }),
  gyroscopeX: decimal("gyroscope_x", { precision: 10, scale: 2 }),
  gyroscopeY: decimal("gyroscope_y", { precision: 10, scale: 2 }),
  gyroscopeZ: decimal("gyroscope_z", { precision: 10, scale: 2 }),
  magnetometerX: decimal("magnetometer_x", { precision: 10, scale: 2 }),
  magnetometerY: decimal("magnetometer_y", { precision: 10, scale: 2 }),
  magnetometerZ: decimal("magnetometer_z", { precision: 10, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  healthMetrics: many(healthMetrics),
  preventionTips: many(preventionTips),
  dailyGoals: many(dailyGoals),
  reminders: many(reminders),
  caregivers: many(caregivers),
  urgentAlerts: many(urgentAlerts),
  footpadPressure: many(footpadPressure),
  imuData: many(imuData),
}));

export const healthMetricsRelations = relations(healthMetrics, ({ one }) => ({
  user: one(users, {
    fields: [healthMetrics.userId],
    references: [users.id],
  }),
}));

export const preventionTipsRelations = relations(preventionTips, ({ one }) => ({
  user: one(users, {
    fields: [preventionTips.userId],
    references: [users.id],
  }),
}));

export const dailyGoalsRelations = relations(dailyGoals, ({ one }) => ({
  user: one(users, {
    fields: [dailyGoals.userId],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export const caregiversRelations = relations(caregivers, ({ one }) => ({
  user: one(users, {
    fields: [caregivers.userId],
    references: [users.id],
  }),
}));

export const urgentAlertsRelations = relations(urgentAlerts, ({ one }) => ({
  user: one(users, {
    fields: [urgentAlerts.userId],
    references: [users.id],
  }),
}));

export const footpadPressureRelations = relations(footpadPressure, ({ one }) => ({
  user: one(users, {
    fields: [footpadPressure.userId],
    references: [users.id],
  }),
}));

export const imuDataRelations = relations(imuData, ({ one }) => ({
  user: one(users, {
    fields: [imuData.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  recordedAt: true,
});

export const insertPreventionTipSchema = createInsertSchema(preventionTips).omit({
  id: true,
  updatedAt: true,
});

export const insertDailyGoalSchema = createInsertSchema(dailyGoals).omit({
  id: true,
  date: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertCaregiverSchema = createInsertSchema(caregivers).omit({
  id: true,
  createdAt: true,
});

export const insertUrgentAlertSchema = createInsertSchema(urgentAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertHealthArticleSchema = createInsertSchema(healthArticles).omit({
  id: true,
  publishedAt: true,
});

export const insertFootpadPressureSchema = createInsertSchema(footpadPressure).omit({
  id: true,
  recordedAt: true,
});

export const insertIMUDataSchema = createInsertSchema(imuData).omit({
  id: true,
  recordedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type PreventionTip = typeof preventionTips.$inferSelect;
export type InsertPreventionTip = z.infer<typeof insertPreventionTipSchema>;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Caregiver = typeof caregivers.$inferSelect;
export type InsertCaregiver = z.infer<typeof insertCaregiverSchema>;
export type UrgentAlert = typeof urgentAlerts.$inferSelect;
export type InsertUrgentAlert = z.infer<typeof insertUrgentAlertSchema>;
export type HealthArticle = typeof healthArticles.$inferSelect;
export type InsertHealthArticle = z.infer<typeof insertHealthArticleSchema>;
export type FootpadPressure = typeof footpadPressure.$inferSelect;
export type InsertFootpadPressure = z.infer<typeof insertFootpadPressureSchema>;
export type IMUData = typeof imuData.$inferSelect;
export type InsertIMUData = z.infer<typeof insertIMUDataSchema>;
