import Database from 'better-sqlite3';
import fs from 'fs';

// Create or open the database
const db = new Database('local.db');

console.log('Initializing SQLite database...');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS health_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    heart_rate INTEGER,
    foot_pressure TEXT,
    bluetooth_connected INTEGER DEFAULT 0,
    battery_level INTEGER DEFAULT 0,
    anomalies_detected INTEGER DEFAULT 0,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS prevention_tips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    hydration_enabled INTEGER DEFAULT 1,
    walking_goals_enabled INTEGER DEFAULT 1,
    salt_reduction_enabled INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    hydration_progress INTEGER DEFAULT 0,
    walking_progress INTEGER DEFAULT 0,
    salt_progress INTEGER DEFAULT 0
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_time TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS caregivers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    emergency_notifications INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS urgent_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS health_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    read_time INTEGER DEFAULT 5,
    published_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS footpad_pressure (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    foot TEXT NOT NULL,
    pressure_points TEXT NOT NULL,
    average_pressure TEXT,
    max_pressure TEXT,
    notes TEXT,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS imu_data (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    accelerometer_x TEXT,
    accelerometer_y TEXT,
    accelerometer_z TEXT,
    gyroscope_x TEXT,
    gyroscope_y TEXT,
    gyroscope_z TEXT,
    magnetometer_x TEXT,
    magnetometer_y TEXT,
    magnetometer_z TEXT,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire TEXT NOT NULL
  );
`);

console.log('Database tables created successfully!');

// Insert sample data
console.log('Inserting sample data...');

// Insert sample user
db.exec(`
  INSERT OR IGNORE INTO users (id, email, first_name, last_name)
  VALUES ('user_123', 'demo@example.com', 'Demo', 'User');
`);

// Insert sample health articles
db.exec(`
  INSERT OR IGNORE INTO health_articles (id, title, excerpt, content, category, image_url)
  VALUES 
    ('article_1', 'Understanding Diabetic Neuropathy', 'Learn about diabetic neuropathy and its symptoms', 'Diabetic neuropathy is a type of nerve damage that can occur if you have diabetes. High blood sugar can injure nerve fibers throughout your body, but diabetic neuropathy most often damages nerves in your legs and feet.', 'neuropathy', '/attached_assets/Home_1760091696115.png'),
    ('article_2', 'Foot Care for Diabetics', 'Essential foot care tips for people with diabetes', 'Proper foot care is essential for people with diabetes. Daily inspection, proper hygiene, and appropriate footwear can prevent serious complications.', 'foot_care', '/attached_assets/New Screen_1760091696117.png');
`);

console.log('Sample data inserted successfully!');
console.log('Database initialization completed!');