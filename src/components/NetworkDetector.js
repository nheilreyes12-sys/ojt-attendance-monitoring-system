import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Signal, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function NetworkDetector({ officeSSID, onNetworkDetected }) {
  const [isConnected, setIsConnected] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  // Detect network
  const detectNetwork = useCallback(async () => {
    setIsScanning(true);

    // ✅ LOCAL DEV BYPASS
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      setDetectedNetwork(`${officeSSID} (LOCAL DEV)`);
      setIsConnected(true);
      onNetworkDetected(true, officeSSID);
      setIsScanning(false);
      return;
    }

    // Best-effort client-side detection (non-secure)
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
      const isOfficeNetwork =
        localIP && localIP.startsWith('192.168.0.');

      if (isOfficeNetwork) {
        setDetectedNetwork(officeSSID);
        setIsConnected(true);
        onNetworkDetected(true, officeSSID);
      } else {
        const networkName = localIP
          ? `Network (${localIP})`
          : 'Unknown Network';

        setDetectedNetwork(networkName);
        setIsConnected(false);
        onNetworkDetected(false, networkName);
      }
    } catch (error) {
      console.error('Network detection error:', error);
      setDetectedNetwork('Unknown Network');
      setIsConnected(false);
      onNetworkDetected(false, 'Unknown Network');
    }

    setIsScanning(false);
  }, [officeSSID, onNetworkDetected]);

 useEffect(() => {
  detectNetwork();
  const interval = setInterval(detectNetwork, 5000);
  return () => clearInterval(interval);
}, [detectNetwork]);

  // WebRTC local IP (best-effort only)
  const getLocalIP = () => {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (!ice?.candidate?.candidate) {
          pc.close();
          resolve(null);
          return;
        }

        const match = ice.candidate.candidate.match(
          /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        );

        if (match?.[1]) {
          pc.close();
          resolve(match[1]);
        }
      };

      setTimeout(() => {
        pc.close();
        resolve(null);
      }, 3000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border-2 p-3 sm:p-4 ${
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
          <div>
            Detected Network:{' '}
            <span className="text-cyan-400">
              {detectedNetwork || '—'}
            </span>
          </div>
          <div>
            Required Network:{' '}
            <span className="text-purple-400">{officeSSID}</span>
          </div>
          {connectionType && (
            <div>
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
