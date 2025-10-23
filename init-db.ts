import { db } from "./server/db";
import { users, healthArticles } from "@shared/schema";
import { eq } from "drizzle-orm";

async function initDatabase() {
  console.log("Initializing database...");
  
  // Create a sample user
  const sampleUser = {
    id: "user_123",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
  };
  
  try {
    // Insert sample user
    await db.insert(users).values(sampleUser).onConflictDoNothing();
    console.log("Sample user created/already exists");
    
    // Insert sample health articles
    const sampleArticles = [
      {
        id: "article_1",
        title: "Understanding Diabetic Neuropathy",
        content: "Diabetic neuropathy is a type of nerve damage that can occur if you have diabetes. High blood sugar can injure nerve fibers throughout your body, but diabetic neuropathy most often damages nerves in your legs and feet.",
        imageUrl: "/assets/article1.jpg",
        publishedAt: new Date(),
      },
      {
        id: "article_2",
        title: "Foot Care for Diabetics",
        content: "Proper foot care is essential for people with diabetes. Daily inspection, proper hygiene, and appropriate footwear can prevent serious complications.",
        imageUrl: "/assets/article2.jpg",
        publishedAt: new Date(),
      }
    ];
    
    await db.insert(healthArticles).values(sampleArticles).onConflictDoNothing();
    console.log("Sample health articles created/already exist");
    
    console.log("Database initialization completed!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initDatabase();