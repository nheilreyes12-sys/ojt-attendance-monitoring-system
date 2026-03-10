// ============================================================
//  StudentPage.js — UPDATED: Overtime toggle added
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { QRScanner } from './QRScanner';
import { NetworkDetector } from './NetworkDetector';
import { UserCircle, LogIn, LogOut, Zap, ArrowLeft, CheckCircle2, ClipboardList, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function StudentPage({ student, officeSSID: propSSID, onBack, onViewHistory }) {
  const isProcessing = useRef(false);
  const [showScanner, setShowScanner]               = useState(false);
  const [dailyTask, setDailyTask]                   = useState('');
  const [attendanceType, setAttendanceType]         = useState('time-in');
  const [isNetworkAuthorized, setIsNetworkAuthorized] = useState(false);
  const [officeSSID, setOfficeSSID]                 = useState(propSSID || 'Steerhub First Floor');
  const [attendanceStatus, setAttendanceStatus]     = useState('none');
  const [loadingStatus, setLoadingStatus]           = useState(true);

  // ── OVERTIME STATE ─────────────────────────────────────
  // isOvertime: toggled by student before Time In
  // isOvertimeLocked: true once Time In is recorded with overtime ON
  //                   prevents unchecking after Time In
  const [isOvertime, setIsOvertime]           = useState(false);
  const [isOvertimeLocked, setIsOvertimeLocked] = useState(false);

  useEffect(() => {
    if (propSSID) setOfficeSSID(propSSID);
  }, [propSSID]);

  // ── Fetch today's attendance status + overtime flag ────
  useEffect(() => {
    const fetchStatus = async () => {
      if (!student?.id) return;
      try {
        const res  = await fetch(`${API}/api/attendance/status/${student.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('ojt_token')}` },
        });
        const data = await res.json();
        if (data.success) {
          setAttendanceStatus(data.status);

          // If already timed in with overtime today, restore + lock the toggle
          if (data.is_overtime) {
            setIsOvertime(true);
            setIsOvertimeLocked(true);
          }
        }
      } catch (err) {
        console.warn('Could not fetch attendance status:', err.message);
        const today = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem(`attendance_status_${today}`);
        if (saved) setAttendanceStatus(saved);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, [student?.id]);

  const handleNetworkDetected = (isConnected) => {
    setIsNetworkAuthorized(isConnected);
  };

  // ── Handle overtime toggle ─────────────────────────────
  const handleOvertimeToggle = () => {
    // Cannot uncheck once Time In is recorded with overtime
    if (isOvertimeLocked) {
      toast.error('OVERTIME LOCKED: Cannot uncheck after Time In is recorded.');
      return;
    }
    setIsOvertime(prev => !prev);
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      const qrData      = JSON.parse(decodedText);
      const statusLabel = attendanceType === 'time-in' ? 'Time In' : 'Time Out';

      const res  = await fetch(`${API}/api/attendance/log`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${localStorage.getItem('ojt_token')}`,
        },
        body: JSON.stringify({
          student_id:          student.id,
          student_name:        student.full_name,
          status:              statusLabel,
          task_accomplishment: attendanceType === 'time-in'
            ? 'Ongoing...'
            : (dailyTask.trim() || 'No task reported'),
          is_overtime:         isOvertime,   // Send overtime flag to backend
          qr_session_id:       qrData.sessionId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (attendanceType === 'time-in') {
        setAttendanceStatus('timed-in');
        // Lock overtime toggle once Time In is recorded
        if (isOvertime) setIsOvertimeLocked(true);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_status_${today}`, 'timed-in');
      } else {
        setAttendanceStatus('completed');
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_status_${today}`, 'completed');
      }

      toast.success(`SUCCESS: ${statusLabel} recorded.${isOvertime ? ' (Overtime)' : ''}`);
      setShowScanner(false);

      if (attendanceType === 'time-out') setDailyTask('');

    } catch (error) {
      toast.error(error.message || 'Invalid QR Code or System Error');
      setShowScanner(false);
    } finally {
      setTimeout(() => { isProcessing.current = false; }, 3000);
    }
  };

  const startScanning = () => {
    if (!isNetworkAuthorized) return toast.error('NETWORK NOT AUTHORIZED');

    if (attendanceType === 'time-in') {
      if (attendanceStatus === 'timed-in' || attendanceStatus === 'completed') {
        return toast.error('ALREADY TIMED IN: You can only Time In once per day.');
      }
    }

    if (attendanceType === 'time-out') {
      if (attendanceStatus === 'none') {
        return toast.error('ACTION DENIED: You must Time In first.');
      }
      if (attendanceStatus === 'completed') {
        return toast.error('ALREADY COMPLETED: You have already Timed Out for today.');
      }
      if (!dailyTask.trim()) {
        return toast.error('Task accomplishment is required for Time Out.');
      }
    }

    setShowScanner(true);
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Zap className="size-8 text-cyan-400 animate-pulse mx-auto" />
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Loading attendance status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors font-mono text-xs">
            <ArrowLeft size={18} /> LOGOUT
          </button>
          <h1 className="text-xl font-black tracking-tighter text-cyan-400 font-mono">STUDENT PORTAL</h1>
          <div className="flex items-center gap-2">
            {/* History button */}
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 transition-all"
            >
              <History size={14} className="text-cyan-400" />
              <span className="font-mono text-[10px] text-gray-300 uppercase hidden sm:inline">History</span>
            </button>
            <div className="size-8 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center">
              <UserCircle size={18} className="text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        <NetworkDetector officeSSID={officeSSID} onNetworkDetected={handleNetworkDetected} />

        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          <div className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-all ${
            attendanceStatus !== 'none' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}>
            STEP 1: TIME IN {attendanceStatus !== 'none' && '✓'}
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-all ${
            attendanceStatus === 'completed' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}>
            STEP 2: TIME OUT {attendanceStatus === 'completed' && '✓'}
          </div>
          {/* Show overtime badge if active */}
          {isOvertime && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full text-[10px] font-mono border bg-yellow-500/20 border-yellow-500 text-yellow-400"
            >
              ⚡ OVERTIME
            </motion.div>
          )}
        </div>

        {/* Main card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Shift complete overlay */}
          {attendanceStatus === 'completed' && (
            <div className="absolute inset-0 bg-gray-900/90 z-10 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
              <CheckCircle2 className="size-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-black font-mono">SHIFT COMPLETE</h2>
              {isOvertime && (
                <div className="mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                  <span className="text-xs font-mono text-yellow-400">⚡ Overtime recorded</span>
                </div>
              )}
              <p className="text-gray-400 text-sm mt-2">
                You have recorded your attendance for today,{' '}
                <span className="text-cyan-400">{student?.full_name}</span>.
              </p>
              <button onClick={onBack} className="mt-6 text-xs text-cyan-500 underline uppercase tracking-widest">
                Return Home
              </button>
            </div>
          )}

          {!showScanner ? (
            <div className="space-y-6">

              {/* Student identity */}
              <div className="bg-black/50 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <UserCircle size={16} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Logged in as</p>
                  <p className="text-sm font-bold font-mono text-white">{student?.full_name}</p>
                </div>
                <div className="ml-auto px-2 py-1 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-[10px] font-mono text-gray-500">Code: <span className="text-cyan-400">{student?.student_code}</span></p>
                </div>
              </div>

              {/* ── OVERTIME TOGGLE ─────────────────────────────── */}
              {/* Only shown on Time In and when not yet timed in */}
              <AnimatePresence>
                {attendanceType === 'time-in' && attendanceStatus === 'none' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                      isOvertime
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-800 bg-black/30 hover:border-gray-700'
                    }`}
                    onClick={handleOvertimeToggle}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border transition-all ${
                          isOvertime
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-gray-800 border-gray-700'
                        }`}>
                          <Clock size={16} className={isOvertime ? 'text-yellow-400' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold font-mono transition-colors ${
                            isOvertime ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            OVERTIME
                          </p>
                          <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                            {isOvertime
                              ? 'Time Out will count past 5:00 PM'
                              : 'Tap to enable — Time Out capped at 5:00 PM'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        isOvertime ? 'bg-yellow-500' : 'bg-gray-700'
                      }`}>
                        <motion.div
                          animate={{ x: isOvertime ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                        />
                      </div>
                    </div>

                    {isOvertime && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-mono text-yellow-500/70 mt-3 border-t border-yellow-500/20 pt-2"
                      >
                        ⚠ Once you Time In with Overtime, this cannot be unchecked.
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Show locked overtime badge after Time In */}
              {isOvertimeLocked && attendanceStatus === 'timed-in' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <Clock size={14} className="text-yellow-400" />
                  <p className="text-xs font-mono text-yellow-400">
                    ⚡ Overtime active — Time Out will count past 5:00 PM
                  </p>
                </div>
              )}

              {/* Task Accomplishment */}
              <div>
                <label className="flex items-center text-[10px] font-mono text-gray-500 uppercase mb-2">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList size={11} /> Task Accomplishment
                  </span>
                </label>
                <textarea
                  value={dailyTask}
                  onChange={(e) => setDailyTask(e.target.value)}
                  placeholder="Describe today's tasks..."
                  className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 font-mono text-sm focus:border-orange-500 outline-none min-h-[100px] resize-none"
                />
              </div>

              {/* Time In / Time Out toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAttendanceType('time-in')}
                  className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    attendanceType === 'time-in' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-gray-800 text-gray-600'
                  }`}
                >
                  <LogIn size={20} />
                  <span className="text-[10px] font-bold font-mono">TIME IN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceType('time-out')}
                  className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    attendanceType === 'time-out' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-800 text-gray-600'
                  }`}
                >
                  <LogOut size={20} />
                  <span className="text-[10px] font-bold font-mono">TIME OUT</span>
                </button>
              </div>

              {/* Scan button */}
              <button
                onClick={startScanning}
                className="w-full bg-white text-black py-4 rounded-2xl font-black font-mono flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors"
              >
                <Zap size={18} fill="black" />
                SCAN ATTENDANCE
                {isOvertime && <span className="text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full ml-1">OT</span>}
              </button>

            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border-2 border-cyan-500">
                <QRScanner onScanSuccess={handleScanSuccess} onScanError={(e) => console.log(e)} />
              </div>
              <button onClick={() => setShowScanner(false)} className="w-full py-3 text-gray-500 font-mono text-xs uppercase">
                Cancel Scan
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}