// ============================================================
//  NetworkDetector.js — OJT Attendance Monitoring System
//  FIXED: WebRTC IP detection was returning null due to
//  browser privacy settings blocking RTCPeerConnection.
//
//  NEW APPROACH: Ask the backend server to detect the client's
//  IP address instead. The backend reads req.ip which is
//  always accurate regardless of browser settings.
// ============================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { Wifi, WifiOff, Signal, Zap } from "lucide-react";
import { motion } from "framer-motion";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Office network IP prefix — Steerhub First Floor router
const OFFICE_IP_PREFIX = "192.168.0.";

export function NetworkDetector({ officeSSID, onNetworkDetected }) {
  const [isConnected, setIsConnected]         = useState(false);
  const [detectedIP, setDetectedIP]           = useState("");
  const [isScanning, setIsScanning]           = useState(true);

  const lastStatus = useRef(null);

  const updateStatus = useCallback((status, ip) => {
    setIsConnected(status);
    setDetectedIP(ip || "");
    if (lastStatus.current !== status) {
      lastStatus.current = status;
      if (onNetworkDetected) onNetworkDetected(status);
    }
  }, [onNetworkDetected]);

  const detectNetwork = useCallback(async () => {
    setIsScanning(true);
    try {
      // Ask backend to return the client's real IP
      // Backend reads req.ip which bypasses browser restrictions
      const res  = await fetch(`${API}/api/network/check`);
      const data = await res.json();
      const ip   = data.ip || "";

      const isOfficeNetwork = ip.startsWith(OFFICE_IP_PREFIX);
      updateStatus(isOfficeNetwork, ip);

    } catch (err) {
      console.error("Network detection error:", err);
      updateStatus(false, "Error reaching server");
    }
    setIsScanning(false);
  }, [officeSSID, updateStatus]);

  useEffect(() => {
    detectNetwork();
    const interval = setInterval(detectNetwork, 8000);
    return () => clearInterval(interval);
  }, [detectNetwork]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl border-2 p-4 transition-colors duration-500 ${
        isConnected
          ? "border-cyan-500 bg-cyan-500/10"
          : "border-red-500 bg-red-500/10"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {isScanning ? (
          <Signal className="text-cyan-400 animate-spin size-5" />
        ) : isConnected ? (
          <Wifi className="text-cyan-400 size-5" />
        ) : (
          <WifiOff className="text-red-400 size-5" />
        )}

        <div>
          <div className="text-xs font-mono text-gray-400">Network Status</div>
          <div className={`font-semibold font-mono text-sm ${
            isConnected ? "text-cyan-400" : "text-red-400"
          }`}>
            {isScanning
              ? "Scanning..."
              : isConnected
              ? "Authorized ✓"
              : "Not Authorized"}
          </div>
        </div>

        {isConnected && (
          <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
            <Zap className="size-3 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400">SECURE</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs font-mono text-gray-400">
          Required: <span className="text-purple-300">{officeSSID}</span>
        </div>
        <div className="text-xs font-mono text-gray-500">
          Your IP:{" "}
          <span className={isConnected ? "text-cyan-300" : "text-red-400"}>
            {detectedIP || "Checking..."}
          </span>
        </div>
        {!isConnected && !isScanning && (
          <div className="text-[10px] font-mono text-red-500 mt-1">
            ⚠ Connect to "{officeSSID}" WiFi to continue
          </div>
        )}
      </div>
    </motion.div>
  );
}