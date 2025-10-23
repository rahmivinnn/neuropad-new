import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import CircularProgress from "@/components/circular-progress";
import BottomNavigation from "@/components/bottom-navigation";
import { motion } from "framer-motion";
import { Settings, ArrowLeft } from "lucide-react";
import type { DailyGoal } from "@shared/schema";

export default function PreventionTipsGoals() {
  const { data: dailyGoals } = useQuery<DailyGoal>({
    queryKey: ["/api/daily-goals"],
    retry: false,
  });

  const hydrationProgress = dailyGoals?.hydrationProgress || 75;
  const walkingProgress = dailyGoals?.walkingProgress || 50;
  const saltProgress = dailyGoals?.saltProgress || 30;

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 neuropad-text-primary" />
              <h1 className="text-2xl font-bold neuropad-text-primary">Daily Goals</h1>
            </div>
            <Link to="/prevention-tips">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                aria-label="Back to Overview"
              >
                <ArrowLeft className="w-5 h-5 neuropad-text-primary" />
              </motion.button>
            </Link>
          </div>

          {/* Subpage Navigation */}
          <div className="px-6 mb-4">
            <div className="flex gap-2">
              <Link to="/prevention-tips">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Overview</button>
              </Link>
              <Link to="/prevention-tips/goals">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Goals</button>
              </Link>
              <Link to="/prevention-tips/reminders">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Reminders</button>
              </Link>
            </div>
          </div>

          {/* Daily Goal Tracking */}
          <div className="mb-6 px-6">
            <h2 className="text-3xl font-serif font-bold mb-6 neuropad-text-primary">Daily Goal Tracking</h2>
            <div className="flex justify-around">
              <div className="text-center">
                <CircularProgress
                  progress={hydrationProgress}
                  color="#D4C5A9"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-semibold mt-2 neuropad-text-primary">Hydration</p>
              </div>

              <div className="text-center">
                <CircularProgress
                  progress={walkingProgress}
                  color="#FDD835"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-semibold mt-2 neuropad-text-primary">Walking</p>
              </div>

              <div className="text-center">
                <CircularProgress
                  progress={saltProgress}
                  color="#D4C5A9"
                  size={120}
                  strokeWidth={12}
                />
                <p className="font-semibold mt-2 neuropad-text-primary">Salt</p>
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation currentPage="/prevention-tips" />
      </div>
    </PageTransition>
  );
}