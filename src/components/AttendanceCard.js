import { format } from 'date-fns';
import { Calendar, Clock, User, LogIn, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function AttendanceCard({ record, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative group"
    >
      {/* Glowing border effect */}
      <div className={`absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        record.type === 'time-in' 
          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 blur' 
          : 'bg-gradient-to-r from-orange-500 to-pink-500 blur'
      }`}></div>
      
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 hover:border-cyan-500/50 transition-all">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Avatar with tech effect */}
            <div className={`relative p-2 sm:p-3 rounded-lg flex-shrink-0 ${
              record.type === 'time-in' 
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50' 
                : 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/50'
            }`}>
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                {record.type === 'time-in' ? (
                  <LogIn className="size-4 sm:size-5 text-cyan-400" />
                ) : (
                  <LogOut className="size-4 sm:size-5 text-orange-400" />
                )}
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="size-3 sm:size-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-white text-sm sm:text-base truncate">{record.name}</span>
                <Zap className="size-3 text-yellow-400 flex-shrink-0" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3 text-cyan-400 flex-shrink-0" />
                  <span>{format(record.timestamp, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 text-purple-400 flex-shrink-0" />
                  <span>{format(record.timestamp, 'hh:mm:ss a')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex-shrink-0 ${
            record.type === 'time-in' 
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' 
              : 'bg-orange-500/10 text-orange-400 border-orange-500/50'
          }`}>
            {record.type === 'time-in' ? '→ IN' : '← OUT'}
          </div>
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
  );
}