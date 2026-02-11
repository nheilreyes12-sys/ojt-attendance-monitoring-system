import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; // Ensure this file exists
import { StudentPage } from './components/StudentPage';
import { AdminPage } from './components/AdminPage';
import { UserCircle, Shield, Activity, Zap, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion} from 'framer-motion';

// --- Sub-component: Admin Login ---
function AdminLogin({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message.toUpperCase());
      setLoading(false);
    }
    // Note: onAuthStateChange in App.js will handle the redirect
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-cyan-400 mb-6 transition-colors font-mono text-sm">
          <ArrowLeft size={16} /> BACK TO TERMINAL
        </button>

        <div className="bg-gray-900 border-2 border-gray-800 p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-4 border border-purple-500/20">
              <Shield className="size-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-tighter">Admin Auth</h2>
            <p className="text-gray-500 text-xs font-mono mt-1">DATABASE ENCRYPTION ACTIVE</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest ml-1">Admin Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ADMIN@SYSTEM.COM"
                className="w-full bg-black/50 border-2 border-gray-800 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border-2 border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>
            
            <motion.button
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin size-5" /> : 'INITIATE LOGIN'}
            </motion.button>

            {error && (
              <p className="text-center text-red-500 font-mono text-[10px] animate-pulse">
                {error}
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main App Component ---
// export default function App() {
//   const [currentPage, setCurrentPage] = useState('home');
//   const [session, setSession] = useState(null);
//   const [initializing, setInitializing] = useState(true);

//   // Check for session on mount and listen for changes
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setInitializing(false);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     setCurrentPage('home');
//   };

//   // Prevent flicker during session check
//   if (initializing) return null;

//   // Routing Logic
//   if (currentPage === 'student') {
//     return <StudentPage onBack={() => setCurrentPage('home')} />;
//   }

//   if (currentPage === 'admin') {
//     if (!session) {
//       return <AdminLogin onBack={() => setCurrentPage('home')} />;
//     }
//     return <AdminPage onBack={handleLogout} />;
//   }
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // NEW: State to hold database records
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [officeSSID, setOfficeSSID] = useState('Steerhub First Floor');

  // Check for session and setup listeners
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // NEW: Fetch data whenever the session changes or when Admin page is opened
  useEffect(() => {
    if (session) {
      fetchAttendance();
      
      // Optional: Set up real-time listener
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
          fetchAttendance();
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [session]);

// const fetchAttendance = async () => {
//     try {
//       // Gagamit tayo ng .select('*') para sigurado, 
//       // PERO siguraduhin na walang ibang code na naghahanap ng 'type' column.
//       const { data, error } = await supabase
//         .from('attendance_logs')
//         .select('*') 
//         .order('timestamp', { ascending: false });

//       if (error) {
//         // Ito ay magpapakita kung bakit nabibigo ang request
//         console.error('Supabase Query Error:', error.message);
//         return;
//       }

//       // Kapag successful ang fetch, mawawala na ang 'undefined' sa console
//       console.log("Successfully fetched records:", data.length);
//       setAttendanceRecords(data || []);
//     } catch (err) {
//       console.error('System Error:', err.message);
//     }
//   };

// Sa App.js
// Sa App.js o kung saan ka nag-fe-fetch ng data:
// Sa loob ng iyong function App() { ... }

// 1. Siguraduhin na ito ay nasa loob ng function App() { ... }
const fetchAttendance = async () => {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*') // Mahalaga ang asterisk para makuha ang task_accomplishment
      .order('timestamp', { ascending: false });

    if (error) throw error;

    if (data) {
      // I-map ang database columns (student_name, status) sa UI keys (name, type)
      const mappedData = data.map(record => ({
        id: record.id,
        name: record.student_name, // Mula sa Table Editor
        timestamp: record.timestamp,
        type: record.status === 'Time In' ? 'time-in' : 'time-out', // 'type' ang hanap ng UI mo
        studentId: record.student_id,
        task_accomplishment: record.task_accomplishment // Siguraduhing kasama ito!
      }));
      
      setAttendanceRecords(mappedData);
    }
  } catch (error) {
    console.error("Error fetching attendance:", error.message);
  }
};

// 2. Tawagin ito sa useEffect para mawala ang 'not defined' error sa Line 164/170
useEffect(() => {
  fetchAttendance();
}, []);

  const handleUpdateSSID = (newSSID) => {
    setOfficeSSID(newSSID);
    localStorage.setItem('officeSSID', newSSID);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('home');
  };

  if (initializing) return null;

  // Routing Logic
  if (currentPage === 'student') {
   return (
  <StudentPage 
    onBack={() => setCurrentPage('home')} 
    onRecordAdded={fetchAttendance} // Pass the fetch function down
  />
);
  }

  if (currentPage === 'admin') {
    if (!session) {
      return <AdminLogin onBack={() => setCurrentPage('home')} />;
    }
    // IMPORTANT: Pass the records and SSID here
    return (
      <AdminPage 
        records={attendanceRecords} 
        officeSSID={officeSSID} 
        onUpdateSSID={handleUpdateSSID}
        onBack={handleLogout} 
      />
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" animate={{ x: [0, 100, 0], y: [0, -100, 0] }} transition={{ duration: 20, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" animate={{ x: [0, -100, 0], y: [0, 100, 0] }} transition={{ duration: 15, repeat: Infinity }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-4xl mx-auto px-2">
        {/* Logo/Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6 relative" animate={{ boxShadow: ['0 0 30px rgba(6, 182, 212, 0.3)', '0 0 60px rgba(6, 182, 212, 0.5)', '0 0 30px rgba(6, 182, 212, 0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
            <Activity className="size-12 sm:size-16 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 sm:mb-3 font-mono px-4">
            OJT ATTENDANCE SYSTEM
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-mono px-4">SECURE DATABASE-BACKED TRACKING</p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap px-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/50 rounded-full">
              <Zap className="size-3 sm:size-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-mono text-cyan-400">v2.0-DB</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/50 rounded-full">
              <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-mono text-green-400">DATABASE CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div whileHover={{ scale: 1.02 }} className="relative group cursor-pointer" onClick={() => setCurrentPage('student')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6"><UserCircle className="size-10 sm:size-12 text-white" /></div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 sm:mb-3 font-mono">STUDENT PORTAL</h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4">Clock in/out using QR scan</p>
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-mono font-bold text-sm">ACCESS PORTAL →</div>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="relative group cursor-pointer" onClick={() => setCurrentPage('admin')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 sm:mb-6"><Shield className="size-10 sm:size-12 text-white" /></div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 sm:mb-3 font-mono">ADMIN PORTAL</h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4">{session ? 'Manage active session' : 'Login required to access logs'}</p>
                <div className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-mono font-bold text-sm">ACCESS PORTAL →</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="size-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-xs font-mono text-gray-400">
              {session ? `Logged in as Admin` : `Cloud Sync Active • Security V2`}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}