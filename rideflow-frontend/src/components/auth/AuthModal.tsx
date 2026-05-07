import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, Eye, EyeOff, Star, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode: initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isDriver, setIsDriver] = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    cnic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const togglePassword = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = (import.meta.env?.VITE_API_BASE) || 'http://localhost:5000/api';
      
      if (mode === 'signin') {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onClose();
      } else {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: isDriver ? 'Driver' : 'Rider',
          phone: formData.phone || null,
          ...(isDriver && { licenseNumber: formData.licenseNumber, cnic: formData.cnic })
        };

        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-[460px] z-[201]"
        >
          <div className="bg-[#272318] rounded-[20px] overflow-hidden shadow-[0_0_0_1px_rgba(200,133,26,0.12),0_32px_80px_rgba(0,0,0,0.45),0_8px_24px_rgba(0,0,0,0.3)]">
            
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[#1A1810] border-b border-[rgba(200,133,26,0.1)]">
              <div className="w-[38px] h-[38px] bg-gradient-to-br from-[#E09428] to-[#C8851A] rounded-[10px] flex items-center justify-center shadow-[0_4px_14px_rgba(200,133,26,0.4)]">
                <Star size={18} className="text-white" />
              </div>
              
              <div className="flex bg-[rgba(255,255,255,0.04)] border border-[rgba(200,133,26,0.14)] rounded-[10px] p-[3px] gap-[2px]">
                <button
                  onClick={() => setMode('signin')}
                  className={`px-[22px] py-[7px] rounded-[7px] border-none text-[14px] font-medium cursor-pointer transition-all duration-220 ${
                    mode === 'signin' 
                      ? 'bg-[#C8851A] text-white shadow-[0_3px_12px_rgba(200,133,26,0.45)]' 
                      : 'text-[rgba(245,236,216,0.55)] hover:text-[#F5ECD8] hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`px-[22px] py-[7px] rounded-[7px] border-none text-[14px] font-medium cursor-pointer transition-all duration-220 ${
                    mode === 'signup' 
                      ? 'bg-[#C8851A] text-white shadow-[0_3px_12px_rgba(200,133,26,0.45)]' 
                      : 'text-[rgba(245,236,216,0.55)] hover:text-[#F5ECD8] hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <button 
                onClick={onClose}
                className="ml-auto w-[30px] h-[30px] rounded-[8px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center cursor-pointer text-[rgba(245,236,216,0.55)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#F5ECD8] transition-all duration-200"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Panels */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className={`p-9 ${mode === 'signup' ? 'max-h-[78vh] overflow-y-auto' : ''}`}
                >
                  {mode === 'signin' ? (
                    <SignInPanel 
                      formData={formData}
                      showPassword={showPassword}
                      rememberMe={rememberMe}
                      loading={loading}
                      error={error}
                      onInputChange={handleInputChange}
                      onTogglePassword={togglePassword}
                      onRememberMeChange={setRememberMe}
                      onSubmit={handleSubmit}
                      onSwitchToSignup={() => setMode('signup')}
                    />
                  ) : (
                    <SignUpPanel 
                      formData={formData}
                      isDriver={isDriver}
                      showPassword={showPassword}
                      loading={loading}
                      error={error}
                      onInputChange={handleInputChange}
                      onTogglePassword={togglePassword}
                      onDriverToggle={() => setIsDriver(!isDriver)}
                      onSubmit={handleSubmit}
                      onSwitchToSignin={() => setMode('signin')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Sign In Panel Component
function SignInPanel({ 
  formData, 
  showPassword, 
  rememberMe, 
  loading, 
  error,
  onInputChange, 
  onTogglePassword, 
  onRememberMeChange, 
  onSubmit,
  onSwitchToSignup 
}: any) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
      {/* Avatar */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E09428] to-[#C8851A] rounded-[18px] flex items-center justify-center shadow-[0_0_0_6px_rgba(200,133,26,0.12),0_8px_28px_rgba(200,133,26,0.3)] relative">
          <div className="absolute inset-[-8px] rounded-[24px] border border-[rgba(200,133,26,0.2)]"></div>
          <User size={28} className="text-white" />
        </div>
      </div>

      <h2 className="font-['DM_Serif_Display'] text-[28px] text-[#E09428] text-center tracking-[-0.3px] mb-1.5">
        Welcome back
      </h2>
      <p className="text-[13.5px] text-[rgba(245,236,216,0.55)] text-center mb-7 leading-[1.5]">
        Enter your details to access your account
      </p>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="relative">
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
          <Mail size={16} />
        </span>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="Email Address"
          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
          required
        />
      </div>

      {/* Password Field */}
      <div className="relative">
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
          <Lock size={16} />
        </span>
        <input
          type={showPassword.siPw ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={onInputChange}
          placeholder="Password"
          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 pr-11 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
          required
        />
        <button
          type="button"
          onClick={() => onTogglePassword('siPw')}
          className="absolute right-[13px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[rgba(245,236,216,0.32)] flex items-center p-0.5 transition-colors duration-200 hover:text-[#C8851A]"
        >
          {showPassword.siPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Extras Row */}
      <div className="flex items-center justify-between mt-[-2px]">
        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[rgba(245,236,216,0.55)] select-none">
          <input type="checkbox" checked={rememberMe} onChange={(e) => onRememberMeChange(e.target.checked)} className="hidden" />
          <div className="w-[17px] h-[17px] border-[1.5px] border-[rgba(200,133,26,0.35)] rounded-[5px] bg-[#302C1E] flex items-center justify-center transition-all duration-180">
            {rememberMe && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          Remember me
        </label>
        <a href="#" className="text-[13px] text-[#C8851A] no-underline font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">
          Forgot password?
        </a>
      </div>

      {/* CTA Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-[12px] border-none bg-gradient-to-r from-[#D4901E] to-[#C8851A] text-white font-['DM_Sans'] text-[15px] font-medium tracking-[0.2px] cursor-pointer flex items-center justify-center gap-2.5 mt-1 shadow-[0_6px_24px_rgba(200,133,26,0.4),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-200 relative overflow-hidden hover:translate-y-[-2px] hover:shadow-[0_10px_32px_rgba(200,133,26,0.5),0_3px_8px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing In...' : 'Sign In'}
        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3.5 my-1">
        <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
        <span className="text-[12px] text-[rgba(245,236,216,0.32)] tracking-[0.5px] uppercase">or</span>
        <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
      </div>

      <p className="text-center text-[13px] text-[rgba(245,236,216,0.55)] mt-2 leading-[1.5]">
        Don't have an account? <button type="button" onClick={onSwitchToSignup} className="text-[#C8851A] font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">Sign up</button>
      </p>
    </form>
  );
}

// Sign Up Panel Component
function SignUpPanel({ 
  formData, 
  isDriver, 
  showPassword, 
  loading, 
  error,
  onInputChange, 
  onTogglePassword, 
  onDriverToggle, 
  onSubmit,
  onSwitchToSignin 
}: any) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">
      {/* Avatar */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E09428] to-[#C8851A] rounded-[18px] flex items-center justify-center shadow-[0_0_0_6px_rgba(200,133,26,0.12),0_8px_28px_rgba(200,133,26,0.3)] relative">
          <div className="absolute inset-[-8px] rounded-[24px] border border-[rgba(200,133,26,0.2)]"></div>
          <User size={28} className="text-white" />
        </div>
      </div>

      <h2 className="font-['DM_Serif_Display'] text-[28px] text-[#E09428] text-center tracking-[-0.3px] mb-1.5">
        Join RideFlow
      </h2>
      <p className="text-[13.5px] text-[rgba(245,236,216,0.55)] text-center mb-7 leading-[1.5]">
        Create your account and start your journey
      </p>

      {/* Driver Toggle */}
      <div className="flex justify-center mb-1">
        <div 
          onClick={onDriverToggle}
          className={`flex items-center gap-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(200,133,26,0.18)] rounded-[100px] px-[18px] py-2 cursor-pointer select-none transition-all duration-200 hover:border-[rgba(200,133,26,0.35)] hover:bg-[rgba(200,133,26,0.05)] ${isDriver ? 'border-[rgba(200,133,26,0.5)] bg-[rgba(200,133,26,0.08)]' : ''}`}
        >
          <div className="w-[38px] h-[22px] bg-[rgba(255,255,255,0.1)] rounded-[100px] relative transition-all duration-220">
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-220 ${isDriver ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className={`text-[13.5px] font-medium transition-colors duration-200 ${isDriver ? 'text-[#E09428]' : 'text-[rgba(245,236,216,0.55)]'}`}>
            Sign up as Driver
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
            <User size={15} />
          </span>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            placeholder="First Name"
            className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
            required
          />
        </div>
        <div className="relative">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
            <User size={15} />
          </span>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            placeholder="Last Name"
            className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
            required
          />
        </div>
      </div>

      {/* Email Field */}
      <div className="relative">
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
          <Mail size={16} />
        </span>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="Email Address"
          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
          required
        />
      </div>

      {/* Password Field */}
      <div className="relative">
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
          <Lock size={16} />
        </span>
        <input
          type={showPassword.suPw ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={onInputChange}
          placeholder="Password"
          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 pr-11 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
          required
        />
        <button
          type="button"
          onClick={() => onTogglePassword('suPw')}
          className="absolute right-[13px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[rgba(245,236,216,0.32)] flex items-center p-0.5 transition-colors duration-200 hover:text-[#C8851A]"
        >
          {showPassword.suPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Phone Field */}
      <div className="relative">
        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
          <Phone size={15} />
        </span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="Phone Number (Optional)"
          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
        />
      </div>

      {/* Driver Fields */}
      {isDriver && (
        <>
          <div className="relative">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
              <Lock size={15} />
            </span>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={onInputChange}
              placeholder="License Number"
              className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
              required={isDriver}
            />
          </div>
          <div className="relative">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-2">
              <Lock size={15} />
            </span>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={onInputChange}
              placeholder="CNIC Number"
              className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
              required={isDriver}
            />
          </div>
        </>
      )}

      {/* CTA Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-[12px] border-none bg-gradient-to-r from-[#D4901E] to-[#C8851A] text-white font-['DM_Sans'] text-[15px] font-medium tracking-[0.2px] cursor-pointer flex items-center justify-center gap-2.5 mt-1.5 shadow-[0_6px_24px_rgba(200,133,26,0.4),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-200 relative overflow-hidden hover:translate-y-[-2px] hover:shadow-[0_10px_32px_rgba(200,133,26,0.5),0_3px_8px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Legal Note */}
      <p className="text-center text-[11.5px] text-[rgba(245,236,216,0.32)] mt-2.5 leading-[1.6]">
        By creating an account, you agree to our
        <a href="#" className="text-[#C8851A] no-underline hover:underline">Terms of Service</a> and <a href="#" className="text-[#C8851A] no-underline hover:underline">Privacy Policy</a>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3.5 my-1">
        <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
        <span className="text-[12px] text-[rgba(245,236,216,0.32)] tracking-[0.5px] uppercase">or</span>
        <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
      </div>

      <p className="text-center text-[13px] text-[rgba(245,236,216,0.55)] mt-1 leading-[1.5]">
        Already have an account? <button type="button" onClick={onSwitchToSignin} className="text-[#C8851A] font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">Sign in</button>
      </p>
    </form>
  );
}
