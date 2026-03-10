import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { Eye, EyeOff, UserPlus, LogIn, Copy, Check, ArrowLeft, Shield, User } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── helpers ────────────────────────────────────────────
const isAdminInput = (val) => val.includes('@');

// ── sub-views ──────────────────────────────────────────

function EnrollForm({ onBack, onEnrolled }) {
  const [form, setForm]     = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      return toast.error('All fields are required.');
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/student/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onEnrolled(data.student_code, data.student.full_name);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="enroll"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="space-y-5"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors mb-2">
        <ArrowLeft size={14} /> BACK TO LOGIN
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-3">
          <UserPlus className="size-7 text-cyan-400" />
        </div>
        <h2 className="text-xl font-black font-mono text-white tracking-tight">STUDENT ENROLLMENT</h2>
        <p className="text-gray-500 text-xs font-mono mt-1">Register to receive your unique login code</p>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Full Name</label>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Juan Dela Cruz"
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-cyan-500 outline-none transition-colors placeholder-gray-700"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Email Address</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="juan@batstate-u.edu.ph"
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-cyan-500 outline-none transition-colors placeholder-gray-700"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Password</label>
        <div className="relative">
          <input
            name="password"
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 6 characters"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pr-11 text-sm font-mono text-white focus:border-cyan-500 outline-none transition-colors placeholder-gray-700"
          />
          <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black font-mono rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-pulse">ENROLLING...</span>
        ) : (
          <><UserPlus size={16} /> ENROLL NOW</>
        )}
      </motion.button>
    </motion.div>
  );
}

function CodeReveal({ code, name, onDone }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      key="code"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div>
        <div className="inline-flex p-3 bg-green-500/10 border border-green-500/20 rounded-2xl mb-3">
          <Check className="size-7 text-green-400" />
        </div>
        <h2 className="text-xl font-black font-mono text-white">ENROLLMENT COMPLETE!</h2>
        <p className="text-gray-400 text-sm mt-1">Welcome, <span className="text-cyan-400">{name}</span></p>
      </div>

      <div className="bg-gray-950 border-2 border-dashed border-cyan-500/40 rounded-2xl p-6">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Your Unique Login Code</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          {code.split('').map((digit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-12 h-14 bg-gray-900 border-2 border-cyan-500/50 rounded-xl flex items-center justify-center text-2xl font-black font-mono text-cyan-400"
            >
              {digit}
            </motion.div>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 mx-auto text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors"
        >
          {copied ? <><Check size={12} className="text-green-400" /> COPIED!</> : <><Copy size={12} /> COPY CODE</>}
        </button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
        <p className="text-xs font-mono text-yellow-400 leading-relaxed">
          ⚠️ SAVE THIS CODE. You will use it every time you log in. This will not be shown again.
        </p>
      </div>

      <motion.button
        onClick={onDone}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 bg-white text-black font-black font-mono rounded-xl text-sm hover:bg-cyan-400 transition-colors"
      >
        PROCEED TO LOGIN →
      </motion.button>
    </motion.div>
  );
}

// ── Main Login Page ─────────────────────────────────────
export default function LoginPage({ onAdminLogin, onStudentLogin }) {
  const [view, setView]         = useState('login');   // 'login' | 'enroll' | 'code'
  const [enrolledCode, setEnrolledCode] = useState('');
  const [enrolledName, setEnrolledName] = useState('');

  // Login form state
  const [identifier, setIdentifier] = useState('');   // email (admin) or 5-digit code (student)
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]      = useState(false);
  const [loading, setLoading]        = useState(false);

  // Detect type from input
  const inputType = identifier.trim() === '' ? 'unknown'
    : isAdminInput(identifier) ? 'admin' : 'student';

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      return toast.error('Please fill in all fields.');
    }

    setLoading(true);
    try {
      if (inputType === 'admin') {
        // Admin login
        const res  = await fetch(`${API}/api/admin/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: identifier.trim(), password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        localStorage.setItem('ojt_token', data.token);
        localStorage.setItem('ojt_role', 'admin');
        toast.success('Welcome, Admin!');
        onAdminLogin(data.token, data.admin);

      } else {
        // Student login
        if (!/^\d{5}$/.test(identifier.trim())) {
          throw new Error('Student code must be exactly 5 digits.');
        }
        const res  = await fetch(`${API}/api/student/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ student_code: identifier.trim(), password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        localStorage.setItem('ojt_token', data.token);
        localStorage.setItem('ojt_role', 'student');
        localStorage.setItem('ojt_student', JSON.stringify(data.student));
        toast.success(`Welcome, ${data.student.full_name}!`);
        onStudentLogin(data.token, data.student);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrolled = (code, name) => {
    setEnrolledCode(code);
    setEnrolledName(name);
    setView('code');
  };

  const handleCodeDone = () => {
    setIdentifier(enrolledCode);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full mb-4">
            <div className="size-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-3xl font-black font-mono text-white tracking-tighter">
            OJT<span className="text-cyan-400">.</span>SYSTEM
          </h1>
          <p className="text-gray-600 text-xs font-mono mt-1 uppercase tracking-widest">Attendance Monitoring</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden relative">
          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          <AnimatePresence mode="wait">

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-black font-mono text-white tracking-tight">SIGN IN</h2>
                  <p className="text-gray-600 text-xs font-mono mt-1">Admin: use email · Student: use 5-digit code</p>
                </div>

                {/* Identifier input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      Email or Student Code
                    </label>
                    {/* Live type indicator */}
                    {inputType !== 'unknown' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                          inputType === 'admin'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        }`}
                      >
                        {inputType === 'admin' ? <Shield size={9} /> : <User size={9} />}
                        {inputType === 'admin' ? 'ADMIN' : 'STUDENT'}
                      </motion.div>
                    )}
                  </div>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="admin@email.com or 12345"
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-sm font-mono text-white outline-none transition-colors placeholder-gray-700 ${
                      inputType === 'admin' ? 'focus:border-purple-500 border-gray-800'
                      : inputType === 'student' ? 'focus:border-cyan-500 border-gray-800'
                      : 'border-gray-800 focus:border-gray-600'
                    }`}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="••••••••"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pr-11 text-sm font-mono text-white focus:border-gray-600 outline-none transition-colors placeholder-gray-700"
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Login button */}
                <motion.button
                  onClick={handleLogin}
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 font-black font-mono rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                    inputType === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  }`}
                >
                  {loading ? <span className="animate-pulse">AUTHENTICATING...</span>
                    : <><LogIn size={16} /> SIGN IN</>}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-[10px] font-mono text-gray-700">STUDENT?</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                {/* Enroll button */}
                <button
                  onClick={() => setView('enroll')}
                  className="w-full py-3 border-2 border-dashed border-gray-800 hover:border-cyan-500/50 text-gray-500 hover:text-cyan-400 font-mono font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus size={14} /> ENROLL / REGISTER
                </button>
              </motion.div>
            )}

            {/* ── ENROLL VIEW ── */}
            {view === 'enroll' && (
              <EnrollForm onBack={() => setView('login')} onEnrolled={handleEnrolled} />
            )}

            {/* ── CODE REVEAL VIEW ── */}
            {view === 'code' && (
              <CodeReveal code={enrolledCode} name={enrolledName} onDone={handleCodeDone} />
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono text-gray-700 mt-6 uppercase tracking-widest">
          BatStateU · MTCC · OJT System
        </p>
      </motion.div>
    </div>
  );
}