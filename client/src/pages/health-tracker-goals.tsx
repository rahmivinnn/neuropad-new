import { Link } from "wouter";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import CircularProgress from "@/components/circular-progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Settings, ArrowLeft, Heart } from "lucide-react";
import type { DailyGoal } from "@shared/schema";

export default function HealthTrackerGoals() {
  const { user } = useAuth();
  const displayName = user?.firstName || "User";

  const { data: dailyGoals } = useQuery<DailyGoal>({
    queryKey: ["/api/daily-goals"],
    retry: false,
  });

  const hydrationProgress = dailyGoals?.hydrationProgress || 0;
  const walkingProgress = dailyGoals?.walkingProgress || 0;
  const saltProgress = dailyGoals?.saltProgress || 0;

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
            <Link to="/health-tracker">
              <button
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                aria-label="Back to Health Tracker"
              >
                <ArrowLeft className="w-5 h-5 neuropad-text-primary" />
              </button>
            </Link>
          </div>

          {/* User Greeting */}
          <div className="flex items-center gap-3 mb-4 px-6">
            <div className="w-10 h-10 rounded-xl neuropad-primary shadow-native flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold neuropad-text-primary">Hello, {displayName}!</h2>
              <p className="text-xs neuropad-text-secondary font-medium">Track your progress</p>
            </div>
          </div>

          {/* Subpage Navigation */}
          <div className="px-6 mb-4">
            <div className="flex gap-2">
              <Link to="/health-tracker">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Overview</button>
              </Link>
              <Link to="/health-tracker/tips">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Tips</button>
              </Link>
              <Link to="/health-tracker/goals">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Goals</button>
              </Link>
            </div>
          </div>

          {/* Goal Circles */}
          <div className="px-6">
            <div className="flex justify-around">
              <div className="text-center">
                <CircularProgress progress={hydrationProgress} color="#D4C5A9" size={120} strokeWidth={12} />
                <p className="font-semibold mt-2 neuropad-text-primary">Hydration</p>
              </div>
              <div className="text-center">
                <CircularProgress progress={walkingProgress} color="#FDD835" size={120} strokeWidth={12} />
                <p className="font-semibold mt-2 neuropad-text-primary">Walking</p>
              </div>
              <div className="text-center">
                <CircularProgress progress={saltProgress} color="#D4C5A9" size={120} strokeWidth={12} />
                <p className="font-semibold mt-2 neuropad-text-primary">Salt</p>
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation currentPage="/health-tracker" />
      </div>
    </PageTransition>
  );
}