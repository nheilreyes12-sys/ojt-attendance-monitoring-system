import { useState, useEffect } from 'react';
import { AdminPanel } from './AdminPanel';
import { Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
// Import the supabase client
import { supabase } from '../lib/supabaseClient';

export function AdminPage({ onBack }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [officeSSID, setOfficeSSID] = useState('Steerhub First Floor');

  // 1. Initial Data Fetch from Supabase
  const fetchSupabaseLogs = async () => {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      // Map database columns to the format your AdminPanel expects
      const formattedData = data.map(log => ({
        id: log.id,
        name: log.student_name,
        timestamp: new Date(log.timestamp).getTime(),
        type: log.status === 'Time In' ? 'time-in' : 'time-out',
        studentId: log.student_id,
        task_accomplishment: log.task_accomplishment
      }));
      setAttendanceRecords(formattedData);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSupabaseLogs();

    // Load office SSID
    const savedSSID = localStorage.getItem('officeSSID');
    if (savedSSID) {
      setOfficeSSID(savedSSID);
    }

    // 2. REAL-TIME SUBSCRIPTION
    // This listens for any "INSERT" on the attendance_logs table
    const channel = supabase
      .channel('realtime_attendance')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, 
        (payload) => {
          console.log('New log detected!', payload);
          // Refresh the list when a new record is added
          fetchSupabaseLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateSSID = (newSSID) => {
    setOfficeSSID(newSSID);
    localStorage.setItem('officeSSID', newSSID);
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors group"
              >
                <ArrowLeft className="size-5" />
                <span className="font-mono text-sm hidden sm:inline">BACK</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                ADMIN PANEL
              </h1>
              <Shield className="size-6 sm:size-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <AdminPanel 
            records={attendanceRecords}
            officeSSID={officeSSID}
            onUpdateSSID={handleUpdateSSID}
          />
        </div>
      </div>
    </div>
  );
}