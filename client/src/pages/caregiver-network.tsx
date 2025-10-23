import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ToggleSwitch from "@/components/toggle-switch";
import BottomNavigation from "@/components/bottom-navigation";
import { Heart, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { Caregiver } from "@shared/schema";

export default function CaregiverNetwork() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch caregivers
  const { data: caregivers } = useQuery<Caregiver[]>({
    queryKey: ["/api/caregivers"],
    retry: false,
  });

  // Update caregiver emergency
  const updateEmergencyMutation = useMutation({
    mutationFn: async ({ id, emergencyNotifications }: { id: string; emergencyNotifications: boolean }) => {
      await apiRequest("PATCH", `/api/caregivers/${id}/emergency`, { emergencyNotifications });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caregivers"] });
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
        description: "Failed to update emergency notifications",
        variant: "destructive",
      });
    },
  });

  const handleToggleEmergency = (caregiver: Caregiver, enabled: boolean) => {
    updateEmergencyMutation.mutate({
      id: caregiver.id,
      emergencyNotifications: enabled,
    });
    
    toast({
      title: "Notification updated",
      description: `Emergency notification for ${caregiver.name} ${enabled ? "enabled" : "disabled"}`,
    });
  };

  // Overview page has no side effects
  useEffect(() => {}, []);

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-6 pt-6">
          <div className="flex items-center space-x-3">
            <Heart className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-serif font-bold neuropad-text-primary">
              Neuropad<br />Caregiver Network
            </h1>
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

        {/* Sub-page Navigation */}
        <div className="px-6 mb-4">
          <div className="flex gap-2">
            <Link to="/caregiver-network">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Overview
              </motion.button>
            </Link>
            <Link to="/caregiver-network/manage">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Manage
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Emergency Notifications */}
        <div className="neuropad-card p-6 mb-6 shadow-sm mx-6">
          <h2 className="text-xl font-bold mb-4 neuropad-text-primary">Emergency Notifications</h2>
          
          {caregivers?.length === 0 ? (
            <p className="text-center neuropad-text-secondary">No caregivers registered yet</p>
          ) : (
            <div className="space-y-4">
              {caregivers?.map((caregiver, index) => (
                <div
                  key={caregiver.id}
                  className={`flex justify-between items-center ${
                    index < (caregivers?.length || 0) - 1 ? "pb-4 border-b border-gray-200" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full neuropad-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold neuropad-text-primary">{caregiver.name}</span>
                      <p className="text-sm neuropad-text-secondary">{caregiver.relationship}</p>
                      <p className="text-xs neuropad-text-secondary">{caregiver.contactInfo}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={caregiver.emergencyNotifications ?? false}
                    onChange={(enabled) => handleToggleEmergency(caregiver, enabled)}
                    data-testid={`toggle-emergency-${caregiver.id}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        <BottomNavigation currentPage="/caregiver-network" />
      </div>
    </PageTransition>
  );
}
