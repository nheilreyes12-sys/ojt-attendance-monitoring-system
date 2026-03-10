import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Users, Database, Activity, FileSpreadsheet, Printer, 
  X, Wifi, LayoutDashboard, ChevronLeft, ChevronRight, Clock, Pencil, Check
} from 'lucide-react';
import { AttendanceCard } from './AttendanceCard';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { toast, Toaster } from 'sonner';

const PERMANENT_SESSION_ID = "OJT-SYSTEM-FIXED-001";
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 5;

export function AdminPanel({ records, officeSSID, onUpdateSSID }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isEditingSSID, setIsEditingSSID] = useState(false);
  const [tempSSID, setTempSSID] = useState(officeSSID);
  
  const [selectedName, setSelectedName] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(''); 
  const [appliedRecords, setAppliedRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintView, setShowPrintView] = useState(false);

  // ── Students list with required hours ────────────────
  const [students, setStudents]               = useState([]);
  const [editingHoursId, setEditingHoursId]   = useState(null);
  const [hoursInput, setHoursInput]           = useState('');
  const [savingHours, setSavingHours]         = useState(false);
  const [activeTab, setActiveTab]             = useState('records');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('ojt_token');
        const res   = await fetch(`${API}/api/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data  = await res.json();
        if (data.success) setStudents(data.students);
      } catch (err) { console.error('Fetch students error:', err); }
    };
    fetchStudents();
  }, []);

  const handleSaveHours = async (studentId) => {
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours < 0) return;
    setSavingHours(true);
    try {
      const token = localStorage.getItem('ojt_token');
      const res   = await fetch(`${API}/api/students/${studentId}/hours`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ required_hours: hours }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => prev.map(s =>
          s.id === studentId ? { ...s, required_hours: hours } : s
        ));
        setEditingHoursId(null);
        toast.success('Required hours updated.');
      }
    } catch (err) { console.error('Save hours error:', err); }
    setSavingHours(false);
  };

  // --- 1. Grouping Logic & Strict 8AM-5PM Calculation ---
  const groupedRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    const groups = {};

    records.forEach(r => {
      const rawName = r.name || r.student_name || "UNKNOWN";
      const cleanName = rawName.trim().toUpperCase(); 
      
      if (!r.timestamp) return;

      const dateObj = new Date(r.timestamp);
      const dateString = dateObj.toDateString(); 
      const groupKey = `${cleanName}-${dateString}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          student_name: cleanName,
          studentId: r.studentId || r.student_id,
          date: dateObj.toLocaleDateString(undefined, { 
            year: 'numeric', month: 'long', day: 'numeric' 
          }),
          timeIn: null,
          timeOut: null,
          timeInRaw: null,
          timeOutRaw: null,
          task_accomplishment: "",
          rawDate: dateObj,
          totalHours: 0,
          is_overtime: false
        };
      }

      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentStatus = (r.status || r.type || "").toLowerCase();

      if (currentStatus.includes("in")) {
        groups[groupKey].timeIn    = timeStr;
        groups[groupKey].timeInRaw = dateObj;
        groups[groupKey].studentId = r.studentId || r.student_id; // always grab from Time In record
        if (r.is_overtime === 1 || r.is_overtime === true) {
          groups[groupKey].is_overtime = true;
        }
      } 
      if (currentStatus.includes("out")) {
        groups[groupKey].timeOut = timeStr;
        groups[groupKey].timeOutRaw = dateObj;
        if (r.task_accomplishment && r.task_accomplishment !== "Ongoing...") {
          groups[groupKey].task_accomplishment = r.task_accomplishment;
        }
      }

      if (groups[groupKey].timeInRaw && groups[groupKey].timeOutRaw) {
        const isOT = groups[groupKey].is_overtime;

        const shiftStart = new Date(groups[groupKey].timeInRaw);
        shiftStart.setHours(8, 0, 0, 0);
        const effectiveIn = groups[groupKey].timeInRaw < shiftStart
          ? shiftStart
          : groups[groupKey].timeInRaw;

        let effectiveOut;
        if (isOT) {
          effectiveOut = groups[groupKey].timeOutRaw;
        } else {
          const shiftEnd = new Date(groups[groupKey].timeInRaw);
          shiftEnd.setHours(17, 0, 0, 0);
          effectiveOut = groups[groupKey].timeOutRaw > shiftEnd
            ? shiftEnd
            : groups[groupKey].timeOutRaw;
        }

        const diffInMs = effectiveOut - effectiveIn;
        let decimalHours = diffInMs > 0 ? diffInMs / (1000 * 60 * 60) : 0;
        if (decimalHours > 5) decimalHours -= 1;
        groups[groupKey].totalHours = Math.max(0, decimalHours).toFixed(2);
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      timeIn: g.timeIn || "--:-- --",
      timeOut: g.timeOut || "--:-- --",
      task_accomplishment: g.task_accomplishment || "No task reported"
    })).sort((a, b) => b.rawDate - a.rawDate);
  }, [records]);

  // --- 2. Filter Logic ---
  const handleApplyFilter = useCallback(() => {
    setCurrentPage(1);
    const filtered = groupedRecords.filter(r => {
      const matchesName = selectedName === 'all' || r.student_name === selectedName;
      let matchesMonth = true;
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        matchesMonth = r.rawDate.getFullYear() === parseInt(year) && 
                       (r.rawDate.getMonth() + 1) === parseInt(month);
      }
      return matchesName && matchesMonth;
    });
    setAppliedRecords(filtered);
  }, [groupedRecords, selectedName, selectedMonth]);

  useEffect(() => {
    handleApplyFilter();
  }, [handleApplyFilter]);

  const uniqueNames = useMemo(() => {
    const names = groupedRecords.map(r => r.student_name);
    return ['all', ...new Set(names)].sort();
  }, [groupedRecords]);

  const grandTotalHours = useMemo(() => {
    return appliedRecords.reduce((sum, r) => sum + parseFloat(r.totalHours || 0), 0).toFixed(2);
  }, [appliedRecords]);

  // --- 3. Pagination ---
  const totalPages = Math.ceil(appliedRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = appliedRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- 4. Export ---
  const handleExportExcel = () => {
    if (appliedRecords.length === 0) return alert("No records to export.");
    const exportData = appliedRecords.map(r => ({
      'STUDENT NAME': r.student_name,
      'DATE': r.date,
      'TIME IN': r.timeIn,
      'TIME OUT': r.timeOut,
      'HOURS': r.totalHours,
      'TASK': r.task_accomplishment
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `OJT_Report_${selectedName}.xlsx`);
  };

  const generateStaticQR = useCallback(async () => {
    try {
      const qrData = JSON.stringify({ sessionId: PERMANENT_SESSION_ID, type: 'attendance_qr' });
      const url = await QRCode.toDataURL(qrData, { width: 1000, margin: 2 });
      setQrCodeUrl(url);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { generateStaticQR(); }, [generateStaticQR]);

  const todayCount = records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 text-slate-100">
      <Toaster position="top-center" richColors />
      <style>{`input[type="month"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }`}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-cyan-500" /> ADMIN PANEL
          </h1>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">OJT Monitoring System</p>
        </div>
        <button onClick={() => setShowPrintView(true)} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all">
          <Printer size={18} /> GENERATE POSTER
        </button>
      </div>

      {/* Total Hours Summary */}
      {selectedName !== 'all' && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-cyan-600 p-6 rounded-2xl flex justify-between items-center shadow-xl shadow-cyan-900/20">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Clock className="text-white" /></div>
                <div>
                    <p className="text-xs font-mono text-cyan-100 uppercase tracking-widest">Accumulated Working Hours</p>
                    <h2 className="text-2xl font-black">{selectedName}</h2>
                </div>
            </div>
            <div className="text-right">
                <p className="text-4xl font-black leading-none">{grandTotalHours}</p>
                <p className="text-[10px] font-mono text-cyan-100 uppercase mt-1">Total Hours</p>
            </div>
        </motion.div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Logs', value: records.length, icon: Database, color: 'from-blue-600/20' },
          { label: 'Today Activity', value: todayCount, icon: Activity, color: 'from-green-600/20' },
          { label: 'Total Filtered Hours', value: grandTotalHours, icon: Clock, color: 'from-cyan-600/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6`}>
            <stat.icon className="size-5 mb-4 text-slate-400" />
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-xs font-mono text-slate-500 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Network Config */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-3"><Wifi className="size-4 text-cyan-500" /> <span className="text-xs font-mono text-slate-400 uppercase">Restriction:</span></div>
        {isEditingSSID ? (
          <div className="flex gap-2 w-full">
            <input type="text" value={tempSSID} onChange={(e) => setTempSSID(e.target.value)} className="flex-1 px-4 py-2 bg-black border border-cyan-500/50 rounded-xl outline-none font-mono text-sm" />
            <button onClick={() => { onUpdateSSID(tempSSID); setIsEditingSSID(false); }} className="px-6 py-2 bg-cyan-600 rounded-xl font-bold text-xs">SAVE</button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-cyan-400 text-sm tracking-widest">{officeSSID}</span>
            <button onClick={() => setIsEditingSSID(true)} className="text-[10px] font-bold text-slate-500 hover:text-white underline uppercase">Update SSID</button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'records' ? 'bg-slate-900 text-cyan-400 border border-b-0 border-slate-800' : 'text-slate-500 hover:text-white'}`}
        >
          Attendance Records
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'students' ? 'bg-slate-900 text-cyan-400 border border-b-0 border-slate-800' : 'text-slate-500 hover:text-white'}`}
        >
          Students
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <Users className="text-cyan-500" />
            <h2 className="text-xl font-bold uppercase">Enrolled Students</h2>
            <span className="ml-auto mono text-xs text-slate-500">{students.length} students</span>
          </div>
          <div className="p-6 space-y-3">
            {students.length === 0 ? (
              <p className="text-center text-slate-600 font-mono text-sm py-10">No students enrolled yet.</p>
            ) : students.map(s => (
              <div key={s.id} className="bg-black/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-white">{s.full_name}</p>
                  <p className="mono text-xs text-slate-500 mt-0.5">{s.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      Code: {s.student_code}
                    </span>
                    <span className={`mono text-[10px] px-2 py-0.5 rounded-full border ${s.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {/* Required Hours Editor */}
                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                    <p className="mono text-[10px] text-slate-500 uppercase">Required Hours</p>
                    {editingHoursId !== s.id ? (
                      <p className="mono text-lg font-black text-purple-400">
                        {parseFloat(s.required_hours) > 0 ? `${s.required_hours}h` : <span className="text-slate-600 text-sm">Not set</span>}
                      </p>
                    ) : null}
                  </div>
                  {editingHoursId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={hoursInput}
                        onChange={e => setHoursInput(e.target.value)}
                        placeholder="e.g. 486"
                        className="w-24 px-3 py-2 bg-black border border-purple-500/50 rounded-xl mono text-sm outline-none focus:border-purple-400"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveHours(s.id); if (e.key === 'Escape') setEditingHoursId(null); }}
                      />
                      <button onClick={() => handleSaveHours(s.id)} disabled={savingHours} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingHoursId(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingHoursId(s.id); setHoursInput(s.required_hours || ''); }}
                      className="p-2 bg-slate-800 hover:bg-purple-500/20 border border-slate-700 hover:border-purple-500/40 rounded-xl transition-all"
                      title="Edit required hours"
                    >
                      <Pencil size={14} className="text-slate-400 hover:text-purple-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Users className="text-cyan-500" />
              <h2 className="text-xl font-bold uppercase">Attendance Records</h2>
            </div>
            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-1 md:w-48 px-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none" />
              <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)} className="flex-1 md:w-56 px-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none">
                <option value="all">All Students</option>
                {uniqueNames.filter(n => n !== 'all').map(name => (<option key={name} value={name}>{name}</option>))}
              </select>
              <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-all">
                <FileSpreadsheet size={18} /> EXPORT
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="space-y-3 min-h-[300px]">
              {paginatedRecords.length === 0 ? (
                <div className="text-center py-20 bg-black/20 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 font-mono text-xs tracking-widest uppercase">No matching logs found</div>
              ) : (
                paginatedRecords.map((record, index) => (
                  <AttendanceCard
                    key={record.id}
                    record={record}
                    index={index}
                    onRecordUpdated={() => window.dispatchEvent(new Event('ojt-refresh'))}
                  />
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30"><ChevronLeft size={20} /></button>
                <span className="text-xs font-mono text-slate-500 uppercase">Page {currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30"><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Poster Modal */}
      <AnimatePresence>
        {showPrintView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white overflow-y-auto p-8 flex flex-col items-center text-black">
             <button onClick={() => setShowPrintView(false)} className="fixed top-8 right-8 p-3 bg-gray-100 rounded-full print:hidden"><X size={24} /></button>
             <div className="max-w-2xl w-full text-center space-y-8 py-12 border-[10px] border-black p-12">
               <h1 className="text-6xl font-black italic">OJT PORTAL</h1>
               <p className="text-xl font-bold text-gray-400 border-b-2 border-black pb-4 uppercase tracking-[0.3em]">Attendance Gateway</p>
               {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-80 h-80 mx-auto border-4 border-black p-1 shadow-2xl" />}
               <div className="space-y-4">
                 <p className="text-2xl font-black underline">SCAN TO LOGIN/LOGOUT</p>
                 <div className="bg-gray-100 p-4 rounded-xl font-mono text-lg font-bold uppercase">WIFI: {officeSSID}</div>
                 <p className="text-sm font-bold text-gray-500 uppercase">Shift Schedule: 08:00 AM - 05:00 PM</p>
               </div>
               <button onClick={() => window.print()} className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold print:hidden hover:scale-105 transition-transform">PRINT NOW</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}