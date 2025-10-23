import { Link } from "wouter";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import { motion } from "framer-motion";
import { Settings, ArrowLeft, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UrgentAlert } from "@shared/schema";

export default function UrgentAlertsHistory() {
  const { toast } = useToast();
  const { data: alerts, error } = useQuery<UrgentAlert[]>({
    queryKey: ["/api/urgent-alerts"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
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
  }

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 neuropad-text-primary" />
              <h1 className="text-2xl font-bold neuropad-text-primary">Alerts History</h1>
            </div>
            <Link to="/urgent-alerts">
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
              <Link to="/urgent-alerts">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">Overview</button>
              </Link>
              <Link to="/urgent-alerts/history">
                <button className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active">History</button>
              </Link>
            </div>
          </div>

          {/* History List */}
          <div className="px-6 space-y-4">
            {!alerts || alerts.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 neuropad-text-secondary" />
                <p className="neuropad-text-secondary">No history yet</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="neuropad-card p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold neuropad-text-primary">{alert.title}</p>
                      <p className="text-sm neuropad-text-secondary">{alert.description}</p>
                    </div>
                    <p className="text-xs neuropad-text-secondary">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString("en-US") : "Just now"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <BottomNavigation currentPage="/urgent-alerts" />
      </div>
    </PageTransition>
  );
}