import { useState, useEffect } from 'react';
import { QRScanner } from './QRScanner';
import { NetworkDetector } from './NetworkDetector';
import { WifiOff, UserCircle, LogIn, LogOut, Zap, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
// IMPORT SUPABASE CLIENT
import { supabase } from '../lib/supabaseClient'; 

export function StudentPage({ onBack }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [attendanceType, setAttendanceType] = useState('time-in');
  const [officeSSID, setOfficeSSID] = useState('Steerhub First Floor');
  const [isNetworkAuthorized, setIsNetworkAuthorized] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState('');

  // Load attendance records and office SSID from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('attendanceRecords');
    if (saved) {
      setAttendanceRecords(JSON.parse(saved));
    }
    
    const savedSSID = localStorage.getItem('officeSSID');
    if (savedSSID) {
      setOfficeSSID(savedSSID);
    }
  }, []);

  // === DEVICE / DAILY ATTENDANCE CHECK ===
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const hasDeviceTimedInToday = () => {
    return localStorage.getItem('device_attendance_date') === getTodayDate();
  };

  const markDeviceTimedInToday = () => {
    localStorage.setItem('device_attendance_date', getTodayDate());
  };

  const handleNetworkDetected = (isConnected, network) => {
    setIsNetworkAuthorized(isConnected);
    setDetectedNetwork(network);
  };

  const handleScanSuccess = async (decodedText) => {
    if (!studentName.trim()) {
      toast.error('Please enter your name first', {
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      setShowScanner(false);
      return;
    }

    // Check network authorization
    if (!isNetworkAuthorized) {
      toast.error('NETWORK ACCESS DENIED - Connected to: ' + detectedNetwork + ' - Required: ' + officeSSID, { 
        duration: 5000,
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      setShowScanner(false);
      return;
    }

    // ❌ BLOCK if device already timed in today
    if (attendanceType === 'time-in' && hasDeviceTimedInToday()) {
      toast.error('THIS DEVICE HAS ALREADY TIMED IN TODAY', {
        duration: 5000,
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      setShowScanner(false);
      return;
    }

    try {
      const qrData = JSON.parse(decodedText);
      
      // Validate QR code structure
      if (!qrData.sessionId || !qrData.type || qrData.type !== 'attendance_qr') {
        throw new Error('Invalid QR code format');
      }

      // === NEW: INSERT TO SUPABASE DATABASE ===
      const { error: dbError } = await supabase
        .from('attendance_logs')
        .insert([
          { 
            student_name: studentName, 
            student_id: qrData.sessionId, 
            status: attendanceType === 'time-in' ? 'Time In' : 'Time Out'
          }
        ]);

      if (dbError) throw dbError;

      // === UPDATE LOCAL UI ===
      const newRecord = {
        id: `${Date.now()}-${Math.random()}`,
        name: studentName,
        timestamp: Date.now(),
        type: attendanceType,
      };

      const updatedRecords = [...attendanceRecords, newRecord];
      setAttendanceRecords(updatedRecords);
      localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
      
      if (attendanceType === 'time-in') {
        markDeviceTimedInToday();
      }

      toast.success('ATTENDANCE RECORDED - ' + (attendanceType === 'time-in' ? 'TIME IN' : 'TIME OUT') + ' | ' + studentName, { 
        duration: 4000,
        className: 'bg-gray-900 text-white border border-cyan-500/50',
      });
      
      setShowScanner(false);
      setStudentName('');
    } catch (error) {
      console.error('Submission Error:', error.message);
      toast.error('ERROR: ' + error.message, {
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      setShowScanner(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

  const startScanning = () => {
    if (!studentName.trim()) {
      toast.error('Please enter your name first', {
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      return;
    }
    
    if (!isNetworkAuthorized) {
      toast.error('NETWORK NOT AUTHORIZED - Please connect to office WiFi first', {
        className: 'bg-gray-900 text-white border border-red-500/50',
      });
      return;
    }
    
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-x-hidden">
      <Toaster position="top-center" />
      
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group"
              >
                <ArrowLeft className="size-5" />
                <span className="font-mono text-sm hidden sm:inline">BACK</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                STUDENT PORTAL
              </h1>
              <UserCircle className="size-6 sm:size-8 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Network Status */}
            <NetworkDetector 
              officeSSID={officeSSID}
              onNetworkDetected={handleNetworkDetected}
            />

            {/* Main Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8">
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl"></div>

                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 relative"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(6, 182, 212, 0.3)',
                        '0 0 40px rgba(6, 182, 212, 0.5)',
                        '0 0 20px rgba(6, 182, 212, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <UserCircle className="size-10 sm:size-12 text-white" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 font-mono">
                    {'>'}  RECORD ATTENDANCE
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm font-mono px-4">
                    Scan QR while connected to authorized network
                  </p>
                </div>

                {!showScanner ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-wider mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-white font-mono placeholder-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-wider mb-3">
                        Attendance Type
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <button
                          onClick={() => setAttendanceType('time-in')}
                          className={`relative overflow-hidden flex flex-col items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 transition-all ${
                            attendanceType === 'time-in'
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {attendanceType === 'time-in' && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20"
                              layoutId="activeType"
                            />
                          )}
                          <LogIn className="size-5 sm:size-6 relative z-10 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-mono font-bold relative z-10">TIME IN</span>
                        </button>
                        <button
                          onClick={() => setAttendanceType('time-out')}
                          className={`relative overflow-hidden flex flex-col items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 transition-all ${
                            attendanceType === 'time-out'
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {attendanceType === 'time-out' && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20"
                              layoutId="activeType"
                            />
                          )}
                          <LogOut className="size-5 sm:size-6 relative z-10 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-mono font-bold relative z-10">TIME OUT</span>
                        </button>
                      </div>
                    </div>

                    <motion.button
                      onClick={startScanning}
                      disabled={!isNetworkAuthorized}
                      whileHover={isNetworkAuthorized ? { scale: 1.02 } : {}}
                      whileTap={isNetworkAuthorized ? { scale: 0.98 } : {}}
                      className={`w-full relative overflow-hidden flex items-center justify-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-mono font-bold text-base sm:text-lg transition-all ${
                        isNetworkAuthorized
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                          : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                      }`}
                    >
                      {isNetworkAuthorized ? (
                        <>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                          />
                          <Zap className="size-5 sm:size-6 relative z-10 flex-shrink-0" />
                          <span className="relative z-10">SCAN QR CODE</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="size-5 sm:size-6 flex-shrink-0" />
                          <span>NETWORK REQUIRED</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <QRScanner
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                    />
                    <button
                      onClick={() => setShowScanner(false)}
                      className="w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-mono font-semibold border border-gray-700"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            {attendanceRecords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-20 blur"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 font-mono">
                    {'>'}  RECENT ACTIVITY
                  </h3>
                  <div className="space-y-2">
                    {attendanceRecords
                      .slice(-3)
                      .reverse()
                      .map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              record.type === 'time-in' 
                                ? 'bg-cyan-500/10 border border-cyan-500/50' 
                                : 'bg-orange-500/10 border border-orange-500/50'
                            }`}>
                              {record.type === 'time-in' ? (
                                <LogIn className="size-4 text-cyan-400" />
                              ) : (
                                <LogOut className="size-4 text-orange-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white font-mono">
                                {record.name}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {new Date(record.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className={`text-xs font-mono font-bold ${
                            record.type === 'time-in' ? 'text-cyan-400' : 'text-orange-400'
                          }`}>
                            {record.type === 'time-in' ? '→ IN' : '← OUT'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}