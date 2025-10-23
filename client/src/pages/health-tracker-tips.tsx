import { Link } from "wouter";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Settings, ArrowLeft, Heart } from "lucide-react";
import type { PreventionTip } from "@shared/schema";

export default function HealthTrackerTips() {
  const { user } = useAuth();
  const displayName = user?.firstName || "User";

  const { data: preventionTips } = useQuery<PreventionTip[]>({
    queryKey: ["/api/prevention-tips"],
    retry: false,
  });

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 neuropad-text-primary" />
              <h1 className="text-2xl font-bold neuropad-text-primary">Health Tips</h1>
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
              <p className="text-xs neuropad-text-secondary font-medium">Browse simple health tips</p>
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

          {/* Tips List - Removed search area as requested */}
          <div className="px-6 space-y-3">
            {(preventionTips || []).map((tip, idx) => (
              <div key={idx} className="native-card-elevated p-4">
                <p className="font-semibold neuropad-text-primary">{(tip as any).title || "Healthy Habit"}</p>
                <p className="text-sm neuropad-text-secondary">{(tip as any).category || "General"}</p>
              </div>
            ))}
            {!preventionTips && (
              <div className="native-card-elevated p-4">
                <p className="font-semibold neuropad-text-primary">Walk daily</p>
                <p className="text-sm neuropad-text-secondary">Keep moving for better health</p>
              </div>
            )}
          </div>
        </div>

        <BottomNavigation currentPage="/health-tracker" />
      </div>
    </PageTransition>
  );
}