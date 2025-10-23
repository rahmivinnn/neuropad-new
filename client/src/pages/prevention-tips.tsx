import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ToggleSwitch from "@/components/toggle-switch";
import BottomNavigation from "@/components/bottom-navigation";
import {
  Settings,
  Droplets,
  Clock,
  Utensils,
  ArrowLeft,
} from "lucide-react";
import type { PreventionTip } from "@shared/schema";

export default function PreventionTips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch prevention tips
  const { data: preventionTips } = useQuery<PreventionTip>({
    queryKey: ["/api/prevention-tips"],
    retry: false,
  });

  // Update prevention tips
  const updateTipsMutation = useMutation({
    mutationFn: async (data: Partial<PreventionTip>) => {
      await apiRequest("PUT", "/api/prevention-tips", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention-tips"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        if (import.meta.env.PROD) {
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update prevention tips",
        variant: "destructive",
      });
    },
  });

  const handleToggleTip = (tipType: keyof PreventionTip, enabled: boolean) => {
    const updateData: Partial<PreventionTip> = {};
    
    if (tipType === "hydrationEnabled") {
      updateData.hydrationEnabled = enabled;
    } else if (tipType === "walkingGoalsEnabled") {
      updateData.walkingGoalsEnabled = enabled;
    } else if (tipType === "saltReductionEnabled") {
      updateData.saltReductionEnabled = enabled;
    }

    updateTipsMutation.mutate(updateData);
  };

  // Subpage navigation is provided below for splitting content

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-6 pt-6">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 neuropad-text-primary" />
            <h1 className="text-2xl font-bold neuropad-text-primary">Prevention Tips</h1>
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

        {/* Overview: AI-Based Prevention Tips */}
        <div className="mb-6 px-6">
          <h2 className="text-3xl font-serif font-bold mb-6 neuropad-text-primary">AI-Based Prevention Tips</h2>
          
          {/* Hydration */}
          <div className="neuropad-card p-4 mb-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-lg font-semibold neuropad-text-primary">Hydration</span>
            </div>
            <ToggleSwitch
              checked={preventionTips?.hydrationEnabled ?? true}
              onChange={(enabled) => handleToggleTip("hydrationEnabled", enabled)}
              data-testid="toggle-hydration"
            />
          </div>

          {/* Walking Goals */}
          <div className="neuropad-card p-4 mb-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-lg font-semibold neuropad-text-primary">Walking Goals</span>
            </div>
            <ToggleSwitch
              checked={preventionTips?.walkingGoalsEnabled ?? true}
              onChange={(enabled) => handleToggleTip("walkingGoalsEnabled", enabled)}
              data-testid="toggle-walking"
            />
          </div>

          {/* Salt Intake Reduction */}
          <div className="neuropad-card p-4 mb-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-lg font-semibold neuropad-text-primary">Salt Reduction</span>
            </div>
            <ToggleSwitch
              checked={preventionTips?.saltReductionEnabled ?? false}
              onChange={(enabled) => handleToggleTip("saltReductionEnabled", enabled)}
              data-testid="toggle-salt"
            />
          </div>
        </div>

        {/* Split out Goals and Reminders into their own pages for shorter scroll */}
      </div>

        <BottomNavigation currentPage="/prevention-tips" />
      </div>
    </PageTransition>
  );
}
