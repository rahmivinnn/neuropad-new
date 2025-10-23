import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import { Pose, Results } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import AnimatedButton from "@/components/animated-button";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import {
  ArrowLeft,
  Activity,
  Gauge,
  RotateCcw,
  Bluetooth,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface IMUData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  magnetometer?: { x: number; y: number; z: number };
}

export default function IMUSensor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ name: string; id: string; connected: boolean } | null>(null);
  const [imuData, setImuData] = useState<IMUData>({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
  });
  const deviceRef = useRef<any>(null);
  const serverRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<any>(null);
  const [bodyTracking, setBodyTracking] = useState(false);
  const [poseScore, setPoseScore] = useState<number>(0);

  const checkBluetoothSupport = () => {
    const nav: any = navigator;
    return nav.bluetooth !== undefined;
  };

  // Save IMU data mutation
  const saveIMUMutation = useMutation({
    mutationFn: async (data: IMUData) => {
      await apiRequest("POST", "/api/imu-data", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imu-data"] });
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (serverRef.current?.connected) {
        serverRef.current.disconnect();
      }
    };
  }, []);

  // Initialize MediaPipe Pose when body tracking toggled on
  useEffect(() => {
    if (!bodyTracking) {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      poseRef.current?.close();
      poseRef.current = null;
      return;
    }

    const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults((results: Results) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(results.image as any, 0, 0, canvas.width, canvas.height);

      const landmarks = results.poseLandmarks || [];
      let score = 0;
      if (landmarks.length) {
        // Basic realism: compute posture score by symmetry of shoulders/hips and stance width
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const shoulderSym = Math.abs(leftShoulder.y - rightShoulder.y);
        const hipSym = Math.abs(leftHip.y - rightHip.y);
        const stanceWidth = Math.abs(landmarks[27].x - landmarks[28].x);
        score = Math.max(0, 100 - (shoulderSym + hipSym) * 300) + Math.min(stanceWidth * 200, 40);
      }
      setPoseScore(Math.round(score));

      // Draw simple skeleton for realism
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(99,102,241,0.9)"; // indigo
      for (const p of landmarks) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    poseRef.current = pose;

    const camera = new Camera(videoRef.current!, {
      onFrame: async () => {
        await poseRef.current!.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();
    cameraRef.current = camera;

    return () => {
      cameraRef.current?.stop?.();
      poseRef.current?.close?.();
      cameraRef.current = null;
      poseRef.current = null;
    };
  }, [bodyTracking]);

  const connectIMUSensor = async () => {
    setIsConnecting(true);
    
    try {
      const nav: any = navigator;
      if (!nav.bluetooth) {
        setIsConnecting(false);
        toast({
          title: "❌ Browser Not Supported",
          description: "Web Bluetooth is not available. Please use Chrome, Edge, or Opera.",
          variant: "destructive",
        });
        return;
      }

      console.log("Bluetooth API available, requesting IMU device...");
      
      toast({
        title: "🔍 Scanning IMU Sensors...",
        description: "Please select your IMU/motion sensor from the popup",
      });

      // Request device with IMU-related services
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'environmental_sensing',
          'device_information',
          'generic_access',
          '00001800-0000-1000-8000-00805f9b34fb',
          '00001801-0000-1000-8000-00805f9b34fb',
        ]
      });

      deviceRef.current = device;
      
      toast({
        title: "Connecting...",
        description: `Connecting to ${device.name || 'IMU Sensor'}`,
      });

      const server = await device.gatt!.connect();
      serverRef.current = server;

      const services = await server.getPrimaryServices();
      
      setDeviceInfo({
        name: device.name || 'IMU Sensor',
        id: device.id,
        connected: true,
      });

      // Try to read real IMU data from device characteristics
      let hasRealData = false;
      try {
        for (const service of services) {
          console.log("Service UUID:", service.uuid);
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            console.log("Characteristic UUID:", char.uuid, "Properties:", char.properties);
            
            if (char.properties.notify) {
              try {
                await char.startNotifications();
                char.addEventListener('characteristicvaluechanged', (event: any) => {
                  const value = event.target.value;
                  if (value.byteLength >= 6) {
                    const newData: IMUData = {
                      accelerometer: {
                        x: value.getInt16(0, true) / 100,
                        y: value.getInt16(2, true) / 100,
                        z: value.getInt16(4, true) / 100,
                      },
                      gyroscope: {
                        x: value.byteLength >= 12 ? value.getInt16(6, true) / 100 : 0,
                        y: value.byteLength >= 12 ? value.getInt16(8, true) / 100 : 0,
                        z: value.byteLength >= 12 ? value.getInt16(10, true) / 100 : 0,
                      },
                    };
                    setImuData(newData);
                    saveIMUMutation.mutate(newData);
                  }
                });
                hasRealData = true;
                console.log("Subscribed to IMU notifications");
                break;
              } catch (notifyError) {
                console.log("Could not subscribe to notifications:", notifyError);
              }
            }
          }
          if (hasRealData) break;
        }
      } catch (charError) {
        console.log("Error reading characteristics:", charError);
      }

      // Fallback: Use simulated data if real data not available
      if (!hasRealData) {
        toast({
          title: "ℹ️ Demo Mode Active",
          description: "Real sensor data unavailable. Using simulated IMU data for demonstration.",
        });
        
        intervalRef.current = setInterval(() => {
          const newData: IMUData = {
            accelerometer: {
              x: (Math.random() - 0.5) * 20,
              y: (Math.random() - 0.5) * 20,
              z: 9.8 + (Math.random() - 0.5) * 2,
            },
            gyroscope: {
              x: (Math.random() - 0.5) * 360,
              y: (Math.random() - 0.5) * 360,
              z: (Math.random() - 0.5) * 360,
            },
          };
          
          setImuData(newData);
          saveIMUMutation.mutate(newData);
        }, 500);
      }

      toast({
        title: "✅ Connected Successfully!",
        description: `${device.name || 'IMU Sensor'} is now ${hasRealData ? 'streaming' : 'simulating'} motion data`,
      });

      device.addEventListener('gattserverdisconnected', () => {
        setDeviceInfo(prev => prev ? { ...prev, connected: false } : null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        toast({
          title: "Device Disconnected",
          description: "IMU sensor has been disconnected",
          variant: "destructive",
        });
      });

    } catch (error: any) {
      console.error("Bluetooth connection error:", error);
      
      let errorMessage = "Failed to connect to IMU sensor";
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No device was selected. Please try again.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Bluetooth access denied. Check permissions.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (serverRef.current?.connected) {
      serverRef.current.disconnect();
      setDeviceInfo(null);
      setImuData({
        accelerometer: { x: 0, y: 0, z: 0 },
        gyroscope: { x: 0, y: 0, z: 0 },
      });
      
      toast({
        title: "Disconnected",
        description: "IMU sensor has been disconnected",
      });
    }
  };

  const bluetoothSupported = checkBluetoothSupport();
  const isConnected = deviceInfo?.connected ?? false;

  return (
    <PageTransition>
      <div className="h-screen neuropad-bg pb-16 overflow-hidden">
        <div className="max-w-md mx-auto h-full flex flex-col">
          {/* Header with backdrop blur */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[hsl(45,35%,93%)]/80 border-b border-[hsl(45,8%,90%)]">
            <div className="flex items-center justify-between px-4 py-4">
              <Link to="/">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5 text-[hsl(45,15%,15%)]" />
                </motion.button>
              </Link>
              <h1 className="text-2xl font-bold text-[hsl(45,15%,15%)]">IMU & Body Tracking</h1>
              <div className="w-10"></div>
            </div>
          </div>

          <div className="px-4 space-y-3 mt-4 flex-1 overflow-y-auto">
            {/* Browser Compatibility Status - Mobile Card Style */}
            {bluetoothSupported ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-lg border border-[hsl(45,8%,90%)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-[hsl(45,15%,15%)]">IMU Ready</h3>
                      <p className="text-sm text-[hsl(45,10%,35%)]">Connect your motion sensor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-sm font-semibold text-green-600">Supported</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-3 shadow-lg shadow-red-500/10 border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-base">Browser Not Supported</h3>
                    <p className="text-sm text-red-700">Use Chrome, Edge, or Opera</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Device Status Card - Premium Mobile Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 shadow-lg border border-[hsl(45,8%,90%)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[hsl(45,15%,15%)] mb-1">
                    {deviceInfo?.name || "No Device Connected"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      isConnected ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-gray-400"
                    }`}></div>
                    <p className={`text-sm font-semibold ${
                      isConnected ? "text-green-600" : "text-gray-500"
                    }`}>
                      {isConnected ? "Connected & Streaming" : "Disconnected"}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{
                    scale: isConnected ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    repeat: isConnected ? Infinity : 0,
                    duration: 2,
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                    isConnected 
                      ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30" 
                      : "bg-gray-100"
                  }`}
                >
                  <Bluetooth className={`w-6 h-6 ${isConnected ? "text-white" : "text-gray-400"}`} />
                </motion.div>
              </div>
            </motion.div>

            {/* Real-time IMU Data - Only when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-[hsl(45,15%,15%)] px-2">Live Motion Data</h3>
                
                {/* Accelerometer Card */}
                <div className="bg-white rounded-xl p-3 shadow-lg border border-[hsl(45,8%,90%)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Gauge className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(45,15%,15%)] text-sm">Accelerometer</h4>
                      <p className="text-xs text-[hsl(45,10%,45%)]">m/s²</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-600 font-semibold mb-1">X-Axis</p>
                      <p className="text-sm font-bold text-blue-700 tabular-nums">{imuData.accelerometer.x.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-600 font-semibold mb-1">Y-Axis</p>
                      <p className="text-sm font-bold text-green-700 tabular-nums">{imuData.accelerometer.y.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-purple-600 font-semibold mb-1">Z-Axis</p>
                      <p className="text-sm font-bold text-purple-700 tabular-nums">{imuData.accelerometer.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Gyroscope Card */}
                <div className="bg-white rounded-xl p-3 shadow-lg border border-[hsl(45,8%,90%)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                      <RotateCcw className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[hsl(45,15%,15%)] text-sm">Gyroscope</h4>
                      <p className="text-xs text-[hsl(45,10%,45%)]">°/s</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-orange-600 font-semibold mb-1">X-Axis</p>
                      <p className="text-sm font-bold text-orange-700 tabular-nums">{imuData.gyroscope.x.toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-amber-600 font-semibold mb-1">Y-Axis</p>
                      <p className="text-sm font-bold text-amber-700 tabular-nums">{imuData.gyroscope.y.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-red-600 font-semibold mb-1">Z-Axis</p>
                      <p className="text-sm font-bold text-red-700 tabular-nums">{imuData.gyroscope.z.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Connection Controls - Premium Button Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2"
            >
              {!isConnected ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={connectIMUSensor}
                  disabled={isConnecting || !bluetoothSupported}
                  className="w-full rounded-xl py-4 bg-gradient-to-r from-[hsl(48,98%,60%)] to-[hsl(48,90%,55%)] text-[hsl(45,15%,15%)] font-bold shadow-lg shadow-[hsl(48,98%,60%)]/25 hover:shadow-xl hover:shadow-[hsl(48,98%,60%)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-connect-imu"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span>{isConnecting ? "Connecting..." : "Connect IMU Sensor"}</span>
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={disconnectDevice}
                  className="w-full rounded-xl py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all"
                  data-testid="button-disconnect-imu"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5" />
                    <span>Disconnect Sensor</span>
                  </div>
                </motion.button>
              )}
            </motion.div>

            {/* Body Tracking Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl p-4 shadow-lg border border-[hsl(45,8%,90%)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[hsl(45,15%,15%)] text-sm">Body Tracking</h3>
                  <p className="text-xs text-[hsl(45,10%,45%)]">Uses camera with realistic overlay</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBodyTracking(v => !v)}
                  className={`rounded-full px-4 py-2 text-sm font-bold shadow ${bodyTracking ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  data-testid="button-toggle-body-tracking"
                >
                  {bodyTracking ? 'Stop' : 'Start'}
                </motion.button>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted></video>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>
                <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur rounded-lg px-3 py-1 text-xs font-bold text-indigo-700 shadow">
                  Posture Score: {poseScore}
                </div>
              </div>
              <div className="mt-3">
                <Lottie
                  animationData={{
                    v: "5.9.0",
                    fr: 60,
                    ip: 0,
                    op: 120,
                    w: 300,
                    h: 120,
                    nm: "pulse-bar",
                    ddd: 0,
                    assets: [],
                    layers: [
                      {
                        ddd: 0,
                        ind: 1,
                        ty: 4,
                        nm: "bar",
                        sr: 1,
                        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [150, 60, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
                        shapes: [
                          { ty: "rc", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [260, 16] }, r: { a: 0, k: 8 } },
                          { ty: "fl", c: { a: 0, k: [0.38, 0.38, 0.98, 1] }, o: { a: 0, k: 1 } },
                          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
                        ],
                      },
                      {
                        ddd: 0,
                        ind: 2,
                        ty: 4,
                        nm: "dot",
                        sr: 1,
                        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 1, k: [{ t: 0, s: [20, 60, 0] }, { t: 120, s: [280, 60, 0] }] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
                        shapes: [
                          { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [14, 14] }, d: 1 },
                          { ty: "fl", c: { a: 0, k: [1, 0.8, 0.2, 1] }, o: { a: 0, k: 1 } },
                          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
                        ],
                      },
                    ],
                  }}
                  loop
                  style={{ width: 300, height: 120 }}
                />
              </div>
            </motion.div>

            {/* Info Card - Mobile Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-white to-[hsl(45,20%,98%)] rounded-xl p-4 shadow-lg border border-[hsl(45,8%,90%)]"
            >
              <h3 className="font-bold text-[hsl(45,15%,15%)] mb-2 text-sm">About IMU Sensors</h3>
              <p className="text-xs text-[hsl(45,10%,45%)] mb-2 leading-relaxed">
                IMU (Inertial Measurement Unit) sensors track motion, orientation, and position using:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(48,98%,60%)] mt-2"></div>
                  <p className="text-xs text-[hsl(45,10%,45%)] flex-1">
                    <span className="font-semibold text-[hsl(45,15%,15%)]">Accelerometer:</span> Measures acceleration forces
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(48,98%,60%)] mt-2"></div>
                  <p className="text-sm text-[hsl(45,10%,45%)] flex-1">
                    <span className="font-semibold text-[hsl(45,15%,15%)]">Gyroscope:</span> Measures rotational velocity
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(48,98%,60%)] mt-2"></div>
                  <p className="text-sm text-[hsl(45,10%,45%)] flex-1">
                    <span className="font-semibold text-[hsl(45,15%,15%)]">Magnetometer:</span> Measures magnetic field (optional)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <BottomNavigation currentPage="/imu-sensor" />
      </div>
    </PageTransition>
  );
}
