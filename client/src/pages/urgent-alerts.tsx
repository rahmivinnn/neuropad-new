import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AnimatedButton from "@/components/animated-button";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import {
  ArrowLeft,
  Phone,
  User,
  Book,
  Info,
  Bell,
  Heart,
  Clock,
  TrendingUp,
  Star,
  CheckCircle,
} from "lucide-react";
import type { UrgentAlert } from "@shared/schema";

export default function UrgentAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sampleCreated, setSampleCreated] = useState(false);

  // Fetch urgent alerts
  const { data: alerts, isLoading } = useQuery<UrgentAlert[]>({
    queryKey: ["/api/urgent-alerts"],
    retry: false,
  });

  // Mark alert as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/urgent-alerts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urgent-alerts"] });
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
      console.error("Error marking alert as read:", error);
    },
  });

  // Create sample alerts if none exist
  const createSampleAlerts = useMutation({
    mutationFn: async () => {
      const sampleAlerts = [
        {
          alertType: "stroke_risk",
          title: "Potential stroke risk detected!",
          description: "Contact emergency services immediately",
          severity: "critical",
        },
        {
          alertType: "emergency_call",
          title: "Call Emergency immediately.",
          description: "Notify your caregiver.",
          severity: "high",
        },
        {
          alertType: "review_guidance",
          title: "Review health guidance.",
          description: "1 minute ago",
          severity: "medium",
        },
        {
          alertType: "general_alert",
          title: "2 minutes ago",
          description: "3 minutes ago",
          severity: "low",
        },
        {
          alertType: "monitor_health",
          title: "Stay alert and monitor.",
          description: "4 minutes ago",
          severity: "medium",
        },
        {
          alertType: "track_metrics",
          title: "Track your health metrics.",
          description: "5 minutes ago",
          severity: "medium",
        },
        {
          alertType: "be_proactive",
          title: "Be proactive about your health.",
          description: "6 minutes ago",
          severity: "low",
        },
      ];

      for (const alert of sampleAlerts) {
        await apiRequest("POST", "/api/urgent-alerts", alert);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urgent-alerts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Error creating sample alerts:", error);
    },
  });

  // Initialize sample data if no alerts exist
  useEffect(() => {
    if (!isLoading && !sampleCreated && (!alerts || alerts.length === 0)) {
      setSampleCreated(true);
      createSampleAlerts.mutate();
    }
  }, [isLoading, alerts, sampleCreated]);

  const handleMakeCall = () => {
    toast({
      title: "Calling Emergency Services",
      description: "Connecting to 119...",
    });
  };

  const handleViewDoctor = () => {
    toast({
      title: "Doctor Information",
      description: "Showing nearest doctor information...",
    });
  };

  const handleLikeAlert = (alertId: string) => {
    markAsReadMutation.mutate(alertId);
    toast({
      title: "Alert Marked",
      description: "Alert marked as important",
    });
  };

  const handleReadGuidance = () => {
    toast({
      title: "Health Guidance",
      description: "Opening health guidance...",
    });
  };

  const handleInfoAlert = () => {
    toast({
      title: "Information Details",
      description: "Showing information details...",
    });
  };

  const handleSetReminder = () => {
    toast({
      title: "Reminder Set",
      description: "Reminder has been set",
    });
  };

  const handleClockAlert = () => {
    toast({
      title: "Monitoring Timer",
      description: "Monitoring timer started",
    });
  };

  const handleFavoriteAlert = (alertId: string) => {
    markAsReadMutation.mutate(alertId);
    toast({
      title: "Added to Favorites",
      description: "Alert added to favorites",
    });
  };

  const handleViewChart = () => {
    toast({
      title: "Health Chart",
      description: "Showing health metrics chart...",
    });
  };

  const handleHealthCheck = () => {
    toast({
      title: "Health Check",
      description: "Starting health check...",
    });
  };

  const handleConfirmAlert = (alertId: string) => {
    markAsReadMutation.mutate(alertId);
    toast({
      title: "Alert Confirmed",
      description: "Alert confirmed",
    });
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "stroke_risk":
        return <Heart className="w-8 h-8 text-red-500" />;
      case "emergency_call":
        return <Phone className="w-8 h-8 text-orange-500" />;
      case "review_guidance":
        return <Book className="w-8 h-8 text-blue-500" />;
      case "monitor_health":
        return <TrendingUp className="w-8 h-8 text-red-500" />;
      case "track_metrics":
        return <TrendingUp className="w-8 h-8 text-green-500" />;
      case "be_proactive":
        return <Star className="w-8 h-8 text-purple-500" />;
      default:
        return <Bell className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getAlertBgColor = (alertType: string) => {
    switch (alertType) {
      case "stroke_risk":
        return "bg-red-100";
      case "emergency_call":
        return "bg-orange-100";
      case "review_guidance":
        return "bg-blue-100";
      case "monitor_health":
        return "bg-red-100";
      case "track_metrics":
        return "bg-green-100";
      case "be_proactive":
        return "bg-purple-100";
      default:
        return "bg-yellow-100";
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 px-6 pt-6">
          <Link to="/">
            <AnimatedButton variant="ghost" size="sm" className="mr-4" data-testid="button-back">
              <ArrowLeft className="w-6 h-6" />
            </AnimatedButton>
          </Link>
          <h1 className="text-2xl font-bold neuropad-text-primary">Urgent Alerts</h1>
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

        {/* Alerts List */}
        <div className="px-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="neuropad-text-secondary">Loading alerts...</p>
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-4 neuropad-text-secondary" />
              <p className="neuropad-text-secondary">No alerts yet</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div
                key={alert.id}
                className={`neuropad-card p-4 shadow-sm flex items-center justify-between ${
                  !alert.isRead ? "border-l-4 border-l-red-500" : ""
                }`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-14 h-14 rounded-full ${getAlertBgColor(alert.alertType)} flex items-center justify-center overflow-hidden`}>
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold neuropad-text-primary">{alert.title}</p>
                    <p className="text-sm neuropad-text-secondary">{alert.description}</p>
                    <p className="text-xs neuropad-text-secondary mt-1">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString("en-US") : "Just now"}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {/* Primary Action */}
                  {alert.alertType === "stroke_risk" && (
                    <>
                      <AnimatedButton
                        onClick={handleMakeCall}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-call-${alert.id}`}
                      >
                        <Phone className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleViewDoctor}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-doctor-${alert.id}`}
                      >
                        <User className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "emergency_call" && (
                    <>
                      <AnimatedButton
                        onClick={handleMakeCall}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-call-${alert.id}`}
                      >
                        <Phone className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => handleLikeAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-like-${alert.id}`}
                      >
                        <Heart className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "review_guidance" && (
                    <>
                      <AnimatedButton
                        onClick={handleReadGuidance}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-guidance-${alert.id}`}
                      >
                        <Book className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleInfoAlert}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-info-${alert.id}`}
                      >
                        <Info className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "general_alert" && (
                    <>
                      <AnimatedButton
                        onClick={handleSetReminder}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-reminder-${alert.id}`}
                      >
                        <Bell className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleInfoAlert}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-info-${alert.id}`}
                      >
                        <Info className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "monitor_health" && (
                    <>
                      <AnimatedButton
                        onClick={handleClockAlert}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-clock-${alert.id}`}
                      >
                        <Clock className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => handleFavoriteAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-favorite-${alert.id}`}
                      >
                        <Heart className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "track_metrics" && (
                    <>
                      <AnimatedButton
                        onClick={handleViewChart}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-chart-${alert.id}`}
                      >
                        <TrendingUp className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handleHealthCheck}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-health-check-${alert.id}`}
                      >
                        <Star className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
                  
                  {alert.alertType === "be_proactive" && (
                    <>
                      <AnimatedButton
                        onClick={handleMakeCall}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-call-${alert.id}`}
                      >
                        <Phone className="w-6 h-6" />
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={() => handleConfirmAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-confirm-${alert.id}`}
                      >
                        <CheckCircle className="w-6 h-6" />
                      </AnimatedButton>
                    </>
                  )}
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
