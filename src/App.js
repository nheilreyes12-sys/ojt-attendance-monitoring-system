// ============================================================
//  App.js — OJT Attendance Monitoring System
//  MIGRATION: Supabase → MySQL + Node.js Backend
//  All old Supabase code kept as comments for reference
// ============================================================

import { useState, useEffect } from 'react';
import { StudentPage } from './components/StudentPage';
import { StudentHistory } from './components/StudentHistory';
import { AdminPage } from './components/AdminPage';
import LoginPage from './components/LoginPage';
import { UserCircle, Shield, Activity, Zap, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ── API base URL (set REACT_APP_API_URL in your .env) ──
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ============================================================
//  OLD SUPABASE IMPORT (kept for reference)
//  import { supabase } from './lib/supabaseClient';
// ============================================================

// ============================================================
//  OLD AdminLogin sub-component (kept for reference)
//  This was the old Supabase-based admin login screen.
//  It is now replaced by the unified <LoginPage /> component
//  which handles both admin (email) and student (5-digit code).
//
// function AdminLogin({ onBack }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//
//   const handleAuth = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//
//     // OLD: Supabase auth login
//     const { error } = await supabase.auth.signInWithPassword({
//       email: email,
//       password: password,
//     });
//
//     // NEW: replaced by POST /api/admin/login in LoginPage.js
//     // const res = await fetch(`${API}/api/admin/login`, {
//     //   method: 'POST',
//     //   headers: { 'Content-Type': 'application/json' },
//     //   body: JSON.stringify({ email, password }),
//     // });
//
//     if (error) {
//       setError(error.message.toUpperCase());
//       setLoading(false);
//     }
//     // Note: onAuthStateChange in App.js will handle the redirect
//   };
//
//   return ( ... ) // full JSX removed, see LoginPage.js
// }
// ============================================================

// ============================================================
//  OLD App function v1 (first Supabase version — kept for reference)
//
// export default function App() {
//   const [currentPage, setCurrentPage] = useState('home');
//   const [session, setSession] = useState(null);
//   const [initializing, setInitializing] = useState(true);
//
//   // OLD: Check Supabase session on mount and listen for changes
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setInitializing(false);
//     });
//
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });
//
//     return () => subscription.unsubscribe();
//   }, []);
//
//   const handleLogout = async () => {
//     await supabase.auth.signOut(); // OLD: Supabase logout
//     setCurrentPage('home');
//   };
//
//   // Prevent flicker during session check
//   if (initializing) return null;
//
//   // Routing Logic
//   if (currentPage === 'student') {
//     return <StudentPage onBack={() => setCurrentPage('home')} />;
//   }
//
//   if (currentPage === 'admin') {
//     if (!session) {
//       return <AdminLogin onBack={() => setCurrentPage('home')} />;
//     }
//     return <AdminPage onBack={handleLogout} />;
//   }
// }
// ============================================================

// ============================================================
//  OLD fetchAttendance v1 (kept for reference)
//
// const fetchAttendance = async () => {
//   try {
//     // Gagamit tayo ng .select('*') para sigurado,
//     // PERO siguraduhin na walang ibang code na naghahanap ng 'type' column.
//     const { data, error } = await supabase
//       .from('attendance_logs')
//       .select('*')
//       .order('timestamp', { ascending: false });
//
//     if (error) {
//       console.error('Supabase Query Error:', error.message);
//       return;
//     }
//
//     console.log("Successfully fetched records:", data.length);
//     setAttendanceRecords(data || []);
//   } catch (err) {
//     console.error('System Error:', err.message);
//   }
// };
// ============================================================

// ============================================================
//  OLD fetchAttendance v2 with column mapping (kept for reference)
//
// const fetchAttendance = async () => {
//   try {
//     const { data, error } = await supabase
//       .from('attendance_logs')
//       .select('*') // Mahalaga ang asterisk para makuha ang task_accomplishment
//       .order('timestamp', { ascending: false });
//
//     if (error) throw error;
//
//     if (data) {
//       // I-map ang database columns (student_name, status) sa UI keys (name, type)
//       const mappedData = data.map(record => ({
//         id: record.id,
//         name: record.student_name,       // Mula sa Table Editor
//         timestamp: record.timestamp,
//         type: record.status === 'Time In' ? 'time-in' : 'time-out',
//         studentId: record.student_id,
//         task_accomplishment: record.task_accomplishment
//       }));
//
//       setAttendanceRecords(mappedData);
//     }
//   } catch (error) {
//     console.error("Error fetching attendance:", error.message);
//   }
// };
//
// // Tawagin ito sa useEffect para mawala ang 'not defined' error
// useEffect(() => {
//   fetchAttendance();
// }, []);
// ============================================================

// ============================================================
//  OLD real-time Supabase subscription (kept for reference)
//  NEW: polling every 30s via fetchAttendance interval below
//
// useEffect(() => {
//   if (session) {
//     fetchAttendance();
//
//     const channel = supabase
//       .channel('schema-db-changes')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
//         fetchAttendance();
//       })
//       .subscribe();
//
//     return () => supabase.removeChannel(channel);
//   }
// }, [session]);
// ============================================================

