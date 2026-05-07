import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../ui/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode: initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isDriver, setIsDriver] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    cnic: ''
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await authAPI.login(formData.email, formData.password);
        if (res.data.success) {
          console.log('=== AUTH SUCCESS ===');
          console.log('Response data:', res.data.data);
          const userRole = res.data.data.user.role;
          console.log('User role from backend:', userRole);
          console.log('Token:', res.data.data.token.substring(0, 50) + '...');
          
          // Set auth state
          setAuth(res.data.data.token, res.data.data.user);
          console.log('Auth state set in store');
          
          // Check if auth was actually set
          setTimeout(() => {
            console.log('Checking auth state after set...');
            const authState = useAuthStore.getState();
            console.log('Token in store:', !!authState.token);
            console.log('User in store:', authState.user);
            console.log('User role in store:', authState.user?.role);
          }, 100);
          
          toast.success('Successfully signed in!');
          const role = userRole.toLowerCase();
          console.log('Navigating to:', `/${role}`);
          
          // Navigate
          navigate(`/${role}`);
          console.log('Navigation called');
          
          // Close modal after navigation starts
          setTimeout(() => onClose(), 100);
        }
      } else {
        const role = isDriver ? 'Driver' : 'Rider';
        const payload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role,
          phone: formData.phone || undefined,
        };
        if (isDriver) {
          payload.licenseNumber = formData.licenseNumber;
          payload.cnic = formData.cnic;
        }

        const res = await authAPI.register(payload);
        if (res.data.success) {
          console.log('Registration Success:', res.data.data);
          toast.success('Account created successfully!');
          setAuth(res.data.data.token, res.data.data.user);
          console.log('Navigating to:', `/${role.toLowerCase()}`);
          navigate(`/${role.toLowerCase()}`);
          // Close modal after navigation starts
          setTimeout(() => onClose(), 100);
        }
      }
    } catch (err: any) {
      console.log('=== AUTH ERROR ===');
      console.log('Error:', err);
      console.log('Response:', err.response?.data);
      
      // Extract specific error message
      let errorMessage = `Failed to ${mode === 'signin' ? 'sign in' : 'register'}. Please try again.`;
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.response?.status === 409) {
        errorMessage = 'Email already registered. Please use a different email or sign in.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid information provided. Please check all fields and try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      console.log('Displaying error:', errorMessage);
      toast.error(errorMessage);
      
      // Keep modal open on error - don't close it
      // Modal stays open so user can try again
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
        />

        {/* Modal Shell */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-[460px] z-[201] bg-[#272318] rounded-[20px] overflow-hidden shadow-[0_0_0_1px_rgba(200,133,26,0.12),0_32px_80px_rgba(0,0,0,0.45),0_8px_24px_rgba(0,0,0,0.3)]"
        >
          {/* HEADER */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#1A1810] border-b border-[rgba(200,133,26,0.1)]">
            <div className="w-[38px] h-[38px] bg-gradient-to-br from-[#E09428] to-[#C8851A] rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(200,133,26,0.4)]">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]">
                <path d="M12 3L14.5 8.5H20.5L15.5 12.5L17.5 18L12 14.5L6.5 18L8.5 12.5L3.5 8.5H9.5L12 3Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="flex bg-[rgba(255,255,255,0.04)] border border-[rgba(200,133,26,0.14)] rounded-[10px] p-[3px] gap-[2px]">
              <button
                onClick={() => setMode('signin')}
                className={`px-[22px] py-[7px] rounded-[7px] border-none text-[14px] font-medium cursor-pointer transition-all duration-[220ms] ${mode === 'signin' ? 'bg-[#C8851A] text-white shadow-[0_3px_12px_rgba(200,133,26,0.45)]' : 'text-[rgba(245,236,216,0.55)] hover:text-[#F5ECD8] hover:bg-[rgba(255,255,255,0.05)]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`px-[22px] py-[7px] rounded-[7px] border-none text-[14px] font-medium cursor-pointer transition-all duration-[220ms] ${mode === 'signup' ? 'bg-[#C8851A] text-white shadow-[0_3px_12px_rgba(200,133,26,0.45)]' : 'text-[rgba(245,236,216,0.55)] hover:text-[#F5ECD8] hover:bg-[rgba(255,255,255,0.05)]'}`}
              >
                Sign Up
              </button>
            </div>

            <button onClick={onClose} className="ml-auto w-[30px] h-[30px] rounded-[8px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center cursor-pointer text-[rgba(245,236,216,0.55)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#F5ECD8] transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* PANELS */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className={`p-8 sm:p-9 ${mode === 'signup' ? 'max-h-[78vh] overflow-y-auto custom-scrollbar' : ''}`}
              >
                {/* AVATAR */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#E09428] to-[#C8851A] rounded-[18px] flex items-center justify-center shadow-[0_0_0_6px_rgba(200,133,26,0.12),0_8px_28px_rgba(200,133,26,0.3)] relative">
                    <div className="absolute inset-[-8px] rounded-[24px] border border-[rgba(200,133,26,0.2)]"></div>
                    <svg viewBox="0 0 24 24" fill="none" className="w-[28px] h-[28px]">
                      <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                <h2 className="font-display text-[28px] text-[#E09428] text-center tracking-[-0.3px] mb-1.5">
                  {mode === 'signin' ? 'Welcome back' : 'Join RideFlow'}
                </h2>
                <p className="text-[13.5px] text-[rgba(245,236,216,0.55)] text-center mb-7 leading-[1.5]">
                  {mode === 'signin' ? 'Enter your details to access your account' : 'Create your account and start your journey'}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
                  {mode === 'signup' && (
                    <>
                      {/* Driver Toggle */}
                      <div className="flex justify-center mb-1">
                        <div 
                          onClick={() => setIsDriver(!isDriver)}
                          className={`flex items-center gap-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(200,133,26,0.18)] rounded-[100px] px-[18px] py-2 cursor-pointer select-none transition-all duration-200 hover:border-[rgba(200,133,26,0.35)] hover:bg-[rgba(200,133,26,0.05)] ${isDriver ? 'border-[rgba(200,133,26,0.5)] bg-[rgba(200,133,26,0.08)]' : ''}`}
                        >
                          <div className={`w-[38px] h-[22px] rounded-[100px] relative transition-all duration-[220ms] ${isDriver ? 'bg-[#C8851A] shadow-[0_0_10px_rgba(200,133,26,0.4)]' : 'bg-[rgba(255,255,255,0.1)]'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] left-[3px] transition-transform duration-[220ms] shadow-[0_1px_4px_rgba(0,0,0,0.3)] ${isDriver ? 'translate-x-[16px]' : ''}`}></div>
                          </div>
                          <span className={`text-[13.5px] font-medium transition-colors duration-200 ${isDriver ? 'text-[#E09428]' : 'text-[rgba(245,236,216,0.55)]'}`}>
                            Sign up as Driver
                          </span>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                          </span>
                          <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                          </span>
                          <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email Field */}
                  <div className="relative">
                    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                        <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="10" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                        <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 pr-11 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-[13px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[rgba(245,236,216,0.32)] flex items-center p-0.5 transition-colors duration-200 hover:text-[#C8851A]"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-100">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-45">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.6"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {mode === 'signin' ? (
                    <div className="flex items-center justify-between mt-[-2px]">
                      <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[rgba(245,236,216,0.55)] select-none">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-[17px] h-[17px] border-[1.5px] border-[rgba(200,133,26,0.35)] rounded-[5px] bg-[#302C1E] flex items-center justify-center transition-all duration-[180ms] peer-checked:bg-[#C8851A] peer-checked:border-[#C8851A]">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="hidden peer-checked:block">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                        Remember me
                      </label>
                      <a href="#" className="text-[13px] text-[#C8851A] no-underline font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  ) : (
                    <>
                      {/* Phone Field */}
                      <div className="relative">
                        <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2C7 20 4 7 4 5a2 2 0 011-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone Number (Optional)"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                        />
                      </div>

                      {isDriver && (
                        <div className="flex flex-col gap-[14px]">
                          <div className="relative">
                            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                                <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1.6"/>
                                <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.6"/>
                                <line x1="7" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1.6"/>
                              </svg>
                            </span>
                            <input
                              type="text"
                              name="licenseNumber"
                              placeholder="License Number"
                              value={formData.licenseNumber}
                              onChange={handleInputChange}
                              required={isDriver}
                              className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[rgba(245,236,216,0.32)] pointer-events-none transition-colors duration-200 z-[2]">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                                <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                              </svg>
                            </span>
                            <input
                              type="text"
                              name="cnic"
                              placeholder="CNIC Number"
                              value={formData.cnic}
                              onChange={handleInputChange}
                              required={isDriver}
                              className="w-full bg-[#302C1E] border border-[rgba(200,133,26,0.18)] rounded-[10px] py-3 px-[14px] pl-10 text-[14px] text-[#F5ECD8] outline-none transition-all duration-200 focus:border-[rgba(200,133,26,0.7)] focus:bg-[#382E1C] focus:shadow-[0_0_0_3px_rgba(200,133,26,0.12)]"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* CTA BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-[12px] border-none bg-gradient-to-r from-[#D4901E] to-[#C8851A] text-white font-['DM_Sans'] text-[15px] font-semibold tracking-[0.2px] cursor-pointer flex items-center justify-center gap-[10px] mt-1 shadow-[0_6px_24px_rgba(200,133,26,0.4),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-200 relative overflow-hidden hover:translate-y-[-2px] hover:shadow-[0_10px_32px_rgba(200,133,26,0.5),0_3px_8px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-inherit" />
                    {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
                      {mode === 'signin' ? (
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      ) : (
                        <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
                      )}
                    </svg>
                  </button>

                  {mode === 'signup' && (
                    <p className="text-center text-[11.5px] text-[rgba(245,236,216,0.32)] mt-2.5 leading-[1.6]">
                      By creating an account, you agree to our{' '}
                      <a href="#" className="text-[#C8851A] no-underline hover:underline">Terms of Service</a> and <a href="#" className="text-[#C8851A] no-underline hover:underline">Privacy Policy</a>
                    </p>
                  )}

                  {/* DIVIDER */}
                  <div className="flex items-center gap-[14px] my-1">
                    <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
                    <span className="text-[12px] text-[rgba(245,236,216,0.32)] tracking-[0.5px] uppercase">or</span>
                    <div className="flex-1 h-px bg-[rgba(200,133,26,0.1)]"></div>
                  </div>

                  <p className="text-center text-[13px] text-[rgba(245,236,216,0.55)] mt-2 leading-[1.5]">
                    {mode === 'signin' ? (
                      <>Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-[#C8851A] font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">Sign up</button></>
                    ) : (
                      <>Already have an account? <button type="button" onClick={() => setMode('signin')} className="text-[#C8851A] font-medium transition-colors duration-200 hover:text-[#E09428] hover:underline">Sign in</button></>
                    )}
                  </p>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
