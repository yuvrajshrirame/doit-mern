import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, User, Mail, Lock, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';



const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, login, register, linkAccount, loginWithGoogle } = useAuth();
  
  const [isHoveringBar, setIsHoveringBar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (user && user.isAnonymous) {
          await linkAccount(email, password, name);
        } else {
          await register(email, password, name);
        }
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(2, 6, 23, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />
          
          {/* macOS Window */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
            className="relative z-10 rounded-2xl w-full max-w-md overflow-hidden bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-[20px] border border-[rgba(200,210,230,0.6)] dark:border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.18)] text-[#0f172a] dark:text-slate-100"
          >
            {/* ── macOS Title Bar ── */}
            <div
              className="flex items-center px-4 h-11 relative select-none border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-[rgba(240,243,250,0.95)] dark:bg-slate-800/80"
              onMouseEnter={() => setIsHoveringBar(true)}
              onMouseLeave={() => setIsHoveringBar(false)}
            >
              <div className="flex gap-2">
                {/* Red — Close */}
                <button type="button" onClick={onClose}
                  className="w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ background: '#ff5f57', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.15)' }}
                >
                  {isHoveringBar && <span className="text-[7px] font-black text-red-900 leading-none">✕</span>}
                </button>
                {/* Yellow & Green (Disabled for this modal, purely visual for Apple aesthetic) */}
                <button type="button" disabled
                  className="w-3 h-3 rounded-full opacity-50 cursor-not-allowed"
                  style={{ background: '#febc2e', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.15)' }}
                ></button>
                <button type="button" disabled
                  className="w-3 h-3 rounded-full opacity-50 cursor-not-allowed"
                  style={{ background: '#28c840', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.15)' }}
                ></button>
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tracking-wide flex items-center gap-1.5 text-[#64748b] dark:text-slate-400">
                <KeyRound size={11} /> {isSignUp ? 'Create Account' : 'Welcome Back'}
              </span>
            </div>

            <div className="p-8">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-xl text-sm mb-6 flex items-center gap-2 overflow-hidden font-medium"
                  >
                    <AlertTriangle size={16} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#64748b] dark:text-slate-400">Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-3.5 text-[#94a3b8] dark:text-slate-400" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl p-3 pl-10 text-sm placeholder:text-slate-400 transition-all w-full outline-none focus:ring-2 focus:ring-sky-500/50 bg-[rgba(255,255,255,0.5)] dark:bg-slate-800/60 border border-[rgba(0,0,0,0.1)] dark:border-white/10 text-[#0f172a] dark:text-slate-200" placeholder="Your Name" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#64748b] dark:text-slate-400">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-[#94a3b8] dark:text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl p-3 pl-10 text-sm placeholder:text-slate-400 transition-all w-full outline-none focus:ring-2 focus:ring-sky-500/50 bg-[rgba(255,255,255,0.5)] dark:bg-slate-800/60 border border-[rgba(0,0,0,0.1)] dark:border-white/10 text-[#0f172a] dark:text-slate-200" placeholder="hello@example.com" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#64748b] dark:text-slate-400">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-[#94a3b8] dark:text-slate-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl p-3 pl-10 text-sm placeholder:text-slate-400 transition-all w-full outline-none focus:ring-2 focus:ring-sky-500/50 bg-[rgba(255,255,255,0.5)] dark:bg-slate-800/60 border border-[rgba(0,0,0,0.1)] dark:border-white/10 text-[#0f172a] dark:text-slate-200" placeholder="••••••••" required />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(14,165,233,0.35)] bg-gradient-to-br from-sky-500 to-blue-500 hover:brightness-110"
                  >
                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(0,0,0,0.1)] dark:border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(15,23,42,0.85)] text-[#64748b] dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        setError('');
                        setLoading(true);
                        await loginWithGoogle(credentialResponse.credential);
                        onClose();
                      } catch (err) {
                        setError(typeof err === 'string' ? err : 'Google login failed');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={() => {
                      setError('Google Login Failed');
                    }}
                    theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
                    shape="pill"
                    text="continue_with"
                  />
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#64748b] dark:text-slate-400">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sky-500 hover:text-sky-400 font-semibold transition-colors">{isSignUp ? "Log In" : "Sign Up"}</button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
