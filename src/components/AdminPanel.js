import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Zap, 
  FileSpreadsheet, 
  Filter,
  Printer,
  X,
  Wifi,
  LayoutDashboard
} from 'lucide-react';
import { AttendanceCard } from './AttendanceCard';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// THIS ID IS PERMANENT. IT WILL NEVER CHANGE.
const PERMANENT_SESSION_ID = "OJT-SYSTEM-FIXED-001";

export function AdminPanel({ records, officeSSID, onUpdateSSID }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isEditingSSID, setIsEditingSSID] = useState(false);
  const [tempSSID, setTempSSID] = useState(officeSSID);
  const [selectedName, setSelectedName] = useState('all');
  const [showPrintView, setShowPrintView] = useState(false);

  // 1. Unique Names for Filter
  const uniqueNames = useMemo(() => {
    const names = records.map(r => r.student_name || r.studentName || r.name).filter(Boolean);
    return ['all', ...new Set(names)].sort();
  }, [records]);

  // 2. Filtered View (Current Month for display)
  const displayRecords = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records.filter(r => {
      const recordDate = new Date(r.timestamp);
      const isThisMonth = recordDate.getMonth() === currentMonth && 
                          recordDate.getFullYear() === currentYear;
      
      const sName = r.student_name || r.studentName || r.name;
      const matchesName = selectedName === 'all' || sName === selectedName;
      
      return isThisMonth && matchesName;
    });
  }, [records, selectedName]);

  // 3. EXCEL EXPORT (Optimized Layout with Task Accomplishments)
  const handleExportExcel = () => {
    const exportData = records.map(r => ({
      'STUDENT NAME': (r.student_name || r.studentName || r.name || 'N/A').toUpperCase(),
      'STUDENT ID': r.student_id || r.studentId || r.id || 'N/A',
      'STATUS': (r.status || (r.type === 'time-in' ? 'TIME IN' : 'TIME OUT')).toUpperCase(),
      'DATE': new Date(r.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      'TIME': new Date(r.timestamp).toLocaleTimeString(),
      'TASK ACCOMPLISHMENT': r.task_accomplishment || 'None submitted',
      'DEVICE SSID': r.ssid || officeSSID || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Professional Column Widths
    worksheet['!cols'] = [
      { wch: 30 }, // Name
      { wch: 15 }, // ID
      { wch: 15 }, // Status
      { wch: 20 }, // Date
      { wch: 15 }, // Time
      { wch: 60 }, // Task Accomplishment (Extra wide)
      { wch: 20 }, // SSID
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
    XLSX.writeFile(workbook, `OJT_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 4. STATIC QR GENERATOR
  const generateStaticQR = useCallback(async () => {
    try {
      const qrData = JSON.stringify({
        sessionId: PERMANENT_SESSION_ID,
        type: 'attendance_qr',
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 1000,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  }, []);

  useEffect(() => {
    generateStaticQR();
  }, [generateStaticQR]);

  const todayRecords = records.filter(r => 
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 text-slate-100">
      
      {/* --- PRINTABLE POSTER VIEW --- */}
      <AnimatePresence>
        {showPrintView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white overflow-y-auto p-8 flex flex-col items-center">
            <button onClick={() => setShowPrintView(false)} className="absolute top-8 right-8 p-3 bg-gray-100 rounded-full print:hidden">
              <X className="size-6 text-gray-800" />
            </button>
            <div className="max-w-2xl w-full text-center space-y-8 py-12 border-[14px] border-double border-black p-12">
              <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Attendance</h1>
              <p className="text-xl font-bold text-gray-500 uppercase tracking-widest border-b-2 border-black pb-4">OJT Monitoring Station</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-80 h-80 mx-auto border-4 border-black p-2" />}
              <div className="space-y-4">
                <p className="text-2xl font-bold italic underline uppercase">Scan to Time-In / Time-Out</p>
                <div className="bg-gray-100 p-4 rounded-xl text-black font-mono text-lg">WIFI: {officeSSID}</div>
              </div>
              <button onClick={() => window.print()} className="mt-8 px-10 py-4 bg-black text-white rounded-full font-bold print:hidden">PRINT POSTER</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-cyan-500" /> ADMIN PANEL
          </h1>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">System ID: {PERMANENT_SESSION_ID}</p>
        </div>
        <button onClick={() => setShowPrintView(true)} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg">
          <Printer size={18} /> GENERATE POSTER
        </button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Database Logs', value: records.length, icon: Database, color: 'from-blue-600/20 to-blue-500/10' },
          { label: 'Today Time-In', value: todayRecords.filter(r => (r.status || r.type) === 'time-in').length, icon: Activity, color: 'from-green-600/20 to-green-500/10' },
          { label: 'Today Time-Out', value: todayRecords.filter(r => (r.status || r.type) === 'time-out').length, icon: Zap, color: 'from-orange-600/20 to-orange-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-2xl p-6`}>
            <stat.icon className="size-5 mb-4 text-slate-400" />
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-xs font-mono text-slate-500 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* --- NETWORK LOCK --- */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Wifi className="size-4 text-cyan-500" />
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-tighter">WiFi Lockdown Configuration</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           {isEditingSSID ? (
              <>
                <input type="text" value={tempSSID} onChange={(e) => setTempSSID(e.target.value)} className="flex-1 px-4 py-2 bg-black border border-cyan-500/50 rounded-xl outline-none" />
                <button onClick={() => { onUpdateSSID(tempSSID); setIsEditingSSID(false); }} className="px-8 py-2 bg-cyan-600 rounded-xl font-bold">SAVE</button>
              </>
           ) : (
              <>
                <div className="flex-1 px-4 py-2 bg-black rounded-xl border border-slate-800 font-mono text-cyan-400">{officeSSID}</div>
                <button onClick={() => setIsEditingSSID(true)} className="px-8 py-2 bg-slate-800 rounded-xl font-bold hover:bg-slate-700">EDIT</button>
              </>
           )}
        </div>
      </div>

      {/* --- LOGS SECTION & EXPORT --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Users className="text-green-500" />
            <h2 className="text-xl font-bold uppercase">Attendance Table Logs</h2>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter */}
            <div className="relative flex-1 md:min-w-[250px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <select 
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black border border-slate-800 rounded-xl text-sm font-mono focus:border-cyan-500 outline-none appearance-none"
              >
                <option value="all">View: All Students</option>
                {uniqueNames.filter(n => n !== 'all').map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Export Placed Here */}
            <button 
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-all"
            >
              <FileSpreadsheet size={18} /> EXPORT MASTER EXCEL
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-4">
             <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Monthly Ledger: {new Date().toLocaleString('default', { month: 'long' })}</p>
          </div>
          <div className="space-y-3">
            {displayRecords.length === 0 ? (
              <div className="text-center py-20 bg-black/20 rounded-2xl border-2 border-dashed border-slate-800">
                <p className="text-slate-600 font-mono italic uppercase tracking-widest text-sm">No records found for current month</p>
              </div>
            ) : (
              displayRecords
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((record, index) => (
                  <AttendanceCard key={record.id} record={record} index={index} />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}