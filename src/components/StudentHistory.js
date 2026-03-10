// ============================================================
//  StudentHistory.js — OJT Attendance Monitoring System
//  Shows student's full shift history:
//  - Summary stats (total hours, days rendered)
//  - Calendar view (monthly attendance dots)
//  - Daily shift cards (time in/out, hours, task, overtime)
//  - Printable report
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Printer, Clock, Calendar, CheckCircle2,
  ChevronLeft, ChevronRight,
  Zap, TrendingUp, Award
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function StudentHistory({ student, onBack }) {
  const [records, setRecords]         = useState([]);
  const [totalHours, setTotalHours]   = useState('0.00');
  const [daysRendered, setDaysRendered] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [requiredHours, setRequiredHours] = useState(0);
  const [calMonth, setCalMonth]       = useState(new Date());

  // ── Fetch history + student profile from backend ─────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [histRes, profileRes] = await Promise.all([
          fetch(`${API}/api/attendance/history/${student.id}`),
          fetch(`${API}/api/students/${student.id}/profile`),
        ]);
        const histData    = await histRes.json();
        const profileData = await profileRes.json();

        if (histData.success) {
          setRecords(histData.records);
          setTotalHours(histData.totalHours);
          setDaysRendered(histData.daysRendered);
        }
        if (profileData.success) {
          setRequiredHours(parseFloat(profileData.student.required_hours) || 0);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [student.id]);

  // ── Build a set of attended dates for the calendar ────
  const attendedDates = useMemo(() => {
    const s = new Set();
    records.forEach(r => { if (r.timeIn && r.timeOut) s.add(r.date); });
    return s;
  }, [records]);

  const incompletesDates = useMemo(() => {
    const s = new Set();
    records.forEach(r => { if (r.timeIn && !r.timeOut) s.add(r.date); });
    return s;
  }, [records]);

  // ── Calendar helpers ──────────────────────────────────
  const calDays = useMemo(() => {
    const year  = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push({ day: d, iso });
    }
    return cells;
  }, [calMonth]);

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1));
  const nextMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1));

  // ── Print handler ─────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Longest streak ────────────────────────────────────
  const streak = useMemo(() => {
    const sorted = [...attendedDates].sort();
    let max = 0, cur = 0, prev = null;
    sorted.forEach(d => {
      if (prev) {
        const diff = (new Date(d) - new Date(prev)) / 86400000;
        cur = diff === 1 ? cur + 1 : 1;
      } else { cur = 1; }
      max  = Math.max(max, cur);
      prev = d;
    });
    return max;
  }, [attendedDates]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center space-y-3">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Clock className="size-8 text-cyan-400 mx-auto" />
        </motion.div>
        <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading history...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white print:bg-white print:text-black">

      {/* ── Print styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Syne:wght@400;700;800&display=swap');
        * { font-family: 'Syne', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace !important; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; margin: 0; }
          .print-only { display: block !important; }
          .print-table-wrap { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
          .print-table-wrap { display: none !important; }
        }
        .print-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .print-table th {
          background: #111;
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid #333;
        }
        .print-table td {
          padding: 7px 10px;
          border: 1px solid #ddd;
          vertical-align: top;
          color: #111;
        }
        .print-table tr:nth-child(even) td { background: #f9f9f9; }
        .print-table .ot-badge {
          display: inline-block;
          background: #f59e0b;
          color: white;
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
          text-transform: uppercase;
        }
      `}</style>

      {/* ── Print-only full page ── */}
      <div className="print-table-wrap" style={{padding: '32px'}}>
        {/* Header */}
        <div style={{borderBottom: '3px solid black', paddingBottom: '16px', marginBottom: '20px'}}>
          <h1 style={{fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', margin: 0}}>OJT Attendance Report</h1>
          <p style={{fontSize: '15px', fontWeight: 700, margin: '4px 0 2px'}}>{student?.full_name}</p>
          <p style={{fontSize: '11px', color: '#555', fontFamily: 'monospace', margin: 0}}>
            Student Code: {student?.student_code} &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}
          </p>
          {/* Summary row */}
          <div style={{display: 'flex', gap: '32px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #ccc'}}>
            <div>
              <p style={{fontSize: '9px', color: '#888', textTransform: 'uppercase', margin: '0 0 2px'}}>Total Hours</p>
              <p style={{fontSize: '20px', fontWeight: 900, margin: 0}}>{totalHours} <span style={{fontSize:'12px', color:'#555'}}>/ {requiredHours > 0 ? `${requiredHours}h required` : 'No target set'}</span></p>
            </div>
            <div>
              <p style={{fontSize: '9px', color: '#888', textTransform: 'uppercase', margin: '0 0 2px'}}>Days Rendered</p>
              <p style={{fontSize: '20px', fontWeight: 900, margin: 0}}>{daysRendered}</p>
            </div>
            <div>
              <p style={{fontSize: '9px', color: '#888', textTransform: 'uppercase', margin: '0 0 2px'}}>Longest Streak</p>
              <p style={{fontSize: '20px', fontWeight: 900, margin: 0}}>{streak} days</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{width:'14%'}}>Date</th>
              <th style={{width:'10%'}}>Time In</th>
              <th style={{width:'10%'}}>Time Out</th>
              <th style={{width:'9%'}}>Hours</th>
              <th style={{width:'8%'}}>Overtime</th>
              <th>Task Accomplishment</th>
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((r, i) => {
              const dateObj = new Date(r.date);
              const dateStr = dateObj.toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
              return (
                <tr key={i}>
                  <td style={{fontWeight: 600}}>{dateStr}</td>
                  <td style={{fontFamily:'monospace'}}>{r.timeIn || '—'}</td>
                  <td style={{fontFamily:'monospace'}}>{r.timeOut || '—'}</td>
                  <td style={{fontFamily:'monospace', fontWeight:700}}>{r.totalHours > 0 ? `${r.totalHours}h` : '—'}</td>
                  <td style={{textAlign:'center'}}>
                    {r.is_overtime ? <span className="ot-badge">OT</span> : <span style={{color:'#aaa'}}>—</span>}
                  </td>
                  <td style={{color: r.task_accomplishment ? '#111' : '#aaa', fontStyle: r.task_accomplishment ? 'normal' : 'italic'}}>
                    {r.task_accomplishment || 'No task reported'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Screen header ── */}
      <div className="no-print sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="mono text-xs uppercase tracking-widest">Back</span>
          </button>
          <div className="text-center">
            <p className="mono text-[10px] text-gray-600 uppercase tracking-widest">Shift History</p>
            <p className="text-sm font-bold text-white">{student?.full_name}</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Printer size={14} className="text-cyan-400" />
            <span className="mono text-xs text-gray-300 uppercase">Print</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20 space-y-8 pt-6">

        {/* ── Summary Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 no-print"
        >
          {[
            { label: 'Total Hours', value: totalHours, icon: Clock,      color: 'from-cyan-500/20 border-cyan-500/30',    text: 'text-cyan-400' },
            { label: 'Days Rendered', value: daysRendered, icon: CheckCircle2, color: 'from-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
            { label: 'Best Streak', value: `${streak}d`,  icon: TrendingUp, color: 'from-purple-500/20 border-purple-500/30',  text: 'text-purple-400' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${s.color} border rounded-2xl p-4`}
            >
              <s.icon size={16} className={`${s.text} mb-2`} />
              <p className={`text-2xl font-black mono ${s.text}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 mono">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Calendar View ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/3 border border-white/8 rounded-2xl p-5 no-print"
        >
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <p className="font-bold text-sm tracking-wide">
              {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
            </p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center mono text-[10px] text-gray-600 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} />;
              const isPresent    = attendedDates.has(cell.iso);
              const isIncomplete = incompletesDates.has(cell.iso);
              const isToday      = cell.iso === new Date().toISOString().split('T')[0];

              // Find overtime for this date
              const rec = records.find(r => r.date === cell.iso);
              const isOT = rec?.is_overtime;

              return (
                <div key={cell.iso} className="aspect-square flex items-center justify-center relative">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mono text-xs font-bold transition-all
                    ${isPresent    ? isOT ? 'bg-yellow-500 text-black' : 'bg-cyan-500 text-black' : ''}
                    ${isIncomplete ? 'bg-orange-500/40 text-orange-300 border border-orange-500/50' : ''}
                    ${!isPresent && !isIncomplete ? 'text-gray-600 hover:text-gray-400' : ''}
                    ${isToday && !isPresent && !isIncomplete ? 'ring-1 ring-white/30 text-white' : ''}
                  `}>
                    {cell.day}
                  </div>
                  {isPresent && isOT && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Zap size={8} className="text-black" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="mono text-[10px] text-gray-500">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="mono text-[10px] text-gray-500">Overtime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500/40 border border-orange-500/50" />
              <span className="mono text-[10px] text-gray-500">Incomplete</span>
            </div>
          </div>
        </motion.div>



        {/* ── Accumulated hours bar ── */}
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/3 border border-white/8 rounded-2xl p-5 no-print"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-yellow-400" />
                <p className="mono text-xs text-gray-400 uppercase tracking-widest">OJT Progress</p>
              </div>
              <p className="mono text-xs text-gray-500">{totalHours} / {requiredHours > 0 ? requiredHours : '—'} hrs</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: requiredHours > 0 ? `${Math.min((parseFloat(totalHours) / requiredHours) * 100, 100)}%` : '0%' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
              />
            </div>
            <p className="mono text-[10px] text-gray-600 mt-2">
              {requiredHours > 0 ? `${Math.max(0, (requiredHours - parseFloat(totalHours)).toFixed(2))} hours remaining to complete OJT` : 'Required hours not set yet — contact admin.'}
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}