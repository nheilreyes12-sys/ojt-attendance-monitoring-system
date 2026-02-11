import { useState, useEffect, useRef } from 'react';
import { QRScanner } from './QRScanner';
import { NetworkDetector } from './NetworkDetector';
import { WifiOff, UserCircle, LogIn, LogOut, Zap, ArrowLeft, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
// IMPORT SUPABASE CLIENT
import { supabase } from '../lib/supabaseClient'; 

export function StudentPage({ onBack }) {
  const isProcessing = useRef(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [studentName, setStudentName] = useState('');
  // NEW: State for daily task accomplishment
  const [dailyTask, setDailyTask] = useState('');
  const [attendanceType, setAttendanceType] = useState('time-in');
  const [officeSSID, setOfficeSSID] = useState('Steerhub First Floor');
  const [isNetworkAuthorized, setIsNetworkAuthorized] = useState(false);
  // const [detectedNetwork, setDetectedNetwork] = useState('');

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
    // setDetectedNetwork(network);
  };

  

const handleScanSuccess = async (decodedText) => {
  if (isProcessing.current) return;
  isProcessing.current = true;

  if (!studentName.trim()) {
    toast.error('Please enter your name first');
    setShowScanner(false);
    isProcessing.current = false;
    return;
  }

  try {
    const qrData = JSON.parse(decodedText);
    
    // 1. DATABASE INSERT (Laging bagong row)
    // 1. I-check kung ano ang sinesend natin
console.log("SENDING TO DB:", { student_name: studentName, task_accomplishment: dailyTask });

const { data, error: dbError } = await supabase
  .from('attendance_logs')
  .insert([{ 
  student_name: studentName, 
  student_id: qrData.sessionId, 
  status: attendanceType === 'time-in' ? 'Time In' : 'Time Out',
  task_accomplishment: attendanceType === 'time-in' 
      ? 'Ongoing...' 
      : (dailyTask || 'No task reported'),
  timestamp: new Date().toISOString()
}])
  .select('*');

// 2. TINGNAN KUNG MAY ERROR
if (dbError) {
  console.error("SUPABASE INSERT ERROR:", dbError.message);
  return; // Hihinto rito ang code kung may error
}

// 3. TINGNAN KUNG MAY BALIK NA DATA
if (!data || data.length === 0) {
  console.log("No data returned from Supabase");
  return;
}

console.log("SUCCESS! Data from DB:", data[0]);

    // 2. SUCCESS LOGIC
    if (attendanceType === 'time-in') {
      markDeviceTimedInToday();
    }

const dbRecord = data[0];
console.log("FULL DB RECORD FROM SUPABASE:", dbRecord);

const newRecord = {
  id: dbRecord.id,
  name: dbRecord.student_name,
  timestamp: dbRecord.timestamp,
  type: dbRecord.status === 'Time In' ? 'time-in' : 'time-out',
  studentId: dbRecord.student_id,
  
  // ✅ DITO MAGIGING 'DEFINED' ANG TASK VALUE MO
  task_accomplishment: dbRecord.task_accomplishment 
};

// I-verify sa console: Dapat may task_accomplishment na dito
console.log("New Record Debug:", newRecord); 

setAttendanceRecords(prev => {
  const updated = [newRecord, ...prev].slice(0, 10);

  localStorage.setItem('attendanceRecords', JSON.stringify(updated));

  return updated;
});



    
    toast.success(`SUCCESS: ${attendanceType.toUpperCase()} recorded.`, {
      id: `success-${Date.now()}` 
    });
    
    setShowScanner(false);

    if (attendanceType === 'time-out') {
      setStudentName('');
      setDailyTask(''); 
    }

  } catch (error) {
    toast.error(error.message);
    setShowScanner(false);
  } finally {
    setTimeout(() => { isProcessing.current = false; }, 3000);
  }
};

  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

const startScanning = () => {
    if (!studentName.trim()) {
      toast.error('Please enter your name first');
      return;
    }
    if (attendanceType === 'time-out' && !dailyTask.trim()) {
      toast.error('Task accomplishment is required for Time Out');
      return;
    }
    if (!isNetworkAuthorized) {
      toast.error('NETWORK NOT AUTHORIZED');
      return;
    }

    // REMOVED: isProcessing.current = false; (Let the handler manage the lock)
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
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
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
                    {'>'}  RECORD ATTENDANCE
                  </h2>
                </div>

                {!showScanner ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Name Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-wider mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-950 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-white font-mono placeholder-gray-600"
                      />
                    </div>

                    {/* NEW: Task Accomplishment Field */}
                    <div>
                      <label className="flex justify-between items-center text-xs sm:text-sm font-mono text-gray-400 uppercase tracking-wider mb-2">
                        <span>Daily Task Accomplishment</span>
                        {!hasDeviceTimedInToday() && (
                          <span className="text-[10px] text-orange-500 lowercase opacity-70">Enables after Time In</span>
                        )}
                      </label>
                      <div className="relative">
                        <textarea
                          value={dailyTask}
                          onChange={(e) => setDailyTask(e.target.value)}
                          disabled={!hasDeviceTimedInToday()}
                          placeholder={hasDeviceTimedInToday() ? "What did you work on today?" : "Field locked until Time In recorded."}
                          rows={3}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-950 border rounded-lg outline-none text-white font-mono transition-all duration-300 ${
                            hasDeviceTimedInToday() 
                            ? 'border-gray-700 focus:ring-2 focus:ring-purple-500 border-purple-500/30' 
                            : 'border-gray-800 opacity-40 cursor-not-allowed'
                          }`}
                        />
                        <ClipboardList className={`absolute right-3 bottom-3 size-5 ${hasDeviceTimedInToday() ? 'text-purple-400' : 'text-gray-700'}`} />
                      </div>
                    </div>

                    {/* Attendance Type Buttons */}
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
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20" layoutId="activeType" />
                          )}
                          <LogIn className="size-5 sm:size-6 relative z-10" />
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
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20" layoutId="activeType" />
                          )}
                          <LogOut className="size-5 sm:size-6 relative z-10" />
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
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                      }`}
                    >
                      {isNetworkAuthorized ? (
                        <>
                          <Zap className="size-5 sm:size-6 relative z-10" />
                          <span className="relative z-10">SCAN QR CODE</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="size-5 sm:size-6" />
                          <span>NETWORK REQUIRED</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-20 blur"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 font-mono">
                    {'>'}  RECENT ACTIVITY
                  </h3>
                  <div className="space-y-2">
                    {attendanceRecords.slice(-3).reverse().map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${record.type === 'time-in' ? 'bg-cyan-500/10 border border-cyan-500/50' : 'bg-orange-500/10 border border-orange-500/50'}`}>
                            {record.type === 'time-in' ? <LogIn className="size-4 text-cyan-400" /> : <LogOut className="size-4 text-orange-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white font-mono">{record.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{new Date(record.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className={`text-xs font-mono font-bold ${record.type === 'time-in' ? 'text-cyan-400' : 'text-orange-400'}`}>
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