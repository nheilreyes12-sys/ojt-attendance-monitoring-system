// ============================================================
//  AdminPage.js — OJT Attendance Monitoring System
//  MIGRATION: Supabase → MySQL + Node.js Backend
//  All old Supabase code kept as comments for reference
// ============================================================

import { useState } from 'react';
import { AdminPanel } from './AdminPanel';
import { Shield, ArrowLeft, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

// ============================================================
//  OLD SUPABASE IMPORT (kept for reference)
//  import { supabase } from '../lib/supabaseClient';
// ============================================================

// ============================================================
//  OLD: AdminPage had its own fetch + real-time subscription.
//  This caused a DUPLICATE fetch issue since App.js was also
//  fetching attendance independently.
//
//  NEW: AdminPage is now a "dumb" component — it receives
//  records, officeSSID, and onUpdateSSID as props from App.js.
//  All fetching is centralized in App.js (polled every 30s).
//
//  OLD props: { onBack }
//  NEW props: { records, officeSSID, onUpdateSSID, onBack, session }
// ============================================================

export function AdminPage({ records, officeSSID, onUpdateSSID, onBack, session }) {

  // ============================================================
  //  OLD: AdminPage had its own local state for records + SSID
  //
  //  const [attendanceRecords, setAttendanceRecords] = useState([]);
  //  const [officeSSID, setOfficeSSID] = useState('Steerhub First Floor');
  // ============================================================

  // ============================================================
  //  OLD: fetchSupabaseLogs — fetched directly from Supabase
  //
  //  const fetchSupabaseLogs = async () => {
  //    const { data, error } = await supabase
  //      .from('attendance_logs')
  //      .select('*')
  //      .order('timestamp', { ascending: false });
  //
  //    if (error) {
  //      console.error('Error fetching logs:', error);
  //    } else {
  //      const formattedData = data.map(log => ({
  //        id: log.id,
  //        name: log.student_name,
  //        timestamp: new Date(log.timestamp).getTime(),
  //        type: log.status === 'Time In' ? 'time-in' : 'time-out',
  //        studentId: log.student_id,
  //        task_accomplishment: log.task_accomplishment
  //      }));
  //      setAttendanceRecords(formattedData);
  //    }
  //  };
  //
  //  NEW: fetchAttendance() lives in App.js
  //       GET /api/attendance/all with admin JWT
  //       polled every 30 seconds via setInterval
  // ============================================================

  // ============================================================
  //  OLD: useEffect with Supabase fetch + real-time subscription
  //
  //  useEffect(() => {
  //    fetchSupabaseLogs();
  //
  //    const savedSSID = localStorage.getItem('officeSSID');
  //    if (savedSSID) setOfficeSSID(savedSSID);
  //
  //    // REAL-TIME SUBSCRIPTION
  //    const channel = supabase
  //      .channel('realtime_attendance')
  //      .on('postgres_changes',
  //        { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
  //        (payload) => {
  //          console.log('New log detected!', payload);
  //          fetchSupabaseLogs();
  //        }
  //      )
  //      .subscribe();
  //
  //    return () => { supabase.removeChannel(channel); };
  //  }, []);
  //
  //  NEW: No useEffect needed here. App.js handles:
  //       - initial fetch on admin login
  //       - 30-second polling interval
  //       - passing records down as props
  // ============================================================

  // ============================================================
  //  OLD: handleUpdateSSID saved to localStorage only
  //
  //  const handleUpdateSSID = (newSSID) => {
  //    setOfficeSSID(newSSID);
  //    localStorage.setItem('officeSSID', newSSID);
  //  };
  //
  //  NEW: onUpdateSSID comes from App.js which calls
  //       PUT /api/settings/ssid to save in MySQL
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-x-hidden">
      <Toaster position="top-center" />

      {/* Animated grid background — unchanged */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated gradient orbs — unchanged */}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">

              {/* OLD: ArrowLeft + "BACK" → NEW: LogOut + "LOGOUT" */}
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="size-4" />
                <span className="font-mono text-sm hidden sm:inline">LOGOUT</span>
              </button>

              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                ADMIN PANEL
              </h1>

              {/* OLD: just Shield icon — NEW: shows admin email */}
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Admin</p>
                  <p className="text-xs font-bold font-mono text-purple-400">
                    {session?.email || 'Administrator'}
                  </p>
                </div>
                <Shield className="size-6 sm:size-7 text-purple-400" />
              </div>

            </div>
          </div>
        </div>

        {/* Content — now uses props instead of local state */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <AdminPanel
            records={records}
            officeSSID={officeSSID}
            onUpdateSSID={onUpdateSSID}
          />
        </div>

      </div>
    </div>
  );
}