import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan } from 'lucide-react';
import { motion } from 'framer-motion';

export function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          scannerRef.current?.clear();
          setIsScanning(false);
        },
        (error) => {
          // Suppress continuous error messages
          console.log(error);
        }
      );

      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-md">
      {/* Tech border effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl blur-sm opacity-30"></div>
        <div className="relative bg-gray-900 rounded-xl overflow-hidden border-2 border-cyan-500/50">
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
        </div>
      </div>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Scan className="size-5 text-cyan-400" />
            </motion.div>
            <span className="text-sm font-mono text-cyan-400">Scanning for QR code...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
