// ============================================================
//  AttendanceCard.js — UPDATED: Admin inline edit support
// ============================================================

import { useState } from 'react';
import { Calendar, User, LogIn, LogOut, Zap, ClipboardList, Clock, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function AttendanceCard({ record, index, onRecordUpdated }) {
  const hasTimeIn  = !!record.timeIn  && record.timeIn  !== '--:-- --';
  const hasTimeOut = !!record.timeOut && record.timeOut !== '--:-- --';
  const isOT       = record.is_overtime;
  const hasHours   = hasTimeIn && hasTimeOut && parseFloat(record.totalHours) > 0;

  // ── Edit state ────────────────────────────────────────
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);

  // Convert "08:30 AM" → "08:30" for time input
  const toInputTime = (timeStr) => {
    if (!timeStr || timeStr === '--:-- --') return '';
    try {
      const [time, period] = timeStr.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } catch { return ''; }
  };

  const [editTimeIn,   setEditTimeIn]   = useState(toInputTime(record.timeIn));
  const [editTimeOut,  setEditTimeOut]  = useState(toInputTime(record.timeOut));
  const [editTask,     setEditTask]     = useState(record.task_accomplishment || '');
  const [editOvertime, setEditOvertime] = useState(!!isOT);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('ojt_token');

      // Extract YYYY-MM-DD from rawDate (Date object) or fallback to record.date string
      let date;
      if (record.rawDate instanceof Date) {
        const d = record.rawDate;
        date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      } else {
        date = new Date(record.rawDate || record.date).toISOString().split('T')[0];
      }

      // Get student_id from record
      const student_id = record.studentId || record.student_id;
      if (!student_id) {
        console.error('Record missing studentId:', record);
        throw new Error('Student ID not found on record.');
      }

      const res  = await fetch(`${API}/api/attendance/${date}/student/${student_id}`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          time_in:             editTimeIn,
          time_out:            editTimeOut,
          task_accomplishment: editTask,
          is_overtime:         editOvertime,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success('Record updated successfully.');
      setIsEditing(false);
      if (onRecordUpdated) onRecordUpdated(); // trigger re-fetch in AdminPanel
    } catch (err) {
      toast.error(err.message || 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditTimeIn(toInputTime(record.timeIn));
    setEditTimeOut(toInputTime(record.timeOut));
    setEditTask(record.task_accomplishment || '');
    setEditOvertime(!!isOT);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative group mb-4"
    >
      {/* Glowing border on hover */}
      <div className={`absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur ${
        isOT ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500'
             : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500'
      }`} />

      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all overflow-hidden">

        {/* ── View Mode ─────────────────────────────────── */}
        <div className="p-4">
          {/* Header */}
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

            <div className="flex items-center gap-2 flex-wrap">
              {isOT && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-md border border-yellow-500/40">
                  <Clock className="size-3 text-yellow-400" />
                  <span className="text-[10px] font-bold text-yellow-400 uppercase">Overtime</span>
                </div>
              )}
              {!isOT && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                  <Zap className="size-3 text-yellow-500" />
                  <span className="text-[10px] font-bold text-yellow-500 uppercase">Daily Session</span>
                </div>
              )}
              {hasHours && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                  isOT ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                       : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}>
                  <Clock className="size-3" />
                  <span className="text-[10px] font-bold font-mono uppercase">{record.totalHours} hrs</span>
                </div>
              )}
              {/* Edit button — always visible */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-purple-500/20 border border-gray-600 hover:border-purple-500/40 rounded-md transition-all"
                title="Edit record"
              >
                <Pencil className="size-3 text-gray-400 hover:text-purple-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Edit</span>
              </button>
            </div>
          </div>

          {/* Times Grid — view mode */}
          {!isEditing && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-lg border ${hasTimeIn ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className={`size-3 ${hasTimeIn ? 'text-cyan-400' : 'text-gray-600'}`} />
                    <span className="text-[10px] font-mono uppercase text-gray-500">Time In</span>
                  </div>
                  <div className={`text-sm font-black font-mono ${hasTimeIn ? 'text-cyan-400' : 'text-gray-400'}`}>
                    {record.timeIn || '--:-- --'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${hasTimeOut ? isOT ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-orange-500/5 border-orange-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <LogOut className={`size-3 ${hasTimeOut ? isOT ? 'text-yellow-400' : 'text-orange-400' : 'text-gray-600'}`} />
                    <span className="text-[10px] font-mono uppercase text-gray-500">
                      Time Out {isOT && hasTimeOut && <span className="text-yellow-500">⚡</span>}
                    </span>
                  </div>
                  <div className={`text-sm font-black font-mono ${hasTimeOut ? isOT ? 'text-yellow-400' : 'text-orange-400' : 'text-gray-400'}`}>
                    {record.timeOut || '--:-- --'}
                  </div>
                  {isOT && hasTimeOut && (
                    <p className="text-[9px] font-mono text-yellow-600 mt-0.5">overtime — no 5PM cap</p>
                  )}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <ClipboardList className="size-3 text-purple-400" />
                  <span className="text-[10px] font-mono uppercase text-gray-500">Task Accomplishment</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{record.task_accomplishment || 'No task reported'}"
                </p>
              </div>
            </>
          )}

          {/* ── Edit Mode ─────────────────────────────── */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 mt-2"
              >
                {/* Time In + Time Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <LogIn size={10} className="text-cyan-400" /> Time In
                    </label>
                    <input
                      type="time"
                      value={editTimeIn}
                      onChange={e => setEditTimeIn(e.target.value)}
                      className="w-full bg-black border border-cyan-500/40 rounded-lg px-3 py-2 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <LogOut size={10} className="text-orange-400" /> Time Out
                    </label>
                    <input
                      type="time"
                      value={editTimeOut}
                      onChange={e => setEditTimeOut(e.target.value)}
                      className="w-full bg-black border border-orange-500/40 rounded-lg px-3 py-2 font-mono text-sm text-orange-400 outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                {/* Task */}
                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1 mb-1">
                    <ClipboardList size={10} className="text-purple-400" /> Task Accomplishment
                  </label>
                  <textarea
                    value={editTask}
                    onChange={e => setEditTask(e.target.value)}
                    rows={3}
                    className="w-full bg-black border border-purple-500/40 rounded-lg px-3 py-2 font-mono text-sm text-gray-300 outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                {/* Overtime toggle */}
                <div
                  onClick={() => setEditOvertime(p => !p)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    editOvertime ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700 bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={editOvertime ? 'text-yellow-400' : 'text-gray-600'} />
                    <span className={`text-xs font-bold font-mono ${editOvertime ? 'text-yellow-400' : 'text-gray-500'}`}>
                      OVERTIME {editOvertime ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-all ${editOvertime ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                    <motion.div
                      animate={{ x: editOvertime ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                    />
                  </div>
                </div>

                {/* Save / Cancel */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    <Check size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated scan line */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${
            isOT ? 'via-yellow-500' : 'via-cyan-500'
          }`}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}