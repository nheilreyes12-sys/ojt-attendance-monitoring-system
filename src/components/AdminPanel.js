import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  RefreshCw, 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Zap, 
  FileSpreadsheet, 
  Search,
  Filter
} from 'lucide-react';
import { AttendanceCard } from './AttendanceCard';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

export function AdminPanel({ records, officeSSID, onUpdateSSID }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sessionId] = useState(() => `SESSION-${Date.now().toString(36).toUpperCase()}`);
  const [isEditingSSID, setIsEditingSSID] = useState(false);
  const [tempSSID, setTempSSID] = useState(officeSSID);
  
  // State for filtering by name
  const [selectedName, setSelectedName] = useState('all');

  // 1. Get unique names for the dropdown filter
  const uniqueNames = useMemo(() => {
    const names = records.map(r => r.studentName || r.name).filter(Boolean);
    return ['all', ...new Set(names)].sort();
  }, [records]);

  // 2. DISPLAY LOGIC: Filter UI to show ONLY the current month
  const displayRecords = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return records.filter(r => {
      const recordDate = new Date(r.timestamp);
      const isThisMonth = recordDate.getMonth() === currentMonth && 
                          recordDate.getFullYear() === currentYear;
      
      const matchesName = selectedName === 'all' || (r.studentName || r.name) === selectedName;
      
      return isThisMonth && matchesName;
    });
  }, [records, selectedName]);

  // 3. EXCEL EXPORT LOGIC
  const handleExportExcel = () => {
    let dataToExport = [];
    let fileName = "";

    if (selectedName !== 'all') {
      // If a name is filtered, download ALL history for that person (ignoring the month filter)
      dataToExport = records.filter(r => (r.studentName || r.name) === selectedName);
      fileName = `Full_History_${selectedName.replace(/\s+/g, '_')}.xlsx`;
    } else {
      // If "all" is selected, download the entire database
      dataToExport = records;
      fileName = `Attendance_Report_Full_${new Date().toLocaleDateString()}.xlsx`;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(r => ({
      'Student Name': r.studentName || r.name,
      'Student ID': r.studentId || r.id,
      'Status': r.type === 'time-in' ? 'TIME IN' : 'TIME OUT',
      'Date': new Date(r.timestamp).toLocaleDateString(),
      'Time': new Date(r.timestamp).toLocaleTimeString(),
      'Office SSID': r.ssid || officeSSID,
      'Device IP': r.ip || 'N/A'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
    XLSX.writeFile(workbook, fileName);
  };

  const generateQRCode = useCallback(async () => {
    try {
      const qrData = JSON.stringify({
        sessionId,
        timestamp: Date.now(),
        type: 'attendance_qr',
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#06b6d4',
          light: '#0f172a',
        },
      });

      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `attendance-qr-${sessionId}.png`;
    link.click();
  };

  const handleSaveSSID = () => {
    onUpdateSSID(tempSSID);
    setIsEditingSSID(false);
  };

  const todayRecords = records.filter(r => {
    const today = new Date();
    const recordDate = new Date(r.timestamp);
    return recordDate.toDateString() === today.toDateString();
  });

  const timeInCount = todayRecords.filter(r => r.type === 'time-in').length;
  const timeOutCount = todayRecords.filter(r => r.type === 'time-out').length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Records (All Time)', value: records.length, icon: Database, color: 'from-cyan-500 to-blue-500' },
          { label: 'Today Time In', value: timeInCount, icon: Activity, color: 'from-green-500 to-emerald-500' },
          { label: 'Today Time Out', value: timeOutCount, icon: Zap, color: 'from-orange-500 to-pink-500' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative group"
          >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-xl opacity-30 group-hover:opacity-50 blur transition-opacity`}></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <stat.icon className="size-6 sm:size-8 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 sm:mb-6 font-mono">
            {'>'} QR CODE GENERATOR
          </h2>
          
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-full max-w-xs lg:max-w-none lg:w-auto">
              <div className="relative bg-gray-950 p-4 sm:p-6 rounded-xl border-2 border-cyan-500/50 mx-auto">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Attendance QR Code" className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg mx-auto" />
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="bg-gray-950 border border-cyan-500/30 rounded-lg p-3 sm:p-4">
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Active Session</p>
                <p className="text-xs sm:text-sm font-mono text-white break-all">ID: <span className="text-cyan-400">{sessionId}</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={downloadQR} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-mono font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50">
                  <Download className="size-4" /> DOWNLOAD QR
                </button>
                <button onClick={generateQRCode} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-mono font-semibold border border-gray-600">
                  <RefreshCw className="size-4" /> REGENERATE
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="size-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-widest">Network Config</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
             {isEditingSSID ? (
                <>
                  <input
                    type="text"
                    value={tempSSID}
                    onChange={(e) => setTempSSID(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-950 border border-cyan-500/50 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white font-mono"
                  />
                  <button onClick={handleSaveSSID} className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-mono">SAVE</button>
                </>
             ) : (
                <>
                  <div className="flex-1 px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg">
                    <code className="text-cyan-400 font-mono">{officeSSID}</code>
                  </div>
                  <button onClick={() => setIsEditingSSID(true)} className="px-6 py-2 bg-gray-700 text-white rounded-lg font-mono">EDIT</button>
                </>
             )}
          </div>
        </div>
      </motion.div>

      {/* Attendance Records Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Users className="size-6 text-green-400" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
                {'>'} ATTENDANCE LOGS
              </h2>
            </div>

            {/* Controls: Filter and Export */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Name Filter Dropdown */}
              <div className="relative flex-1 sm:flex-none min-w-[220px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <select 
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:border-green-500 outline-none appearance-none"
                >
                  <option value="all">Current Month: All Students</option>
                  {uniqueNames.filter(n => n !== 'all').map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Excel Export Button */}
              <button 
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-mono text-sm transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <FileSpreadsheet className="size-4" />
                EXPORT EXCEL
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">
              Viewing: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Logs
            </p>
          </div>
          
          <div className="space-y-3">
            {displayRecords.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-xl">
                <Users className="size-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">NO RECORDS FOR THIS MONTH</p>
                <p className="text-gray-600 text-xs font-mono mt-1 italic">Try selecting a different student or wait for new logs.</p>
              </div>
            ) : (
              displayRecords
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((record, index) => (
                  <AttendanceCard key={record.id} record={record} index={index} />
                ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}