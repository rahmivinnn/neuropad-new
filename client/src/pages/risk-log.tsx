import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/page-transition";
import BottomNavigation from "@/components/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import type { HealthMetric } from "@shared/schema";
import {
  Activity,
  BarChart3,
  Heart,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";

export default function RiskLog() {
  const { user } = useAuth();

  // Fetch health metrics for risk analysis
  const { data: healthMetrics } = useQuery<HealthMetric>({
    queryKey: ["/api/health-metrics"],
    retry: false,
  });

  // Live monitoring (serverless simulation)
  type RiskEvent = { id: string; type: "heart" | "pressure"; value: number; timestamp: number };
  const [isLive, setIsLive] = useState(false);
  const [events, setEvents] = useState<RiskEvent[]>(() => []);
  const [liveHeart, setLiveHeart] = useState<number>(healthMetrics?.heartRate || 72);
  const [livePressure, setLivePressure] = useState<number>(Number(healthMetrics?.footPressure) || 40);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("neuro_risk_log_events");
    if (raw) {
      try { setEvents(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("neuro_risk_log_events", JSON.stringify((events as RiskEvent[]).slice(-100)));
  }, [events]);

  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setLiveHeart(prev => {
        const drift = Math.round((Math.random() - 0.5) * 6);
        const next = Math.min(110, Math.max(55, prev + drift));
        setEvents(ev => ([...ev as RiskEvent[], { id: crypto.randomUUID(), type: "heart", value: next, timestamp: Date.now() }]));
        return next;
      });
      setLivePressure(prev => {
        const drift = Math.round((Math.random() - 0.5) * 10);
        const next = Math.min(100, Math.max(20, prev + drift));
        setEvents(ev => ([...ev as RiskEvent[], { id: crypto.randomUUID(), type: "pressure", value: next, timestamp: Date.now() }]));
        return next;
      });
    }, 2500);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isLive]);

  const displayName = user?.firstName || user?.email?.split("@")[0] || "User";

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-6 pt-6">
          <div className="flex items-center">
          <div className="w-16 h-16 rounded-full neuropad-card mr-4 overflow-hidden flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold neuropad-text-primary">Risk & Log</h1>
            <p className="neuropad-text-secondary">@health.monitor</p>
          </div>
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

        {/* Statistics */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold neuropad-text-primary">Statistics</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsLive(v => !v)}
              className={`px-4 py-2 rounded-xl font-bold shadow-native native-active text-white ${isLive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
              data-testid="button-toggle-live"
            >
              {isLive ? 'Live: ON' : 'Live: OFF'}
            </motion.button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center" data-testid="stat-daily">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <Heart className="w-10 h-10 neuropad-text-primary" />
              </div>
              <p className="font-bold text-lg neuropad-text-primary">Daily</p>
              <p className="text-sm neuropad-text-secondary text-center">
                Foot pressure<br />imbalance
              </p>
            </div>
            
            <div className="text-center" data-testid="stat-weekly">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 neuropad-text-primary" />
              </div>
              <p className="font-bold text-lg neuropad-text-primary">Weekly</p>
              <p className="text-sm neuropad-text-secondary text-center">
                Walking pattern<br />analysis
              </p>
            </div>
            
            <div className="text-center" data-testid="stat-irregularities">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <Activity className="w-10 h-10 neuropad-text-primary" />
              </div>
              <p className="font-bold text-lg neuropad-text-primary">{Math.max(0, (events).filter(e => e.type === 'heart' && e.value > 100).length)}</p>
              <p className="text-sm neuropad-text-secondary text-center">
                Heart rate<br />irregularities
              </p>
            </div>
          </div>
        </div>

        {/* View Details */}
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold mb-4 neuropad-text-primary">View Details</h2>
          
          {/* AI Insights */}
          <div className="neuropad-card p-6 mb-4 shadow-sm" data-testid="card-ai-insights">
            <h3 className="text-lg font-bold mb-2 neuropad-text-primary">AI Insights available</h3>
            <p className="neuropad-text-secondary text-sm mb-4">Tap for more info!</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm neuropad-text-primary">Trend</span>
              <span className="text-sm neuropad-text-secondary">Daily monitoring</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="neuropad-primary h-2 rounded-full" style={{ width: "70%" }}></div>
            </div>
          </div>

          {/* Weekly Report */}
          <div className="neuropad-card p-6 shadow-sm" data-testid="card-weekly-report">
            <h3 className="text-lg font-bold mb-2 neuropad-text-primary">Weekly report</h3>
            <p className="neuropad-text-secondary text-sm mb-4">Analyze your data</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm neuropad-text-primary">Trend</span>
              <span className="text-sm neuropad-text-secondary">Weekly review</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="neuropad-primary h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>

        {/* Health Metrics Summary */}
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold mb-4 neuropad-text-primary">Metrics Summary</h2>
          <div className="neuropad-card p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="font-semibold neuropad-text-primary">Heart Rate</p>
                <p className="text-sm neuropad-text-secondary">
                  {isLive ? liveHeart : (healthMetrics?.heartRate || "--")} BPM
                </p>
              </div>
              
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold neuropad-text-primary">Foot Pressure</p>
                <p className="text-sm neuropad-text-secondary">
                  {isLive ? livePressure : (healthMetrics?.footPressure || "--")} mmHg
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
              <span className="text-sm neuropad-text-secondary">Device Status</span>
                <span className={`text-sm font-semibold ${
                  healthMetrics?.bluetoothConnected ? "text-green-500" : "text-red-500"
                }`}>
              {healthMetrics?.bluetoothConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
              <span className="text-sm neuropad-text-secondary">Anomalies Detected</span>
                <span className="text-sm font-semibold neuropad-text-primary">
                  {healthMetrics?.anomaliesDetected || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Timeline */}
        <div className="px-6 mb-8">
          <h2 className="text-xl font-bold mb-4 neuropad-text-primary">Live Timeline</h2>
          <div className="neuropad-card p-4 overflow-x-auto">
            <div className="flex gap-3 min-w-full">
              {events.slice(-20).map((e) => (
                <motion.div
                  key={e.id}
                  whileHover={{ y: -2 }}
                  className={`px-3 py-2 rounded-xl shadow-sm border text-sm font-bold ${e.type === 'heart' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
                >
                  <div className="flex items-center gap-2">
                    {e.type === 'heart' ? <Activity className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span>{e.value}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
              {events.length === 0 && (
              <p className="text-sm neuropad-text-secondary">No data yet. Turn on Live to start monitoring.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 mb-6 space-y-3">
          <Link to="/urgent-alerts">
            <Button className="w-full py-3 rounded-full neuropad-primary neuropad-text-primary font-bold" data-testid="button-view-alerts">
              View Urgent Alerts
            </Button>
          </Link>
          
          <Link to="/bluetooth-device">
            <Button 
              variant="outline" 
              className="w-full py-3 rounded-full neuropad-card border-2 border-primary neuropad-text-primary font-bold"
              data-testid="button-device-settings"
            >
              Device Settings
            </Button>
          </Link>
        </div>
      </div>

      <BottomNavigation currentPage="/risk-log" />
    </div>
    </PageTransition>
  );
}
