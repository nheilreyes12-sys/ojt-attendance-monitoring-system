import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

export function AdminLogin({ onLogin, onBack }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace 'admin123' with your desired password
    if (password === 'admin123') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-8 transition-colors font-mono"
        >
          <ArrowLeft size={18} /> BACK TO SELECTION
        </button>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 blur"></div>
          <div className="relative bg-gray-900 border-2 border-gray-800 p-8 rounded-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-purple-500/10 rounded-full mb-4">
                <Shield className="size-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-white font-mono">ADMIN ACCESS</h2>
              <p className="text-gray-400 text-sm font-mono">Restricted area. Authorization required.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-950 border-2 border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-purple-500 outline-none transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-red-400 text-xs font-mono mt-2"
                  >
                    INVALID ACCESS KEY. ACCESS DENIED.
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                AUTHENTICATE →
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}