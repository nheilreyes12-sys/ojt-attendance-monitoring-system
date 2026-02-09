import { useEffect, useState, useCallback, useRef } from 'react';
import { Wifi, WifiOff, Signal, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function NetworkDetector({ officeSSID, onNetworkDetected }) {
  const [isConnected, setIsConnected] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  
  // Use a ref to track the last state to prevent UI flickering
  const lastStatus = useRef(false);

  // Detect network
  const detectNetwork = useCallback(async () => {
    setIsScanning(true);

    // ✅ LOCAL DEV BYPASS
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.'); // Allow local network testing

    if (isLocalhost) {
      setDetectedNetwork(`${officeSSID} (LOCAL DEV)`);
      updateStatus(true, officeSSID);
      setIsScanning(false);
      return;
    }

    try {
      const nav = navigator;
      const connection =
        nav.connection || nav.mozConnection || nav.webkitConnection;

      if (connection) {
        setConnectionType(
          connection.effectiveType || connection.type || 'unknown'
        );
      }

      const localIP = await getLocalIP();
      
      // If we can't get an IP (common on secure desktop browsers), 
      // we check if we were previously connected to avoid flickering
      // OR we look for the specific office subnet
      const isOfficeNetwork = localIP && (
        localIP.startsWith('192.168.0.') || 
        localIP.startsWith('192.168.1.') // Added common secondary subnet
      );

      if (isOfficeNetwork) {
        setDetectedNetwork(officeSSID);
        updateStatus(true, officeSSID);
      } else {
        // On laptops, getLocalIP often returns null or an mDNS string (.local)
        // If it's null but connection is stable, we might be on a secure browser
        const networkName = localIP
          ? `Network (${localIP})`
          : 'Restricted Network (Secure Browser)';

        setDetectedNetwork(networkName);
        updateStatus(false, networkName);
      }
    } catch (error) {
      console.error('Network detection error:', error);
      updateStatus(false, 'Detection Error');
    }

    setIsScanning(false);
  }, [officeSSID, onNetworkDetected, updateStatus]);

  // Helper to prevent redundant state updates that cause flickering
  const updateStatus = useCallback((status, name) => {
  if (lastStatus.current !== status) {
    lastStatus.current = status;
    setIsConnected(status);
    onNetworkDetected(status, name);
  }
}, [onNetworkDetected]);

  useEffect(() => {
    detectNetwork();
    // Increase interval slightly to 8s to give WebRTC time to resolve on laptops
    const interval = setInterval(detectNetwork, 8000);
    return () => clearInterval(interval);
  }, [detectNetwork]);

  // WebRTC local IP (best-effort only)
  const getLocalIP = () => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ 
        iceServers: [],
        // Laptop browsers need this to prioritize local candidates
        iceCandidatePoolSize: 10 
      });
      
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (!ice?.candidate?.candidate) {
          pc.close();
          resolve(null);
          return;
        }

        // Match standard IPv4
        const match = ice.candidate.candidate.match(
          /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        );

        if (match?.[1]) {
          pc.close();
          resolve(match[1]);
        } 
        // Handle mDNS (e.g., 4f23...local) which is common on laptops
        else if (ice.candidate.candidate.includes(".local")) {
           // We can't see the IP, but we detected a local candidate
           // On some laptops, this is the only info we get
           pc.close();
           resolve("mDNS/Local");
        }
      };

      // Desktop browsers often take longer to gather ICE candidates
      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 4000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border-2 p-3 sm:p-4 transition-colors duration-500 ${
        isConnected
          ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/50'
          : 'bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-500/50'
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          {isScanning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Signal className="size-5 text-cyan-400" />
            </motion.div>
          ) : isConnected ? (
            <Wifi className="size-5 text-cyan-400" />
          ) : (
            <WifiOff className="size-5 text-red-400" />
          )}

          <div>
            <div className="text-xs font-mono text-gray-400">
              Network Status
            </div>
            <div
              className={`text-sm font-semibold ${
                isConnected ? 'text-cyan-400' : 'text-red-400'
              }`}
            >
              {isScanning
                ? 'Scanning...'
                : isConnected
                ? 'Connected'
                : 'Not Authorized'}
            </div>
          </div>

          {isConnected && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/50">
              <Zap className="size-3 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400">
                SECURE
              </span>
            </div>
          )}
        </div>

        <div className="text-xs space-y-1 font-mono">
  <div className="text-gray-300">
    Detected Network:{' '}
    <span className="text-cyan-300 font-bold">
      {detectedNetwork || '—'}
    </span>
  </div>
  <div className="text-gray-300">
    Required Network:{' '}
    <span className="text-purple-300 font-bold">{officeSSID}</span>
  </div>
  {connectionType && (
    <div className="text-gray-400">
      Connection Type:{' '}
      <span className="text-blue-400 uppercase">
        {connectionType}
      </span>
    </div>
  )}
</div>
      </div>
    </motion.div>
  );
}