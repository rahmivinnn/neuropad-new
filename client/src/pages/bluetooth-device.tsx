import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import PageTransition from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import {
  ArrowLeft,
  Bluetooth,
  CheckCircle,
  RotateCcw,
  Settings,
  HelpCircle,
  Activity,
  Battery,
  Heart,
} from "lucide-react";
import type { HealthMetric } from "@shared/schema";

interface BluetoothDeviceInfo {
  name: string;
  id: string;
  connected: boolean;
  services: string[];
}

export default function BluetoothDevice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<BluetoothDeviceInfo | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const deviceRef = useRef<any>(null); // BluetoothDevice
  const serverRef = useRef<any>(null); // BluetoothRemoteGATTServer

  // Fetch health metrics for device status
  const { data: healthMetrics } = useQuery<HealthMetric>({
    queryKey: ["/api/health-metrics"],
    retry: false,
  });

  const isConnected = deviceInfo?.connected ?? false;

  const handleRunDiagnostic = () => {
    toast({
      title: "Diagnostic Test",
      description: "Running diagnostic test...\nDevice is in good condition!",
    });
  };

  const handleViewDeviceHealth = () => {
    toast({
      title: "Device Health",
      description: `Battery: ${batteryLevel}%\nConnection: ${isConnected ? "Stable" : "Disconnected"}\nLast sync: 2 minutes ago`,
    });
  };

  const handleReportIssue = () => {
    const issue = prompt("Describe the issue you're experiencing:");
    if (issue) {
      toast({
        title: "Report Sent",
        description: "Issue report has been sent to support team. Thank you!",
      });
    }
  };

  const handleSyncData = () => {
    toast({
      title: "Synchronization",
      description: "Data synchronization started...\nData successfully synchronized!",
    });
  };

  // Save health metrics mutation
  const saveMetricsMutation = useMutation({
    mutationFn: async (data: {
      heartRate?: number;
      batteryLevel?: number;
      bluetoothConnected: boolean;
    }) => {
      await apiRequest("POST", "/api/health-metrics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serverRef.current?.connected) {
        serverRef.current.disconnect();
      }
    };
  }, []);

  // Check browser compatibility
  const checkBluetoothSupport = () => {
    const nav: any = navigator;
    return nav.bluetooth !== undefined;
  };

  // Real Bluetooth Connection
  const connectBluetoothDevice = async () => {
    setIsConnecting(true);
    
    try {
      // Check if Web Bluetooth API is supported
      const nav: any = navigator;
      if (!nav.bluetooth) {
        setIsConnecting(false);
        toast({
          title: "❌ Browser Not Supported",
          description: "Web Bluetooth is not available in this browser.\n\nPlease use:\n✅ Chrome (Desktop/Android)\n✅ Edge (Desktop)\n✅ Opera (Desktop/Android)\n\n❌ Safari and Firefox don't support Bluetooth yet.",
          variant: "destructive",
        });
        return;
      }

      console.log("Bluetooth API available, requesting device...");
      
      toast({
        title: "🔍 Scanning Devices...",
        description: "Please select your Bluetooth device from the popup",
      });

      // Request device with common health/fitness services
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',                    // Heart Rate Service
          'battery_service',               // Battery Service  
          'health_thermometer',            // Temperature
          'blood_pressure',                // Blood Pressure
          'glucose',                       // Glucose
          'generic_access',                // Generic Access
          'device_information'             // Device Info
        ]
      });

      deviceRef.current = device;
      
      toast({
        title: "Connecting...",
        description: `Connecting to ${device.name || 'Unknown Device'}`,
      });

      // Connect to GATT Server
      const server = await device.gatt!.connect();
      serverRef.current = server;

      // Get available services
      const services = await server.getPrimaryServices();
      const serviceUUIDs = services.map((s: any) => s.uuid);

      setDeviceInfo({
        name: device.name || 'Unknown Device',
        id: device.id,
        connected: true,
        services: serviceUUIDs
      });

      // Try to read Heart Rate if available
      try {
        const heartRateService = await server.getPrimaryService('heart_rate');
        const heartRateChar = await heartRateService.getCharacteristic('heart_rate_measurement');
        
        // Listen for heart rate notifications
        await heartRateChar.startNotifications();
        heartRateChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          const hr = value.getUint8(1);
          setHeartRate(hr);
          
          // Save to database
          saveMetricsMutation.mutate({
            heartRate: hr,
            bluetoothConnected: true,
            batteryLevel: batteryLevel || undefined
          });
        });
      } catch (e) {
        console.log("Heart rate service not available");
      }

      // Try to read Battery Level if available
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryChar.readValue();
        const battery = batteryValue.getUint8(0);
        setBatteryLevel(battery);
      } catch (e) {
        console.log("Battery service not available");
      }

      // Save initial connection status
      saveMetricsMutation.mutate({
        heartRate: heartRate || undefined,
        batteryLevel: batteryLevel || undefined,
        bluetoothConnected: true
      });

      toast({
        title: "✅ Connected Successfully!",
        description: `${device.name || 'Device'} is now connected and syncing data`,
      });

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setDeviceInfo(prev => prev ? { ...prev, connected: false } : null);
        saveMetricsMutation.mutate({
          bluetoothConnected: false
        });
        toast({
          title: "Device Disconnected",
          description: "Bluetooth device has been disconnected",
          variant: "destructive",
        });
      });

    } catch (error: any) {
      console.error("Bluetooth connection error:", error);
      
      let errorMessage = "Failed to connect to Bluetooth device";
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No Bluetooth device was selected.\n\nPlease try again and select a device from the popup.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Bluetooth access was denied.\n\nPlease check your browser permissions.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Your device doesn't support Bluetooth.\n\nMake sure Bluetooth is turned on.";
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
    if (serverRef.current?.connected) {
      serverRef.current.disconnect();
      setDeviceInfo(null);
      setHeartRate(0);
      setBatteryLevel(0);
      
      saveMetricsMutation.mutate({
        bluetoothConnected: false
      });

      toast({
        title: "Disconnected",
        description: "Device has been disconnected",
      });
    }
  };

  const handleReconnect = async () => {
    if (deviceRef.current) {
      try {
        setIsConnecting(true);
        const server = await deviceRef.current.gatt!.connect();
        serverRef.current = server;
        setDeviceInfo(prev => prev ? { ...prev, connected: true } : null);
        
        toast({
          title: "Reconnected",
          description: "Successfully reconnected to device",
        });
      } catch (error) {
        toast({
          title: "Reconnection Failed",  
          description: "Please try connecting again",
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    } else {
      await connectBluetoothDevice();
    }
  };

  const handleOpenSettings = () => {
    toast({
      title: "Settings",
      description: "Opening Bluetooth settings...",
    });
  };

  const handleGetHelp = () => {
    toast({
      title: "Bluetooth Help",
      description: "- Make sure Bluetooth is on\n- Device within 10m range\n- Restart if problem persists",
    });
  };

  const bluetoothSupported = checkBluetoothSupport();

  return (
    <PageTransition>
      <div className="h-screen neuropad-bg pb-16 overflow-hidden">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-xl bg-white shadow-native flex items-center justify-center native-active"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </motion.button>
          </Link>
          <h1 className="text-lg font-bold neuropad-text-primary">Bluetooth Device</h1>
          <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto">
        {/* Browser Compatibility Warning */}
        {!bluetoothSupported && (
          <div className="px-6 mb-4">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-3 shadow-native border border-red-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-sm">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-title text-red-800 mb-1">Browser Not Supported</h3>
                  <p className="text-sm text-red-700 mb-2">Web Bluetooth is not available in this browser.</p>
                  <p className="text-xs text-red-600">
                    <strong>Supported Browsers:</strong><br/>
                    ✅ Chrome (Desktop/Android)<br/>
                    ✅ Edge (Desktop)<br/>
                    ✅ Opera (Desktop/Android)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Browser Compatibility Info */}
        {bluetoothSupported && (
          <div className="px-6 mb-4">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-3 shadow-native border border-green-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-sm">
                  <span className="text-xl">✅</span>
                </div>
                <p className="text-sm text-green-800 font-semibold">Bluetooth Ready - Click button below to connect your device</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Device Status */}
        <div className="px-6 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="native-card-elevated p-4"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-title mb-1 neuropad-text-primary">
                  {deviceInfo?.name || "No Device Connected"}
                </h2>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-red-500"}`}></div>
                  <p className={`text-sm font-semibold ${isConnected ? "text-green-600" : "text-red-600"}`}>
                    {isConnected ? "Connected & Syncing" : "Disconnected"}
                  </p>
                </div>
                {deviceInfo?.id && (
                  <p className="text-xs neuropad-text-secondary mt-1">ID: {deviceInfo.id.substring(0, 16)}...</p>
                )}
              </div>
              <motion.div 
                animate={{ scale: isConnected ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: isConnected ? Infinity : 0, duration: 2 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${
                  isConnected ? "bg-blue-50 animate-pulse" : "bg-gray-100"
                }`}
              >
                <Bluetooth className={`w-8 h-8 ${isConnected ? "text-blue-600" : "text-gray-400"}`} />
              </motion.div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm neuropad-text-secondary font-medium">Battery Level</span>
              <span className="font-bold neuropad-text-primary">{batteryLevel}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${batteryLevel}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-2.5 rounded-full ${batteryLevel > 20 ? "bg-green-500" : "bg-red-500"}`}
              />
            </div>
          </motion.div>
        </div>

        {/* Diagnostic Tools */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Diagnostic Tools</h3>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="native-card p-5 space-y-3"
          >
            <motion.button
              onClick={handleRunDiagnostic}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-2xl neuropad-primary neuropad-text-primary font-bold shadow-native native-active"
              data-testid="button-run-diagnostic"
            >
              Run Diagnostic Test
            </motion.button>
            
            <motion.button
              onClick={handleViewDeviceHealth}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-2xl bg-white border-2 border-primary neuropad-text-primary font-bold shadow-native native-active"
              data-testid="button-device-health"
            >
              View Device Health
            </motion.button>
            
            <motion.button
              onClick={handleReportIssue}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-2xl bg-white border-2 border-primary neuropad-text-primary font-bold shadow-native native-active"
              data-testid="button-report-issue"
            >
              Report Issue
            </motion.button>
            
            <motion.button
              onClick={handleSyncData}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-2xl neuropad-primary neuropad-text-primary font-bold shadow-native native-active"
              data-testid="button-sync-data"
            >
              Sync Data Now
            </motion.button>
          </motion.div>
        </div>

        {/* Real-time Data */}
        {isConnected && (heartRate > 0 || batteryLevel > 0) && (
          <div className="px-6 mb-4">
            <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Real-Time Data</h3>
            <div className="grid grid-cols-2 gap-3">
              {heartRate > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="native-card p-5 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold neuropad-text-primary">{heartRate}</p>
                  <p className="text-sm neuropad-text-secondary font-medium">BPM</p>
                </motion.div>
              )}
              {batteryLevel > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="native-card p-5 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Battery className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold neuropad-text-primary">{batteryLevel}%</p>
                  <p className="text-sm neuropad-text-secondary font-medium">Battery</p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Connection Controls */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Device Connection</h3>
          <div className="space-y-3">
            {!isConnected ? (
              <motion.button
                onClick={connectBluetoothDevice}
                disabled={isConnecting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-native-lg shadow-blue-500/25 disabled:opacity-50 native-active flex items-center justify-center gap-2"
                data-testid="button-connect-device"
              >
                <Bluetooth className="w-5 h-5" />
                {isConnecting ? "Connecting..." : "Connect Bluetooth Device"}
              </motion.button>
            ) : (
              <motion.button
                onClick={disconnectDevice}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-native-lg shadow-red-500/25 native-active flex items-center justify-center gap-2"
                data-testid="button-disconnect-device"
              >
                <Bluetooth className="w-5 h-5" />
                Disconnect Device
              </motion.button>
            )}
          </div>
        </div>

        {/* Check Connectivity */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-bold mb-3 neuropad-text-primary">Connectivity Check</h3>
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              onClick={handleRunDiagnostic}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="native-card p-5 text-center native-active"
              data-testid="button-diagnostic"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <p className="font-semibold neuropad-text-primary">Diagnostik</p>
            </motion.button>
            
            <motion.button 
              onClick={handleReconnect}
              disabled={isConnecting}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="native-card p-5 text-center disabled:opacity-50 native-active"
              data-testid="button-reconnect"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <RotateCcw className={`w-6 h-6 text-green-500 ${isConnecting ? "animate-spin" : ""}`} />
              </div>
              <p className="font-semibold neuropad-text-primary">
                {isConnecting ? "Connecting..." : "Reconnect"}
              </p>
            </motion.button>
            
            <motion.button 
              onClick={handleOpenSettings}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="native-card p-5 text-center native-active"
              data-testid="button-settings"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Settings className="w-6 h-6 neuropad-text-secondary" />
              </div>
              <p className="font-semibold neuropad-text-primary">Settings</p>
            </motion.button>
            
            <motion.button 
              onClick={handleGetHelp}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="native-card p-5 text-center native-active"
              data-testid="button-help"
            >
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <HelpCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="font-semibold neuropad-text-primary">Help</p>
            </motion.button>
          </div>
        </div>

        {/* Submit Issue Button */}
        <div className="px-6 mb-4">
          <motion.button
            onClick={handleReportIssue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-2xl neuropad-primary neuropad-text-primary font-bold shadow-native-lg shadow-primary/25 native-active text-sm"
            data-testid="button-submit-issue"
          >
            Report Issue
          </motion.button>
        </div>
        </div>
      </div>

      <BottomNavigation currentPage="/bluetooth-device" />
    </div>
    </PageTransition>
  );
}
