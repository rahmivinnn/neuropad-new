import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Settings, ArrowLeft, Plus, X } from "lucide-react";
import type { Reminder } from "@shared/schema";

export default function PreventionTipsReminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newReminder, setNewReminder] = useState("");
  const [showAddReminder, setShowAddReminder] = useState(false);

  const { data: reminders } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
    retry: false,
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: { title: string; scheduledTime: string }) => {
      await apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setNewReminder("");
      setShowAddReminder(false);
      toast({ title: "Success", description: "Reminder successfully added" });
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
      toast({ title: "Error", description: "Failed to add reminder", variant: "destructive" });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Success", description: "Reminder successfully deleted" });
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
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    },
  });

  const handleAddReminder = () => {
    if (!newReminder.trim()) {
      toast({ title: "Error", description: "Please enter reminder text", variant: "destructive" });
      return;
    }
    const parts = newReminder.split(" - ");
    const title = parts[0] || newReminder;
    const scheduledTime = parts[1] || "08:00 AM";
    createReminderMutation.mutate({ title, scheduledTime });
  };

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-6 pt-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 neuropad-text-primary" />
              <h1 className="text-2xl font-bold neuropad-text-primary">Reminders</h1>
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

          {/* Reminders */}
          <div className="mb-6 px-6">
            <h2 className="text-3xl font-serif font-bold mb-6 neuropad-text-primary">Upcoming Reminders</h2>
            <div className="neuropad-card p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold neuropad-text-primary">Add Reminder</h3>
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="px-4 py-1 rounded-full neuropad-secondary text-sm font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1 inline" /> Add
                </button>
              </div>

              {showAddReminder && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <Input
                    type="text"
                    placeholder="Example: Drink Water - 08:00 AM"
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex space-x-2">
                    <button onClick={handleAddReminder} className="px-3 py-2 rounded-full neuropad-primary text-sm font-semibold">Save</button>
                    <button onClick={() => setShowAddReminder(false)} className="px-3 py-2 rounded-full bg-white shadow-native text-sm font-semibold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {reminders?.length === 0 ? (
                  <p className="text-center neuropad-text-secondary">No reminders yet</p>
                ) : (
                  reminders?.map((reminder, index) => (
                    <div
                      key={reminder.id}
                      className={`flex justify-between items-center py-3 ${index < (reminders?.length || 0) - 1 ? "border-b border-gray-200" : ""}`}
                    >
                      <span className="neuropad-text-primary">
                        {reminder.title} - {reminder.scheduledTime}
                      </span>
                      <button
                        onClick={() => deleteReminderMutation.mutate(reminder.id)}
                        className="text-red-500"
                        aria-label={`Delete reminder ${reminder.id}`}
                      >
                        <X className="w-5 h-5 inline" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <BottomNavigation currentPage="/prevention-tips" />
      </div>
    </PageTransition>
  );
}