import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Users, 
  Database, 
  Activity, 
  FileSpreadsheet, 
  Filter,
  Printer,
  X,
  Wifi,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight
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
  
  // Filtering States
  const [selectedName, setSelectedName] = useState('all');
  const [appliedRecords, setAppliedRecords] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintView, setShowPrintView] = useState(false);

  // === NEW: GROUPING LOGIC ===
  // This merges "Time In" and "Time Out" logs into a single entry per student per day
  // === NEW: GROUPING LOGIC ===
 // === FIXED: GROUPING LOGIC ===
// === FIXED: GROUPING LOGIC sa loob ng AdminPanel ===
const groupedRecords = useMemo(() => {
  const groups = {};

  records.forEach(r => {
    const name = (r.student_name || r.studentName || r.name || 'Unknown').trim();
    const dateObj = new Date(r.timestamp || r.created_at);
    const dateKey = dateObj.toLocaleDateString();
    const key = `${name}-${dateKey}`;

    if (!groups[key]) {
      groups[key] = {
        id: key,
        student_name: name,
        date: dateKey,
        timeIn: null,
        timeOut: null,
        task: 'No task submitted', // Default
        timestamp: r.timestamp || r.created_at 
      };
    }

    const status = (r.status || '').toLowerCase().trim();

    if (status === 'time in' || status === 'timein') {
      groups[key].timeIn = dateObj.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      // Huwag i-update ang task dito dahil "Ongoing..." ang default ng Time In
    } 
    else if (status === 'time out' || status === 'timeout') {
      groups[key].timeOut = dateObj.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Kuhanin ang task accomplishment mula sa database column
      // Chine-check kung may laman at hindi default string
      if (r.task_accomplishment && r.task_accomplishment !== 'Ongoing...') {
      groups[key].task = r.task_accomplishment;
      }
    }
  });

  return Object.values(groups).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}, [records]);
  
  // 1. Get Unique Names
  const uniqueNames = useMemo(() => {
    const names = records.map(r => r.student_name || r.studentName || r.name).filter(Boolean);
    return ['all', ...new Set(names)].sort();
  }, [records]);

  // 2. Filter Logic (Using groupedRecords instead of raw records)
  const handleApplyFilter = useCallback(() => {
    setCurrentPage(1);
    const filtered = groupedRecords.filter(r => {
      const matchesName = selectedName === 'all' || r.student_name === selectedName;
      return matchesName;
    });
    setAppliedRecords(filtered);
  }, [groupedRecords, selectedName]);

  useEffect(() => {
    handleApplyFilter();
  }, [handleApplyFilter]);

  // 3. Pagination Logic
  const totalPages = Math.ceil(appliedRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return appliedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [appliedRecords, currentPage]);

  const handleExportExcel = () => {
    const exportData = appliedRecords.map(r => ({
      'STUDENT NAME': r.student_name.toUpperCase(),
      'DATE': r.date,
      'TIME IN': r.timeIn || '--:--',
      'TIME OUT': r.timeOut || '--:--',
      'TASK ACCOMPLISHMENT': r.task
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
    XLSX.writeFile(workbook, `Grouped_OJT_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateStaticQR = useCallback(async () => {
    try {
      const qrData = JSON.stringify({ sessionId: PERMANENT_SESSION_ID, type: 'attendance_qr' });
      const url = await QRCode.toDataURL(qrData, { width: 1000, margin: 2 });
      setQrCodeUrl(url);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { generateStaticQR(); }, [generateStaticQR]);

  const todayRecordsCount = records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 text-slate-100">
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-cyan-500" /> ADMIN PANEL
          </h1>
          <p className="text-slate-500 font-mono text-sm uppercase">Attendance Viewer</p>
        </div>
        <button onClick={() => setShowPrintView(true)} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-lg">
          <Printer size={18} /> GENERATE POSTER
        </button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Logs', value: records.length, icon: Database, color: 'from-blue-600/20' },
          { label: 'Today Total Activity', value: todayRecordsCount, icon: Activity, color: 'from-green-600/20' },
          { label: 'Grouped Daily Sessions', value: appliedRecords.length, icon: Filter, color: 'from-purple-600/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6`}>
            <stat.icon className="size-5 mb-4 text-slate-400" />
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-xs font-mono text-slate-500 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* --- FILTER & LOGS SECTION --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-500" />
            <h2 className="text-xl font-bold uppercase tracking-tight">Attendance Logs</h2>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select 
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="flex-1 md:min-w-[200px] px-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none"
            >
              <option value="all">All Students</option>
              {uniqueNames.filter(n => n !== 'all').map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all border border-slate-700"
            >
              <FileSpreadsheet size={18} /> EXPORT
            </button>
          </div>
        </div>

        {/* --- DATA TABLE AREA --- */}
        <div className="p-6 md:p-8">
          <div className="space-y-3 min-h-[400px]">
            {paginatedRecords.length === 0 ? (
              <div className="text-center py-20 bg-black/20 rounded-2xl border-2 border-dashed border-slate-800">
                <p className="text-slate-600 font-mono italic text-sm">No records found</p>
              </div>
            ) : (
              paginatedRecords.map((record, index) => (
                <AttendanceCard 
                  key={record.id} 
                  record={record} 
                  index={index} 
                  isGroupedView={true} // Add this prop to update your card UI
                />
              ))
            )}
          </div>

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-8 rounded-lg font-mono text-xs ${currentPage === i + 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- NETWORK LOCK --- */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="size-4 text-cyan-500" />
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-tighter">System Configuration</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           {isEditingSSID ? (
             <>
               <input type="text" value={tempSSID} onChange={(e) => setTempSSID(e.target.value)} className="flex-1 px-4 py-2 bg-black border border-cyan-500/50 rounded-xl outline-none" />
               <button onClick={() => { onUpdateSSID(tempSSID); setIsEditingSSID(false); }} className="px-8 py-2 bg-cyan-600 rounded-xl font-bold">SAVE</button>
             </>
           ) : (
             <>
               <div className="flex-1 px-4 py-2 bg-black rounded-xl border border-slate-800 font-mono text-cyan-400 flex items-center gap-2">
                 <Wifi className="size-3 text-slate-500" /> {officeSSID}
               </div>
               <button onClick={() => setIsEditingSSID(true)} className="px-8 py-2 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">EDIT</button>
             </>
           )}
        </div>
      </div>

      {/* --- PRINT MODAL --- */}
      <AnimatePresence>
        {showPrintView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white overflow-y-auto p-8 flex flex-col items-center">
            <button onClick={() => setShowPrintView(false)} className="absolute top-8 right-8 p-3 bg-gray-100 rounded-full print:hidden">
              <X className="size-6 text-gray-800" />
            </button>
            <div className="max-w-2xl w-full text-center space-y-8 py-12 border-[14px] border-double border-black p-12 text-black">
              <h1 className="text-5xl font-black uppercase tracking-tighter">Attendance</h1>
              <p className="text-xl font-bold text-gray-500 uppercase tracking-widest border-b-2 border-black pb-4">OJT Monitoring System</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-80 h-80 mx-auto border-4 border-black p-2" />}
              <div className="space-y-4">
                <p className="text-2xl font-bold italic underline uppercase">Scan to Time-In / Time-Out</p>
                <div className="bg-gray-100 p-4 rounded-xl font-mono text-lg">WIFI: {officeSSID}</div>
              </div>
              <button onClick={() => window.print()} className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold print:hidden">PRINT POSTER</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}