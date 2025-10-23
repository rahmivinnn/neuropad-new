import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import DashboardArticles from "@/pages/dashboard-articles";
import HealthTracker from "@/pages/health-tracker";
import HealthTrackerTips from "@/pages/health-tracker-tips";
import HealthTrackerGoals from "@/pages/health-tracker-goals";
import PreventionTips from "@/pages/prevention-tips";
import PreventionTipsGoals from "@/pages/prevention-tips-goals";
import PreventionTipsReminders from "@/pages/prevention-tips-reminders";
import UrgentAlertsHistory from "@/pages/urgent-alerts-history";
import CaregiverNetwork from "@/pages/caregiver-network";
import CaregiverManage from "@/pages/caregiver-network-manage";
import BluetoothDevice from "@/pages/bluetooth-device";
import RiskLog from "@/pages/risk-log";
import UrgentAlerts from "@/pages/urgent-alerts";
import FootpadTracking from "@/pages/footpad-tracking";
import IMUSensor from "@/pages/imu-sensor";
import Onboarding from "@/pages/onboarding";
import AuthScreen from "@/pages/auth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasOnboardingCompleted =
    typeof window !== "undefined" &&
    localStorage.getItem("neuro_onboarding_completed") === "true";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center neuropad-bg page-transition">
        <div className="text-center animate-fade-in-up">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="neuropad-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/auth" component={AuthScreen} />
      {!hasOnboardingCompleted ? (
        // Selalu mulai dari Onboarding jika belum selesai, bahkan jika user sudah login
        <Route path="/" component={Onboarding} />
      ) : !isAuthenticated ? (
        // Setelah onboarding selesai, arahkan ke Login (Auth)
        <Route path="/" component={AuthScreen} />
      ) : (
        // Jika sudah onboarding dan sudah login, tampilkan Home dan halaman lain
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/health-tracker" component={HealthTracker} />
          <Route path="/dashboard/articles" component={DashboardArticles} />
          <Route path="/health-tracker/tips" component={HealthTrackerTips} />
          <Route path="/health-tracker/goals" component={HealthTrackerGoals} />
          <Route path="/prevention-tips" component={PreventionTips} />
          <Route path="/prevention-tips/goals" component={PreventionTipsGoals} />
          <Route path="/prevention-tips/reminders" component={PreventionTipsReminders} />
          <Route path="/urgent-alerts/history" component={UrgentAlertsHistory} />
          <Route path="/caregiver-network" component={CaregiverNetwork} />
          <Route path="/caregiver-network/manage" component={CaregiverManage} />
          <Route path="/bluetooth-device" component={BluetoothDevice} />
          <Route path="/imu-sensor" component={IMUSensor} />
          <Route path="/risk-log" component={RiskLog} />
          <Route path="/urgent-alerts" component={UrgentAlerts} />
          <Route path="/footpad-tracking" component={FootpadTracking} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
