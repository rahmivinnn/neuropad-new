import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import { ArrowLeft, Activity, Save, RotateCw, Camera, CameraOff } from "lucide-react";
import type { FootpadPressure } from "@shared/schema";

interface PressurePoint {
  x: number;
  y: number;
  pressure: number;
}

export default function FootpadTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFoot, setSelectedFoot] = useState<'left' | 'right'>('left');
  const [pressurePoints, setPressurePoints] = useState<PressurePoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [targetType, setTargetType] = useState<'cardboard' | 'aluminum'>('cardboard');
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const processCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanReqRef = useRef<number | null>(null);

  // Camera access
  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Stop scanning loop
      if (scanReqRef.current) {
        cancelAnimationFrame(scanReqRef.current);
        scanReqRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast({
          title: "Camera Active",
          description: "Point camera at your foot and click to mark pressure points",
        });
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please allow camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // also stop scanning
      setIsScanning(false);
      if (scanReqRef.current) {
        cancelAnimationFrame(scanReqRef.current);
        scanReqRef.current = null;
      }
      toast({
        title: "Camera Stopped",
        description: "Camera has been turned off",
      });
    }
  };

  const analyzeFrame = () => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    let process = processCanvasRef.current;
    if (!video || !overlay) {
      scanReqRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    // prepare canvases
    overlay.width = vw;
    overlay.height = vh;
    if (!processCanvasRef.current) {
      processCanvasRef.current = document.createElement('canvas');
    }
    process = processCanvasRef.current;
    process.width = vw;
    process.height = vh;
    const pctx = process.getContext('2d');
    const octx = overlay.getContext('2d');
    if (!pctx || !octx) {
      scanReqRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }
    pctx.drawImage(video, 0, 0, vw, vh);
    const frame = pctx.getImageData(0, 0, vw, vh);
    let minX = vw, minY = vh, maxX = -1, maxY = -1, count = 0;
    const step = 3; // sample every 3px for performance
    for (let y = 0; y < vh; y += step) {
      for (let x = 0; x < vw; x += step) {
        const i = (y * vw + x) * 4;
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        let match = false;
        if (targetType === 'cardboard') {
          // brownish: warm tones, lower blue
          match = r > 90 && g > 60 && b < 80 && r > g && r - b > 30;
        } else {
          // aluminum: bright neutral (low saturation, high lightness)
          const bright = r > 180 && g > 180 && b > 180;
          const nearEqual = Math.abs(r - g) < 18 && Math.abs(r - b) < 18 && Math.abs(g - b) < 18;
          match = bright && nearEqual;
        }
        if (match) {
          count++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const area = (vw * vh) / (step * step);
    const conf = Math.min(100, Math.round((count / area) * 100));
    setDetectionConfidence(conf);
    // draw overlay
    octx.clearRect(0, 0, vw, vh);
    if (count > 800) {
      octx.strokeStyle = targetType === 'cardboard' ? '#d97706' : '#9ca3af';
      octx.lineWidth = 4;
      octx.shadowColor = targetType === 'cardboard' ? 'rgba(217,119,6,0.4)' : 'rgba(156,163,175,0.4)';
      octx.shadowBlur = 8;
      octx.strokeRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
    }
    scanReqRef.current = requestAnimationFrame(analyzeFrame);
  };

  const toggleScan = () => {
    if (!isCameraActive) {
      toast({ title: 'Camera Required', description: 'Please start the camera first', variant: 'destructive' });
      return;
    }
    setIsScanning(v => {
      const next = !v;
      if (next) {
        analyzeFrame();
      } else if (scanReqRef.current) {
        cancelAnimationFrame(scanReqRef.current);
        scanReqRef.current = null;
        setDetectionConfidence(0);
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          const octx = overlay.getContext('2d');
          if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
        }
      }
      return next;
    });
  };

  // Fetch latest footpad pressure data
  const { data: footpadData } = useQuery<FootpadPressure[]>({
    queryKey: ["/api/footpad-pressure"],
    retry: false,
  });

  // Save footpad pressure
  const savePressureMutation = useMutation({
    mutationFn: async (data: {
      foot: string;
      pressurePoints: PressurePoint[];
      averagePressure: number;
      maxPressure: number;
    }) => {
      await apiRequest("POST", "/api/footpad-pressure", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/footpad-pressure"] });
      toast({
        title: "Success",
        description: "Footpad pressure data saved successfully",
      });
      setPressurePoints([]);
      setIsRecording(false);
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
        description: "Failed to save footpad pressure data",
        variant: "destructive",
      });
    },
  });

  const handleVideoClick = (event: React.MouseEvent<HTMLVideoElement | HTMLDivElement>) => {
    if (!isRecording || !isCameraActive) {
      toast({
        title: "Not Ready",
        description: "Please start camera and recording first",
        variant: "destructive",
      });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Calculate pressure based on distance from center (simulating weight distribution)
    const centerX = 50;
    const centerY = 50;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const pressure = Math.max(20, Math.min(100, 100 - distance));
    
    const newPoint: PressurePoint = { x, y, pressure: Math.round(pressure) };
    setPressurePoints([...pressurePoints, newPoint]);
    
    toast({
      title: "Pressure Point Detected",
      description: `Position: (${x.toFixed(0)}%, ${y.toFixed(0)}%) | Pressure: ${Math.round(pressure)}`,
    });
  };

  const handleSave = () => {
    if (pressurePoints.length === 0) {
      toast({
        title: "No Data",
        description: "Please record at least one pressure point",
        variant: "destructive",
      });
      return;
    }

    const avgPressure = pressurePoints.reduce((sum, p) => sum + p.pressure, 0) / pressurePoints.length;
    const maxPressure = Math.max(...pressurePoints.map(p => p.pressure));

    savePressureMutation.mutate({
      foot: selectedFoot,
      pressurePoints,
      averagePressure: avgPressure,
      maxPressure: maxPressure,
    });
  };

  const handleReset = () => {
    setPressurePoints([]);
    setIsRecording(false);
    toast({
      title: "Reset",
      description: "Pressure points cleared",
    });
  };

  const getPressureColor = (pressure: number) => {
    if (pressure >= 80) return "bg-red-500";
    if (pressure >= 60) return "bg-orange-500";
    if (pressure >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const latestData = footpadData && footpadData.length > 0 ? footpadData[0] : null;

  return (
    <PageTransition>
      <div className="min-h-screen neuropad-bg pb-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 px-6 pt-8">
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-white shadow-native flex items-center justify-center native-active"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>
            </Link>
            <h1 className="text-headline neuropad-text-primary">Footpad Tracking</h1>
            <div className="w-11 h-11 rounded-2xl bg-pink-50 shadow-sm flex items-center justify-center">
              <Activity className="w-5 h-5 text-pink-500" />
            </div>
          </div>

          {/* Instructions */}
          <div className="px-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="native-card-elevated p-5 bg-gradient-to-r from-blue-50 to-yellow-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-title mb-3 neuropad-text-primary">
                    Footpad Pressure Tracking
                  </h3>
                  <ol className="text-sm neuropad-text-secondary space-y-1.5 font-medium">
                    <li>1. Select left or right foot</li>
                    <li>2. Click "Start Camera" to activate camera</li>
                    <li>3. Point camera at your foot clearly</li>
                    <li>4. Click "Manual Mode" to start recording</li>
                    <li>5. Tap on the camera feed to mark pressure points</li>
                    <li>6. Click "Save Data" to store to database</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-3 font-bold">
                    Tap anywhere on your foot to mark pressure points manually!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Foot Selection */}
          <div className="px-6 mb-8">
            <div className="flex gap-3">
              <motion.button
                onClick={() => setSelectedFoot('left')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-3.5 rounded-2xl font-bold shadow-native native-active ${
                  selectedFoot === 'left' ? 'neuropad-primary neuropad-text-primary shadow-primary/25' : 'bg-white border-2 border-primary neuropad-text-primary'
                }`}
                data-testid="button-select-left"
              >
                Left Foot
              </motion.button>
              <motion.button
                onClick={() => setSelectedFoot('right')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-3.5 rounded-2xl font-bold shadow-native native-active ${
                  selectedFoot === 'right' ? 'neuropad-primary neuropad-text-primary shadow-primary/25' : 'bg-white border-2 border-primary neuropad-text-primary'
                }`}
                data-testid="button-select-right"
              >
                Right Foot
              </motion.button>
            </div>
          </div>

          {/* Camera Feed */}
          <div className="px-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="native-card-elevated p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-title neuropad-text-primary">
                  {selectedFoot === 'left' ? 'Left' : 'Right'} Foot - Camera View
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isCameraActive ? 'text-green-600' : 'neuropad-text-secondary'}`}>
                    {isCameraActive ? '● Camera On' : '○ Camera Off'}
                  </span>
                  <span className={`text-sm font-bold ${isRecording ? 'text-red-500' : 'neuropad-text-secondary'}`}>
                  {isRecording ? '● Recording' : '○ Not Recording'}
                </span>
              </div>
            </div>
              
              {/* Camera View */}
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-4 border-primary">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onClick={handleVideoClick}
                  className={`w-full h-full object-cover ${
                    isRecording && isCameraActive ? 'cursor-crosshair' : 'cursor-not-allowed'
                  }`}
                  data-testid="camera-feed"
                />
                {/* Scan overlay */}
                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Pressure Points Overlay */}
                {pressurePoints.map((point, index) => (
                  <div
                    key={index}
                    className={`absolute w-8 h-8 rounded-full ${getPressureColor(point.pressure)} opacity-80 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    data-testid={`pressure-point-${index}`}
                  >
                    {point.pressure}
                  </div>
                ))}

                {/* Placeholder when camera is off */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm opacity-75">Camera is off. Click "Start Camera" to begin.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pressure Legend */}
              <div className="mt-5 flex justify-around text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                  <span className="neuropad-text-secondary font-medium">20-40</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                  <span className="neuropad-text-secondary font-medium">40-60</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                  <span className="neuropad-text-secondary font-medium">60-80</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="neuropad-text-secondary font-medium">80-100</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <p className="text-sm neuropad-text-secondary font-medium">Points</p>
                  <p className="text-xl font-bold neuropad-text-primary">{pressurePoints.length}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <p className="text-sm neuropad-text-secondary font-medium">Avg Pressure</p>
                  <p className="text-xl font-bold neuropad-text-primary">
                    {pressurePoints.length > 0
                      ? Math.round(pressurePoints.reduce((sum, p) => sum + p.pressure, 0) / pressurePoints.length)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Scan Status */}
              <div className="mt-4 px-4 py-3 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm neuropad-text-secondary font-medium">Target</p>
                  <p className="text-sm font-bold neuropad-text-primary capitalize">{targetType}</p>
                </div>
                <div>
                  <p className="text-sm neuropad-text-secondary font-medium">Confidence</p>
                  <p className="text-sm font-bold neuropad-text-primary">{detectionConfidence}%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Control Buttons */}
          <div className="px-6 mb-8 space-y-3">
            {/* Camera Control */}
            <motion.button
              onClick={isCameraActive ? stopCamera : startCamera}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-bold shadow-native-lg native-active flex items-center justify-center gap-2 ${
                isCameraActive ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-yellow-500/25'
              }`}
              data-testid="button-toggle-camera"
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-5 h-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Camera
                </>
              )}
            </motion.button>

            {/* Manual Recording Control */}
            <motion.button
              onClick={() => setIsRecording(!isRecording)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-bold shadow-native-lg native-active flex items-center justify-center gap-2 ${
                isRecording ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-yellow-500/25'
              }`}
              disabled={!isCameraActive}
              data-testid="button-toggle-recording"
            >
              <Activity className="w-5 h-5" />
              {isRecording ? 'Stop Manual Mode' : 'Manual Mode (Tap to Mark)'}
            </motion.button>

            {/* Scan Target Control */}
            <div className="flex gap-3">
              <motion.button
                onClick={toggleScan}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-3.5 rounded-2xl font-bold shadow-native native-active ${
                  isScanning ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25' : 'bg-white border-2 border-primary neuropad-text-primary'
                }`}
                disabled={!isCameraActive}
                data-testid="button-scan-target"
              >
              {isScanning ? 'Stop Scan' : 'Scan Target'}
              </motion.button>
              <div className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-primary flex items-center justify-center gap-2">
              <label className="text-sm font-bold neuropad-text-primary">Target:</label>
                <select
                  className="text-sm font-bold neuropad-text-primary bg-transparent"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as 'cardboard' | 'aluminum')}
                >
                <option value="cardboard">Cardboard</option>
                <option value="aluminum">Aluminum</option>
                </select>
              </div>
            </div>

            {/* Reset and Save */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 rounded-2xl bg-white border-2 border-primary neuropad-text-primary font-bold shadow-native native-active disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={pressurePoints.length === 0}
                data-testid="button-reset"
              >
                <RotateCw className="w-5 h-5" />
                Reset
              </motion.button>
              
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 rounded-2xl neuropad-primary font-bold shadow-native shadow-primary/25 native-active disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={pressurePoints.length === 0 || savePressureMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-5 h-5" />
                {savePressureMutation.isPending ? 'Saving...' : 'Save Data'}
              </motion.button>
            </div>
          </div>

          {/* Latest Reading */}
          {latestData && (
            <div className="px-6 mb-8">
              <h3 className="text-headline mb-5 neuropad-text-primary">Latest Reading</h3>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="native-card-elevated p-5"
              >
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-sm neuropad-text-secondary font-medium">Foot</p>
                    <p className="font-bold neuropad-text-primary capitalize">{latestData.foot}</p>
                  </div>
                  <div>
                    <p className="text-sm neuropad-text-secondary font-medium">Avg Pressure</p>
                    <p className="font-bold neuropad-text-primary">{latestData.averagePressure}</p>
                  </div>
                  <div>
                    <p className="text-sm neuropad-text-secondary font-medium">Max Pressure</p>
                    <p className="font-bold neuropad-text-primary">{latestData.maxPressure}</p>
                  </div>
                </div>
                <p className="text-xs neuropad-text-secondary mt-4 text-center font-medium">
                  {latestData.recordedAt ? new Date(latestData.recordedAt).toLocaleString() : ''}
                </p>
              </motion.div>
            </div>
          )}
        </div>

        <BottomNavigation currentPage="/footpad-tracking" />
      </div>
    </PageTransition>
  );
}
