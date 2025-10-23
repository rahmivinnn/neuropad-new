import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/page-transition";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";
import CircularProgress from "@/components/circular-progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Search,
  Grid3X3,
  Droplets,
  Clock,
  Utensils,
  Heart,
} from "lucide-react";
import type { DailyGoal, PreventionTip } from "@shared/schema";

export default function HealthTracker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tips");
  const [searchQuery, setSearchQuery] = useState("");

  const displayName = user?.firstName || "User";

  // Fetch daily goals
  const { data: dailyGoals } = useQuery<DailyGoal>({
    queryKey: ["/api/daily-goals"],
    retry: false,
  });

  // Fetch prevention tips
  const { data: preventionTips } = useQuery<PreventionTip>({
    queryKey: ["/api/prevention-tips"],
    retry: false,
  });

  const hydrationProgress = dailyGoals?.hydrationProgress || 75;
  const walkingProgress = dailyGoals?.walkingProgress || 50;
  const saltProgress = dailyGoals?.saltProgress || 30;

  const healthTips = [
    {
      id: 1,
      title: "Walk 10,000 steps every day",
      category: "Walking Goal",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
      rating: 4.8,
    },
    {
      id: 2,
      title: "Drink 8 glasses of water",
      category: "Health",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop",
      rating: 4.9,
    },
  ];

  const quickTips = [
    {
      title: "Stay Active",
      subtitle: "Daily Movement",
      image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=200&h=200&fit=crop",
    },
    {
      title: "Hydration",
      subtitle: "Drink Water",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop",
    },
  ];

  const categories = [
    { name: "Hydration", icon: Droplets },
    { name: "Exercise", icon: Clock },
    { name: "Nutrition", icon: Utensils },
    { name: "Health", icon: Heart },
  ];

  return (
    <PageTransition>
      <div className="h-screen neuropad-bg pb-16 overflow-hidden">
        <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-500" />
            </div>
            <h1 className="text-lg font-bold neuropad-text-primary">Health Tracker</h1>
          </div>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
              aria-label="Back to Home"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5 neuropad-text-primary" />
            </motion.button>
          </Link>
        </div>

        {/* User Greeting */}
        <div className="flex items-center gap-3 mb-4 px-6">
          <div className="w-10 h-10 rounded-xl neuropad-primary shadow-native flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold neuropad-text-primary">Hello, {displayName}!</h2>
            <p className="text-xs neuropad-text-secondary font-medium">Stay Hydrated!</p>
          </div>
        </div>

        {/* Subpage Navigation */}
        <div className="px-6 mb-4">
          <div className="flex gap-2">
            <Link to="/health-tracker">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Overview
              </motion.button>
            </Link>
            <Link to="/health-tracker/tips">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Tips
              </motion.button>
            </Link>
            <Link to="/health-tracker/goals">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Goals
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Progress Card */}
        <div className="px-6 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="native-card-elevated p-3 border-2 border-text-primary"
          >
            <p className="text-xs mb-1 neuropad-text-primary font-medium">You have reached 60% of your target</p>
            <p className="text-xs mb-3 neuropad-text-primary font-medium">Keep it up for better health.</p>
            <div className="w-full bg-gray-200 rounded-2xl h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="neuropad-primary h-3 rounded-2xl"
              />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex justify-around border-b border-gray-200 mb-4 px-6">
          <motion.button
            onClick={() => setActiveTab("tips")}
            whileTap={{ scale: 0.95 }}
            className={`pb-3 border-b-3 font-bold transition-colors ${
              activeTab === "tips" ? "border-primary neuropad-text-primary" : "neuropad-text-secondary border-transparent"
            }`}
            data-testid="tab-tips"
          >
            Tips
          </motion.button>
          <Link to="/prevention-tips">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="pb-3 neuropad-text-secondary font-bold"
              data-testid="tab-reminders"
            >
              Reminders
            </motion.button>
          </Link>
          <motion.button
            onClick={() => setActiveTab("goals")}
            whileTap={{ scale: 0.95 }}
            className={`pb-3 border-b-3 font-bold transition-colors ${
              activeTab === "goals" ? "border-primary neuropad-text-primary" : "neuropad-text-secondary border-transparent"
            }`}
            data-testid="tab-goals"
          >
            My Goals
          </motion.button>
        </div>

        {activeTab === "tips" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 space-y-4">

            {/* Daily Health Goals */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold neuropad-text-primary">Daily Health Goals</h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="text-sm neuropad-text-secondary font-bold"
                >
                  View all
                </motion.button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {healthTips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    whileTap={{ scale: 0.97 }}
                    className="flex-shrink-0 w-64 rounded-2xl overflow-hidden relative native-card-elevated"
                  >
                    <img src={tip.image} alt={tip.title} className="w-full h-40 object-cover" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center shadow-sm">
                      <span className="text-xs font-bold">{tip.rating}</span>
                    </div>
                    <div className="p-5">
                      <p className="font-bold mb-1 neuropad-text-primary">{tip.title}</p>
                      <p className="text-sm neuropad-text-secondary font-medium">{tip.category}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div>
              <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Quick Tips</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-2xl overflow-hidden native-card-elevated"
                  >
                    <img src={tip.image} alt={tip.title} className="w-full h-32 object-cover" />
                    <div className="p-4">
                      <p className="font-bold neuropad-text-primary">{tip.title}</p>
                      <p className="text-xs neuropad-text-secondary font-medium">{tip.subtitle}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Categories</h3>
              <div className="grid grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 native-active"
                  >
                    <div className="w-16 h-16 rounded-2xl border-2 border-text-primary shadow-native flex items-center justify-center">
                      <category.icon className="w-8 h-8 neuropad-text-primary" />
                    </div>
                    <span className="text-sm neuropad-text-primary font-medium">{category.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            </div>
          </>
        )}

        {activeTab === "goals" && (
          <div className="flex-1 overflow-y-auto px-6">
            <h3 className="text-lg font-bold mb-4 neuropad-text-primary">Your Daily Goals</h3>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-around"
            >
              <div className="text-center">
                <CircularProgress
                  progress={hydrationProgress}
                  color="#D4C5A9"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-bold mt-3 neuropad-text-primary">Hydration</p>
              </div>

              <div className="text-center">
                <CircularProgress
                  progress={walkingProgress}
                  color="#FDD835"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-bold mt-3 neuropad-text-primary">Walking</p>
              </div>

              <div className="text-center">
                <CircularProgress
                  progress={saltProgress}
                  color="#D4C5A9"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-bold mt-3 neuropad-text-primary">Salt</p>
              </div>
            </motion.div>
          </div>
        )}
        </div>

        <BottomNavigation currentPage="/health-tracker" />
      </div>
    </PageTransition>
  );
}
