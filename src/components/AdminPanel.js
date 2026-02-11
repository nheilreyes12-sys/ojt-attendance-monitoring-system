import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Users, Database, Activity, FileSpreadsheet, Filter, Printer, 
  X, Wifi, LayoutDashboard, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { AttendanceCard } from './AttendanceCard';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const PERMANENT_SESSION_ID = "OJT-SYSTEM-FIXED-001";
const ITEMS_PER_PAGE = 5;

export function AdminPanel({ records, officeSSID, onUpdateSSID }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isEditingSSID, setIsEditingSSID] = useState(false);
  const [tempSSID, setTempSSID] = useState(officeSSID);
  
  // --- Filtering States ---
  const [selectedName, setSelectedName] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format: YYYY-MM
  const [appliedRecords, setAppliedRecords] = useState([]);
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintView, setShowPrintView] = useState(false);

  // --- 1. Grouping Logic (Standardized Names & Daily Pairing) ---
  const groupedRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    const groups = {};

    records.forEach(r => {
      // Clean name: trim whitespace and handle potential missing fields
      const rawName = r.name || r.student_name || "UNKNOWN";
      const cleanName = rawName.trim(); 
      
      if (!r.timestamp) return;

      const dateObj = new Date(r.timestamp);
      // Create a unique key using Clean Name + Specific Date
      const dateString = dateObj.toDateString(); 
      const groupKey = `${cleanName}-${dateString}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          student_name: cleanName,
          date: dateObj.toLocaleDateString(undefined, { 
            year: 'numeric', month: 'long', day: 'numeric' 
          }),
          timeIn: "--:-- --",
          timeOut: "--:-- --",
          task_accomplishment: "",
          rawDate: dateObj
        };
      }

      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentStatus = (r.status || r.type || "").toLowerCase();

      // Flexible status matching
      if (currentStatus.includes("in")) {
        groups[groupKey].timeIn = timeStr;
      } 
      if (currentStatus.includes("out")) {
        groups[groupKey].timeOut = timeStr;
        if (r.task_accomplishment && r.task_accomplishment !== "Ongoing...") {
          groups[groupKey].task_accomplishment = r.task_accomplishment;
        }
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      task_accomplishment: g.task_accomplishment || "No task reported"
    })).sort((a, b) => b.rawDate - a.rawDate);
  }, [records]);

  // --- 2. Filter Logic (Standardized Comparison) ---
  const handleApplyFilter = useCallback(() => {
    setCurrentPage(1);
    const filtered = groupedRecords.filter(r => {
      // Standardize comparison to prevent duplicates in results
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

  // --- Unique Names for Dropdown (Cleaned & Deduplicated) ---
  const uniqueNames = useMemo(() => {
    const names = groupedRecords.map(r => r.student_name);
    // Set automatically removes duplicates
    return ['all', ...new Set(names)].sort();
  }, [groupedRecords]);

  // --- 3. Pagination ---
  const totalPages = Math.ceil(appliedRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = appliedRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- 4. Enhanced Excel Export ---
  const handleExportExcel = () => {
    if (appliedRecords.length === 0) return alert("No records to export.");

    const exportData = appliedRecords.map(r => ({
      'STUDENT NAME': r.student_name.toUpperCase(),
      'DATE': r.date,
      'TIME IN': r.timeIn,
      'TIME OUT': r.timeOut,
      'TASK ACCOMPLISHMENT': r.task_accomplishment
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 50 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");

    const monthLabel = selectedMonth ? `_${selectedMonth}` : '_Full_History';
    const nameLabel = selectedName !== 'all' ? `_${selectedName.replace(/\s+/g, '_')}` : '';
    
    XLSX.writeFile(workbook, `OJT_Report${monthLabel}${nameLabel}.xlsx`);
  };

  // --- 5. QR Generation ---
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
      <style>{`
        input[type="month"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.7;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-cyan-500" /> ADMIN PANEL
          </h1>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">OJT Attendance Monitoring </p>
        </div>
        <button onClick={() => setShowPrintView(true)} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg">
          <Printer size={18} /> GENERATE POSTER
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Logs', value: records.length, icon: Database, color: 'from-blue-600/20' },
          { label: 'Today Activity', value: todayCount, icon: Activity, color: 'from-green-600/20' },
          { label: 'Results Found', value: appliedRecords.length, icon: Filter, color: 'from-cyan-600/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6`}>
            <stat.icon className="size-5 mb-4 text-slate-400" />
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-xs font-mono text-slate-500 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Network Config */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-center transition-all">
        <div className="flex items-center gap-3">
          <Wifi className="size-4 text-cyan-500" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-tighter">Restriction:</span>
        </div>
        {isEditingSSID ? (
          <div className="flex gap-2 w-full">
            <input type="text" value={tempSSID} onChange={(e) => setTempSSID(e.target.value)} className="flex-1 px-4 py-2 bg-black border border-cyan-500/50 rounded-xl outline-none font-mono" />
            <button onClick={() => { onUpdateSSID(tempSSID); setIsEditingSSID(false); }} className="px-6 py-2 bg-cyan-600 rounded-xl font-bold text-xs">SAVE</button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-mono text-cyan-400 text-sm tracking-widest">{officeSSID}</span>
            <button onClick={() => setIsEditingSSID(true)} className="text-[10px] font-bold text-slate-500 hover:text-white underline uppercase">Update SSID</button>
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Users className="text-cyan-500" />
            <h2 className="text-xl font-bold uppercase">Attendance Records</h2>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 md:w-48 px-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none text-white transition-all"
            />

            <select 
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="flex-1 md:w-56 px-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none text-white"
            >
              <option value="all">All Students</option>
              {uniqueNames.filter(n => n !== 'all').map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {(selectedMonth || selectedName !== 'all') && (
              <button onClick={() => {setSelectedMonth(''); setSelectedName('all')}} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}

            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
            >
              <FileSpreadsheet size={18} /> EXPORT
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="space-y-3 min-h-[300px]">
            {paginatedRecords.length === 0 ? (
              <div className="text-center py-20 bg-black/20 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 font-mono italic uppercase text-xs tracking-widest">
                No matching logs found
              </div>
            ) : (
              paginatedRecords.map((record, index) => (
                <AttendanceCard key={record.id} record={record} index={index} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-all">
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-mono text-slate-500 uppercase">Page {currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Poster Modal */}
      <AnimatePresence>
        {showPrintView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white overflow-y-auto p-8 flex flex-col items-center text-black">
             <button onClick={() => setShowPrintView(false)} className="fixed top-8 right-8 p-3 bg-gray-100 rounded-full print:hidden">
              <X size={24} />
            </button>
            <div className="max-w-2xl w-full text-center space-y-8 py-12 border-[10px] border-black p-12">
              <h1 className="text-6xl font-black italic">OJT PORTAL</h1>
              <p className="text-xl font-bold text-gray-400 border-b-2 border-black pb-4 uppercase tracking-[0.3em]">Attendance Gateway</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-80 h-80 mx-auto border-4 border-black p-1 shadow-2xl" />}
              <div className="space-y-4">
                <p className="text-2xl font-black underline">SCAN TO LOGIN/LOGOUT</p>
                <div className="bg-gray-100 p-4 rounded-xl font-mono text-lg font-bold">WIFI: {officeSSID}</div>
              </div>
              <button onClick={() => window.print()} className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold print:hidden hover:scale-105 transition-transform">PRINT NOW</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}