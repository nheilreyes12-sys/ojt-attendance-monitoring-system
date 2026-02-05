import { useState } from 'react';
import { StudentPage } from './components/StudentPage';
import { AdminPage } from './components/AdminPage';
import { UserCircle, Shield, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  if (currentPage === 'student') {
    return <StudentPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'admin') {
    return <AdminPage onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">
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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-2"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6 relative"
            animate={{
              boxShadow: [
                '0 0 30px rgba(6, 182, 212, 0.3)',
                '0 0 60px rgba(6, 182, 212, 0.5)',
                '0 0 30px rgba(6, 182, 212, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="size-12 sm:size-16 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 sm:mb-3 font-mono px-4">
            OJT ATTENDANCE SYSTEM
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-mono px-4">SECURE NETWORK-BASED TRACKING</p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap px-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/50 rounded-full">
              <Zap className="size-3 sm:size-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-mono text-cyan-400">v2.0</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/50 rounded-full">
              <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-mono text-green-400">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Student Portal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => setCurrentPage('student')}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 group-hover:border-cyan-500/50 p-6 sm:p-8 transition-all">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl"></div>
              
              <div className="text-center">
                <motion.div
                  className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-4 sm:mb-6"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <UserCircle className="size-10 sm:size-12 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 sm:mb-3 font-mono">
                  STUDENT PORTAL
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4 sm:mb-6">
                  Record your attendance by scanning QR codes
                </p>
                <div className="space-y-2 text-left text-xs sm:text-sm font-mono text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span>Scan QR Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span>Time In / Time Out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
                    <span>View Recent Activity</span>
                  </div>
                </div>
                <motion.div
                  className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-mono font-bold text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ACCESS PORTAL →
                </motion.div>
              </div>

              {/* Scan line effect */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>

          {/* Admin Portal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="relative group cursor-pointer"
            onClick={() => setCurrentPage('admin')}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 group-hover:border-purple-500/50 p-6 sm:p-8 transition-all">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-t-2 border-l-2 border-purple-500/50 rounded-tl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 border-b-2 border-r-2 border-purple-500/50 rounded-br-2xl"></div>
              
              <div className="text-center">
                <motion.div
                  className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 sm:mb-6"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Shield className="size-10 sm:size-12 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 sm:mb-3 font-mono">
                  ADMIN PORTAL
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-mono mb-4 sm:mb-6">
                  Manage attendance and generate QR codes
                </p>
                <div className="space-y-2 text-left text-xs sm:text-sm font-mono text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span>Generate QR Codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span>View All Records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span>Configure Network</span>
                  </div>
                </div>
                <motion.div
                  className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-mono font-bold text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ACCESS PORTAL →
                </motion.div>
              </div>

              {/* Scan line effect */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="size-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-xs font-mono text-gray-400">
              No login required • Automatic network detection
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}