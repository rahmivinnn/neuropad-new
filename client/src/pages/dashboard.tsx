import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCounter from "@/components/animated-counter";
import PageTransition from "@/components/page-transition";
import { CardSkeleton, ArticleSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import InfoDialog from "@/components/info-dialog";
import BottomNavigation from "@/components/bottom-navigation";
import DailyGoalsCompact from "@/components/daily-goals-compact";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  Heart,
  Activity,
  AlertTriangle,
  Bluetooth,
  User,
  BookOpen,
  Clock,
  RefreshCw,
} from "lucide-react";
import type { HealthMetric, HealthArticle, DailyGoal } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInterval = useRef<number | null>(null);
  const [dialogData, setDialogData] = useState<{
    title: string;
    description?: string;
    content?: React.ReactNode;
    icon?: React.ReactNode;
  }>({ title: "" });

  // Fetch health metrics
  const { data: healthMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<HealthMetric>({
    queryKey: ["/api/health-metrics"],
    retry: false,
  });

  // Fetch health articles
  const { data: articles, isLoading: articlesLoading } = useQuery<HealthArticle[]>({
    queryKey: ["/api/health-articles"],
    retry: false,
  });

  // Fetch daily goals
  const { data: dailyGoals } = useQuery<DailyGoal>({
    queryKey: ["/api/daily-goals"],
    retry: false,
  });

  // Create sample health metrics if none exist
  const createSampleMetrics = useMutation({
    mutationFn: async () => {
      const base = 72;
      const jitter = Math.round((Math.random() - 0.5) * 8); // +/-4 bpm
      await apiRequest("POST", "/api/health-metrics", {
        heartRate: Math.max(55, Math.min(110, base + jitter)),
        footPressure: "85.5",
        bluetoothConnected: true,
        batteryLevel: 85,
        anomaliesDetected: 2,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "Session missing in dev. Continuing without redirect.",
          variant: "destructive",
        });
        // Avoid hard redirect during local preview to prevent sudden navigation to Home
        if (import.meta.env.PROD) {
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
        return;
      }
      console.error("Error creating sample metrics:", error);
    },
  });

  // Initialize sample data if no metrics exist - with debounce
  useEffect(() => {
    if (!metricsLoading && !healthMetrics && !createSampleMetrics.isPending) {
      const timer = setTimeout(() => {
        createSampleMetrics.mutate();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [healthMetrics, metricsLoading, createSampleMetrics.isPending]);

  // Set up real-time refresh with reduced frequency
  useEffect(() => {
    // Clear any existing interval
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    
    // Set up new interval for real-time updates - reduced to 15 seconds
    refreshInterval.current = window.setInterval(() => {
      refetchMetrics();
    }, 15000); // Refresh every 15 seconds to reduce flickering
    
    // Clean up interval on component unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [refetchMetrics]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    setIsRefreshing(true);
    try {
      await refetchMetrics();
    } finally {
      // Simulate loading state for better UX
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, [isRefreshing, refetchMetrics]);

  const handleLogout = useCallback(() => {
    // Clear local storage
    localStorage.removeItem("neuro_user");
    // Redirect to auth page
    window.location.href = "/auth";
  }, []);

  const showDialog = useCallback((title: string, description: string, content: React.ReactNode, icon: React.ReactNode) => {
    setDialogData({ title, description, content, icon });
    setDialogOpen(true);
  }, []);

  const displayName = useMemo(() => 
    user?.firstName || user?.email?.split("@")[0] || "User", 
    [user?.firstName, user?.email]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8 px-5 sm:px-6 pt-6 sm:pt-8">
          <h2 className="text-title sm:text-headline neuropad-text-primary">Dashboard</h2>
          <div className="flex items-center gap-3">
            <Link to="/health-tracker">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </motion.button>
            </Link>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl neuropad-secondary shadow-native flex items-center justify-center text-white font-bold text-lg native-active"
            >
              {displayName.charAt(0).toUpperCase()}
            </motion.div>
          </div>
        </div>

        {/* Subpage Navigation */}
        <div className="px-5 sm:px-6 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-display leading-tight mb-5 sm:mb-6 neuropad-text-primary tracking-tighter">
            Welcome to <br className="hidden sm:block" /> Health
          </h1>
          <div className="flex gap-2">
            <Link to="/">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Overview
              </motion.button>
            </Link>
            <Link to="/dashboard/articles">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-full bg-white shadow-native text-sm font-semibold native-active"
              >
                Articles
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Daily Goals Progress - Compact View */}
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="native-card-elevated p-6"
          >
            <DailyGoalsCompact
              hydrationProgress={dailyGoals?.hydrationProgress || 0}
              walkingProgress={dailyGoals?.walkingProgress || 0}
              saltProgress={dailyGoals?.saltProgress || 0}
              onRefresh={handleRefresh}
            />
          </motion.div>
        </div>

        {/* Daily Health Card */}
        <div className="px-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="native-card-elevated p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-title mb-1">Daily Health</h3>
                <p className="neuropad-text-secondary text-sm font-medium">Monitor your health in real-time</p>
              </div>
              <motion.div 
                className="flex -space-x-2"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div 
                  className="w-9 h-9 rounded-full neuropad-secondary border-2 border-white shadow-md"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <motion.div 
                  className="w-9 h-9 rounded-full neuropad-primary border-2 border-white shadow-md"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </motion.div>
            </div>
            <div>
              <p className="text-sm font-bold mb-3 neuropad-text-primary">Risk Level</p>
              <motion.div 
                className="w-full bg-gray-100 rounded-full h-3 cursor-pointer shadow-inner"
                data-testid="progress-risk"
                whileTap={{ scale: 0.98, height: 16 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => showDialog(
                  "Health Risk Level",
                  "Risk analysis based on your health data",
                  <div className="space-y-3">
                    <p className="text-sm">Current risk level: <strong>65%</strong></p>
                    <p className="text-sm">Influencing factors: Heart rate, foot pressure, and detected anomalies.</p>
                    <p className="text-sm">Recommendation: Perform regular check-ups and follow doctor's advice.</p>
                  </div>,
                  <AlertTriangle className="w-8 h-8 text-white" />
                )}
              >
                <motion.div 
                  className="neuropad-primary h-3 rounded-full pointer-events-none shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Health Metrics Grid */}
        <div className="px-6 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-headline">Health Metrics</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
          {metricsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
            {/* Heart Rate */}
            <motion.div 
              variants={itemVariants}
              className="native-card p-5 cursor-pointer native-active relative" 
              data-testid="card-heart-rate"
              whileHover={{ y: -4, shadow: "0 10px 30px rgba(0,0,0,0.12)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => showDialog(
                "Heart Rate",
                "Detailed information about your heart rate",
                <div className="space-y-3">
                  <p className="text-sm">Your current heart rate: <strong>{healthMetrics?.heartRate || "--"} BPM</strong></p>
                  <p className="text-sm">Normal heart rate for adults is 60-100 BPM at rest.</p>
                  <p className="text-sm">Tips: Monitor your heart rate regularly and consult a doctor if there are significant changes.</p>
                </div>,
                <Heart className="w-8 h-8 text-white" />
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shadow-sm">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 animate-pulse"></div>
              </div>
              <p className="text-sm neuropad-text-secondary mb-1 font-medium">Heart Rate:</p>
              <p className="font-bold text-lg mb-3 neuropad-text-primary">
                {healthMetrics?.heartRate ? (
                  <AnimatedCounter value={healthMetrics.heartRate} suffix=" BPM" />
                ) : (
                  "--"
                )}
              </p>
              <div className="flex justify-between items-center">
                <div 
                  className="flex-1 neuropad-primary h-1.5 rounded-full mr-3"
                  data-testid="progress-heart-rate"
                ></div>
                <span className="text-xs font-bold text-gray-500">Live</span>
              </div>
            </motion.div>

            {/* Pressure */}
            <Link to="/footpad-tracking">
            <motion.div 
              variants={itemVariants}
              className="native-card p-5 cursor-pointer native-active relative" 
              data-testid="card-pressure"
              whileHover={{ y: -4, shadow: "0 10px 30px rgba(0,0,0,0.12)" }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shadow-sm">
                  <Activity className="w-6 h-6 text-pink-500" />
                </div>
                <div className="w-2 h-2 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50 animate-pulse"></div>
              </div>
              <p className="text-sm neuropad-text-secondary mb-1 font-medium">Pressure:</p>
              <p className="font-bold text-lg mb-3 neuropad-text-primary">Footpad</p>
              <div className="flex justify-between items-center">
                <div 
                  className="flex-1 neuropad-primary h-1.5 rounded-full mr-3"
                  data-testid="progress-pressure"
                ></div>
                <span className="text-xs font-bold text-gray-500">Tracking</span>
              </div>
            </motion.div>
            </Link>

            {/* IMU Sensor */}
            <Link to="/imu-sensor">
              <motion.div 
                variants={itemVariants}
                className="native-card p-5 cursor-pointer native-active relative" 
                data-testid="card-imu-sensor"
                whileHover={{ y: -4, shadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50 animate-pulse"></div>
                </div>
                <p className="text-sm neuropad-text-secondary mb-1 font-medium">Motion Tracking</p>
                <p className="font-bold text-lg mb-3 neuropad-text-primary">IMU Sensor</p>
                <div className="flex justify-between items-center">
                  <div 
                    className="flex-1 neuropad-primary h-1.5 rounded-full mr-3"
                    data-testid="progress-imu"
                  ></div>
                  <span className="text-xs font-bold text-gray-500">Live</span>
                </div>
              </motion.div>
            </Link>

            {/* Bluetooth */}
            <Link to="/bluetooth-device">
              <motion.div 
                variants={itemVariants}
                className="native-card p-5 cursor-pointer native-active relative" 
                data-testid="card-bluetooth"
                whileHover={{ y: -4, shadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                    <Bluetooth className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 animate-pulse"></div>
                </div>
                <p className="text-sm neuropad-text-secondary mb-1 font-medium">Connect</p>
                <p className="font-bold text-lg mb-3 neuropad-text-primary">Bluetooth</p>
                <div className="flex justify-between items-center">
                  <div 
                    className="flex-1 neuropad-primary h-1.5 rounded-full mr-3"
                    data-testid="progress-bluetooth"
                  ></div>
                  <span className="text-xs font-bold text-gray-500">Connected</span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
          )}
        </div>

        {/* Health Articles Section */}
        <div className="px-6 mb-8">
          {/* Removed the "Daily Health Articles" heading as requested */}
          {articlesLoading ? (
            <div className="space-y-3">
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
            </div>
          ) : (
            <motion.div 
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {articles && articles.slice(0, 3).map((article) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                className="native-card p-5 cursor-pointer native-active"
                whileHover={{ x: 4, shadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => showDialog(
                  article.title,
                  article.excerpt,
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm neuropad-text-secondary font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime} min read</span>
                    </div>
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-2xl shadow-md"
                      />
                    )}
                    <p className="text-sm whitespace-pre-line leading-relaxed">{article.content}</p>
                  </div>,
                  <BookOpen className="w-8 h-8 text-white" />
                )}
                data-testid={`article-${article.id}`}
              >
                <div className="flex gap-4">
                  {article.imageUrl && (
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-2xl flex-shrink-0 shadow-sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1.5 neuropad-text-primary line-clamp-2 leading-snug">{article.title}</h3>
                    <p className="text-sm neuropad-text-secondary line-clamp-2 mb-3 leading-relaxed">{article.excerpt}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">{article.category}</Badge>
                      <span className="text-xs neuropad-text-secondary flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime} min
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          )}
        </div>

        {/* Logout Button */}
        <div className="px-6 mb-8">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 rounded-2xl border-2 border-gray-200 bg-white neuropad-text-primary font-bold shadow-native native-active"
            data-testid="button-logout"
          >
            Logout
          </motion.button>
        </div>
        </div>

        <InfoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogData.title}
          description={dialogData.description}
          content={dialogData.content}
          icon={dialogData.icon}
        />

        <BottomNavigation currentPage="/" />
      </div>
    </PageTransition>
  );
}