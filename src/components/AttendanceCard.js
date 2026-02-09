import { Calendar, User, LogIn, LogOut, Zap, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

export function AttendanceCard({ record, index }) {
  // Check if time data exists from the grouped record
  const hasTimeIn = !!record.timeIn;
  const hasTimeOut = !!record.timeOut;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative group mb-4"
    >
      {/* Dynamic Glowing Border */}
      <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 blur"></div>
      
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-all">
        
        {/* Header: Name and Date */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-700/50 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <User className="size-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-none uppercase tracking-tight">
                {record.student_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-gray-400">
                <Calendar className="size-3 text-purple-400" />
                <span>{record.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/20">
            <Zap className="size-3 text-yellow-500" />
            <span className="text-[10px] font-bold text-yellow-500 uppercase">Daily Session</span>
          </div>
        </div>

        {/* Times Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Time In Box */}
          <div className={`p-3 rounded-lg border transition-colors ${hasTimeIn ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              <LogIn className={`size-3 ${hasTimeIn ? 'text-cyan-400' : 'text-gray-600'}`} />
              <span className="text-[10px] font-mono uppercase text-gray-500">Time In</span>
            </div>
            <div className={`text-sm font-black font-mono ${hasTimeIn ? 'text-cyan-400' : 'text-gray-400'}`}>
              {record.timeIn || '--:-- --'}
            </div>
          </div>

          {/* Time Out Box */}
          <div className={`p-3 rounded-lg border transition-colors ${hasTimeOut ? 'bg-orange-500/5 border-orange-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-1">
              <LogOut className={`size-3 ${hasTimeOut ? 'text-orange-400' : 'text-gray-600'}`} />
              <span className="text-[10px] font-mono uppercase text-gray-500">Time Out</span>
            </div>
            <div className={`text-sm font-black font-mono ${hasTimeOut ? 'text-orange-400' : 'text-gray-400'}`}>
              {record.timeOut || '--:-- --'}
            </div>
          </div>
        </div>

        {/* Task Section */}
        <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
          <div className="flex items-center gap-2 mb-1.5">
            <ClipboardList className="size-3 text-purple-400" />
            <span className="text-[10px] font-mono uppercase text-gray-500">Task Accomplishment</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "{record.task}"
          </p>
        </div>

        {/* Animated Scan Line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}