// ── NEW: Token helpers ─────────────────────────────────
const getStoredSession = () => {
  const token = localStorage.getItem('ojt_token');
  const role  = localStorage.getItem('ojt_role');
  if (!token || !role) return null;

  // Basic JWT expiry check (decode payload without verifying signature)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      // Token expired — clear storage
      localStorage.removeItem('ojt_token');
      localStorage.removeItem('ojt_role');
      localStorage.removeItem('ojt_student');
    localStorage.removeItem('ojt_expires_at'); // clear midnight timer
      return null;
    }
    return { token, role, ...payload };
  } catch {
    return null;
  }
};

// ── NEW: Main App Component ────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage]           = useState('home');
  const [session, setSession]                   = useState(null);       // { token, role, id, email, full_name? }
  const [initializing, setInitializing]         = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [officeSSID, setOfficeSSID]             = useState('Steerhub First Floor');

  // ── Listen for manual record add/edit from AdminPanel ──
  useEffect(() => {
    const handler = () => fetchAttendance();
    window.addEventListener('ojt-refresh', handler);
    return () => window.removeEventListener('ojt-refresh', handler);
  }, []);

  // ── On mount: restore session from localStorage ──────
  // OLD: supabase.auth.getSession() → now reads from localStorage JWT
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
      // Restore last page if token is still valid
      if (stored.role === 'admin') setCurrentPage('admin');
      if (stored.role === 'student') setCurrentPage('student');
    }
    setInitializing(false);
  }, []);

  // ── Auto-logout at midnight for student sessions ─────────
  // Schedules a timeout that fires exactly at midnight,
  // clears the session, and sends the student back to login.
  // Also runs on mount to handle page refreshes after midnight.
  useEffect(() => {
    if (session?.role !== 'student') return;

    const expiresAt = session.expiresAt
      || localStorage.getItem('ojt_expires_at');

    if (!expiresAt) return;

    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();

    if (msUntilExpiry <= 0) {
      // Already expired (e.g. page was left open past midnight)
      handleLogout();
      return;
    }

    // Schedule auto-logout at exactly midnight
    const timer = setTimeout(() => {
      alert('Your session has expired. Please log in again for today.');
      handleLogout();
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [session]);

  // ── Fetch SSID from backend (replaces localStorage SSID) ──
  useEffect(() => {
    const loadSSID = async () => {
      try {
        const res  = await fetch(`${API}/api/settings/ssid`);
        const data = await res.json();
        if (data.success) setOfficeSSID(data.ssid);
      } catch (err) {
        console.warn('Could not load SSID from server, using default.', err.message);
        // Fallback: try localStorage (old behavior)
        const saved = localStorage.getItem('officeSSID');
        if (saved) setOfficeSSID(saved);
      }
    };
    loadSSID();
  }, []);

  // ── Fetch attendance records from MySQL backend ───────
  // OLD: supabase.from('attendance_logs').select('*')
  // NEW: GET /api/attendance/all  (admin JWT required)
  const fetchAttendance = async () => {
    const token = localStorage.getItem('ojt_token');
    if (!token) return;

    try {
      const res  = await fetch(`${API}/api/attendance/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        console.error('Fetch attendance error:', data.message);
        return;
      }

      // Map MySQL columns → UI shape (same mapping as old Supabase version)
      const mappedData = data.records.map(record => ({
        id:                 record.id,
        name:               record.student_name,
        timestamp:          record.timestamp,
        type:               record.status === 'Time In' ? 'time-in' : 'time-out',
        studentId:          record.student_id,
        student_id:         record.student_id,
        status:             record.status,
        task_accomplishment: record.task_accomplishment,
        is_overtime:        record.is_overtime,
      }));

      setAttendanceRecords(mappedData);
    } catch (err) {
      console.error('Error fetching attendance:', err.message);
    }
  };

  // ── Auto-fetch when admin session is active ───────────
  // OLD: Supabase real-time .channel() subscription
  // NEW: fetch on mount + poll every 30 seconds
  useEffect(() => {
    if (session?.role === 'admin') {
      fetchAttendance();
      const interval = setInterval(fetchAttendance, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // ── Update SSID ───────────────────────────────────────
  // OLD: localStorage.setItem('officeSSID', newSSID)
  // NEW: PUT /api/settings/ssid  (persisted in MySQL)
  const handleUpdateSSID = async (newSSID) => {
    setOfficeSSID(newSSID);
    const token = localStorage.getItem('ojt_token');
    try {
      await fetch(`${API}/api/settings/ssid`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ ssid: newSSID }),
      });
    } catch (err) {
      console.warn('SSID update failed:', err.message);
      // Fallback: still save to localStorage like before
      localStorage.setItem('officeSSID', newSSID);
    }
  };

  // ── Login handlers (called from LoginPage) ────────────
  const handleAdminLogin = (token, admin) => {
    const sessionData = { token, role: 'admin', id: admin.id, email: admin.email };
    setSession(sessionData);
    setCurrentPage('admin');
  };

  const handleStudentLogin = (token, student, expiresAt) => {
    const sessionData = {
      token,
      role:         'student',
      id:           student.id,
      email:        student.email,
      full_name:    student.full_name,
      student_code: student.student_code,
      expiresAt,    // midnight tonight — used to schedule auto-logout
    };
    // Save expiresAt so auto-logout survives page refresh
    if (expiresAt) localStorage.setItem('ojt_expires_at', expiresAt);
    setSession(sessionData);
    setCurrentPage('student');
  };

  // ── Logout ────────────────────────────────────────────
  // OLD: await supabase.auth.signOut()
  // NEW: clear localStorage JWT (stateless — no server call needed)
  const handleLogout = () => {
    localStorage.removeItem('ojt_token');
    localStorage.removeItem('ojt_role');
    localStorage.removeItem('ojt_student');
    localStorage.removeItem('ojt_expires_at'); // clear midnight timer
    setSession(null);
    setAttendanceRecords([]);
    setCurrentPage('home');
  };

  // ── Prevent flicker on load ───────────────────────────
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400 size-8" />
      </div>
    );
  }

  // ── Routing Logic ─────────────────────────────────────

  // If no session → show unified Login page
  // OLD: if (currentPage === 'admin' && !session) return <AdminLogin ... />;
  // NEW: single LoginPage handles both admin and student login + enroll
  if (!session) {
    return (
      <LoginPage
        onAdminLogin={handleAdminLogin}
        onStudentLogin={handleStudentLogin}
      />
    );
  }

  // Student portal
  if (currentPage === 'student' && session?.role === 'student') {
    return (
      <StudentPage
        student={session}
        officeSSID={officeSSID}
        onBack={handleLogout}
        onViewHistory={() => setCurrentPage('history')}
      />
    );
  }

  // Student history page
  if (currentPage === 'history' && session?.role === 'student') {
    return (
      <StudentHistory
        student={session}
        onBack={() => setCurrentPage('student')}
      />
    );
  }

  // Admin portal
  if (currentPage === 'admin' && session?.role === 'admin') {
    return (
      <AdminPage
        records={attendanceRecords}
        officeSSID={officeSSID}
        onUpdateSSID={handleUpdateSSID}
        onBack={handleLogout}
        session={session}             // NEW: passed so AdminPage can show admin email in header
        // OLD: these records came from Supabase real-time subscription
        // NEW: fetched from GET /api/attendance/all, polled every 30s
      />
    );
  }

  // ── Home screen (shown after login if role is unclear) ─
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">

      {/* Background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }} transition={{ duration: 20, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }} transition={{ duration: 15, repeat: Infinity }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-2">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6 relative"
            animate={{ boxShadow: ['0 0 30px rgba(6,182,212,0.3)', '0 0 60px rgba(6,182,212,0.5)', '0 0 30px rgba(6,182,212,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="size-12 sm:size-16 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 sm:mb-3 font-mono px-4">
            OJT ATTENDANCE SYSTEM
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-mono px-4">SECURE DATABASE-BACKED TRACKING</p>

          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap px-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/50 rounded-full">
              <Zap className="size-3 sm:size-4 text-cyan-400" />
              {/* OLD: v2.0-DB (Supabase), NEW: v3.0-MySQL */}
              <span className="text-xs sm:text-sm font-mono text-cyan-400">v3.0-MySQL</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/50 rounded-full">
              <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-mono text-green-400">DATABASE CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Student Portal */}
          <motion.div whileHover={{ scale: 1.02 }} className="relative group cursor-pointer"
            onClick={() => session?.role === 'student' ? setCurrentPage('student') : handleLogout()}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6">
                  <UserCircle className="size-10 sm:size-12 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 sm:mb-3 font-mono">STUDENT PORTAL</h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4">Clock in/out using QR scan</p>
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-mono font-bold text-sm">ACCESS PORTAL →</div>
              </div>
            </div>
          </motion.div>

          {/* Admin Portal */}
          <motion.div whileHover={{ scale: 1.02 }} className="relative group cursor-pointer"
            onClick={() => session?.role === 'admin' ? setCurrentPage('admin') : handleLogout()}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 sm:mb-6">
                  <Shield className="size-10 sm:size-12 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 sm:mb-3 font-mono">ADMIN PORTAL</h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4">
                  {session?.role === 'admin' ? 'Manage active session' : 'Login required to access logs'}
                </p>
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-mono font-bold text-sm">ACCESS PORTAL →</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 flex items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="size-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-xs font-mono text-gray-400">
              {/* OLD: Cloud Sync Active • Security V2 */}
              {/* NEW: shows logged-in user info */}
              {session?.role === 'admin'
                ? `Admin: ${session.email}`
                : `Student: ${session?.full_name || session?.email}`}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-mono text-xs hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={12} /> LOGOUT
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}