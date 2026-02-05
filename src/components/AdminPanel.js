import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Download, RefreshCw, Users, Settings, Database, Activity, Zap } from 'lucide-react';
import { AttendanceCard } from './AttendanceCard';
import { motion } from 'framer-motion';


export function AdminPanel({ records, officeSSID, onUpdateSSID }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessionId] = useState(() => `SESSION-${Date.now().toString(36).toUpperCase()}`);
  const [isEditingSSID, setIsEditingSSID] = useState(false);
  const [tempSSID, setTempSSID] = useState(officeSSID);

const generateQRCode = useCallback(async () => {
  try {
    const qrData = JSON.stringify({
      sessionId,
      timestamp: Date.now(),
      type: 'attendance_qr',
    });

    const url = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#06b6d4',
        light: '#0f172a',
      },
    });

    setQrCodeUrl(url);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
}, [sessionId]);


useEffect(() => {
  generateQRCode();
}, [generateQRCode]);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `attendance-qr-${sessionId}.png`;
    link.click();
  };

  const handleSaveSSID = () => {
    onUpdateSSID(tempSSID);
    setIsEditingSSID(false);
  };

  const todayRecords = records.filter(r => {
    const today = new Date();
    const recordDate = new Date(r.timestamp);
    return recordDate.toDateString() === today.toDateString();
  });

  const timeInCount = todayRecords.filter(r => r.type === 'time-in').length;
  const timeOutCount = todayRecords.filter(r => r.type === 'time-out').length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Records', value: records.length, icon: Database, color: 'from-cyan-500 to-blue-500' },
          { label: 'Today Time In', value: timeInCount, icon: Activity, color: 'from-green-500 to-emerald-500' },
          { label: 'Today Time Out', value: timeOutCount, icon: Zap, color: 'from-orange-500 to-pink-500' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative group"
          >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-xl opacity-30 group-hover:opacity-50 blur transition-opacity`}></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <stat.icon className="size-6 sm:size-8 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 lg:p-8">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl"></div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 sm:mb-6 font-mono">
            {'>'}  QR CODE GENERATOR
          </h2>
          
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-full max-w-xs lg:max-w-none lg:w-auto">
              {/* Animated glow */}
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-20 blur-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative bg-gray-950 p-4 sm:p-6 rounded-xl border-2 border-cyan-500/50 mx-auto">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Attendance QR Code" className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg mx-auto" />
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="space-y-3">
                <p className="text-gray-300 font-mono text-xs sm:text-sm leading-relaxed">
                  Students must scan this QR code while connected to the authorized office network to record their attendance.
                </p>
                <div className="bg-gray-950 border border-cyan-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 bg-cyan-400 rounded-full animate-pulse flex-shrink-0"></div>
                    <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Active Session</p>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-white break-all">
                    ID: <span className="text-cyan-400">{sessionId}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadQR}
                  className="relative group/btn flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-mono font-semibold overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <Download className="size-4 relative z-10 flex-shrink-0" />
                  <span className="relative z-10 text-sm sm:text-base">DOWNLOAD</span>
                </button>
                <button
                  onClick={generateQRCode}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-mono font-semibold border border-gray-600"
                >
                  <RefreshCw className="size-4 flex-shrink-0" />
                  <span className="text-sm sm:text-base">REGENERATE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Settings className="size-5 sm:size-6 text-purple-400 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
              {'>'}  NETWORK CONFIGURATION
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 uppercase tracking-wider mb-3">
                Authorized WiFi SSID
              </label>
              {isEditingSSID ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={tempSSID}
                    onChange={(e) => setTempSSID(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-950 border border-cyan-500/50 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white font-mono text-sm sm:text-base"
                    placeholder="Enter WiFi SSID"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSSID}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all font-mono font-semibold text-sm sm:text-base"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSSID(false);
                        setTempSSID(officeSSID);
                      }}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-mono font-semibold text-sm sm:text-base"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg">
                    <code className="text-cyan-400 font-mono text-base sm:text-lg break-all">{officeSSID}</code>
                  </div>
                  <button
                    onClick={() => setIsEditingSSID(true)}
                    className="px-4 sm:px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-mono font-semibold border border-gray-600 text-sm sm:text-base"
                  >
                    EDIT
                  </button>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-500 font-mono">
                → Only devices connected to this network can submit attendance records
              </p>
              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <p className="text-xs text-cyan-400 font-mono mb-2">
                  ⓘ Network Detection Info
                </p>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">
                  System automatically detects devices on the 192.168.0.x subnet using WebRTC. 
                  Students must be connected to "{officeSSID}" WiFi network to mark attendance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Attendance Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="size-6 text-green-400" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
                {'>'}  ATTENDANCE LOGS
              </h2>
            </div>
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/50 rounded-lg">
              <span className="text-green-400 font-mono font-semibold">{records.length} TOTAL</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-gray-800 rounded-full mb-4 border border-gray-700">
                  <Users className="size-16 text-gray-600" />
                </div>
                <p className="text-gray-500 font-mono">NO RECORDS FOUND</p>
                <p className="text-gray-600 text-sm font-mono mt-2">Waiting for attendance data...</p>
              </div>
            ) : (
              records
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((record, index) => (
                  <AttendanceCard key={record.id} record={record} index={index} />
                ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}