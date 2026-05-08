import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Check, FileText } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { adminAPI } from '../../lib/admin';
import { toast } from '../ui/Toast';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Rider' as 'Admin' | 'Rider' | 'Driver',
    phone: '',
    cnic: '',
    licenseNumber: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{11}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Driver-specific validation
    if (formData.role === 'Driver') {
      if (!formData.cnic.trim()) {
        newErrors.cnic = 'CNIC is required for drivers';
      } else if (!/^\d{13}$/.test(formData.cnic.replace(/\D/g, ''))) {
        newErrors.cnic = 'CNIC must be 13 digits';
      }
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required for drivers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };
      
      // Add driver-specific fields if role is Driver
      if (formData.role === 'Driver') {
        userData.cnic = formData.cnic;
        userData.licenseNumber = formData.licenseNumber;
      }
      
      await adminAPI.createUser(userData);
      
      toast.success('User created successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Rider',
        phone: '',
        cnic: '',
        licenseNumber: ''
      });
      setErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <GlassCard tier={2} className="p-8 backdrop-blur-xl bg-glass-white-strong border-glass-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display text-text-primary font-bold mb-2">Create New User</h2>
                <p className="text-text-secondary">Add a new user to the RideFlow platform</p>
              </div>
              <Button
                variant="icon"
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                        errors.firstName ? 'border-admin-danger' : 'border-glass-border'
                      } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-admin-danger">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                        errors.lastName ? 'border-admin-danger' : 'border-glass-border'
                      } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-admin-danger">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-600" />
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                        errors.email ? 'border-admin-danger' : 'border-glass-border'
                      } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-admin-danger">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                        errors.phone ? 'border-admin-danger' : 'border-glass-border'
                      } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                      placeholder="03001234567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-admin-danger">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Information - Only show for Driver role */}
              {formData.role === 'Driver' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Driver Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        CNIC Number
                      </label>
                      <input
                        type="text"
                        value={formData.cnic}
                        onChange={(e) => handleInputChange('cnic', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                          errors.cnic ? 'border-admin-danger' : 'border-glass-border'
                        } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                        placeholder="1234567890123"
                        maxLength={13}
                      />
                      {errors.cnic && (
                        <p className="mt-1 text-sm text-admin-danger">{errors.cnic}</p>
                      )}
                      <p className="mt-1 text-xs text-text-secondary">13-digit CNIC number without dashes</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                          errors.licenseNumber ? 'border-admin-danger' : 'border-glass-border'
                        } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                        placeholder="ABC-1234567"
                      />
                      {errors.licenseNumber && (
                        <p className="mt-1 text-sm text-admin-danger">{errors.licenseNumber}</p>
                      )}
                      <p className="mt-1 text-xs text-text-secondary">Official driving license number</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Account Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      User Role
                    </label>
                    <div className="flex gap-3">
                      {(['Rider', 'Driver', 'Admin'] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleInputChange('role', role)}
                          className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                            formData.role === role
                              ? 'bg-amber-600/20 border-amber-600 text-amber-600'
                              : 'bg-glass-white border-glass-border text-text-secondary hover:border-soft-gold/50'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                          errors.password ? 'border-admin-danger' : 'border-glass-border'
                        } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                        placeholder="Enter password"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-admin-danger">{errors.password}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-glass-white border ${
                          errors.confirmPassword ? 'border-admin-danger' : 'border-glass-border'
                        } hover:border-soft-gold/50 focus:border-soft-gold focus:outline-none focus:shadow-glow transition-all duration-300 text-text-primary placeholder-text-secondary`}
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-admin-danger">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-glass-border">
                <Button
                  type="button"
                  variant="glass"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-sm font-medium backdrop-blur-xl bg-glass-white border border-glass-border hover:border-soft-gold/50 text-text-primary rounded-xl transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 text-sm font-semibold bg-gradient-to-r from-soft-gold to-champagne hover:from-champagne hover:to-soft-gold text-text-primary shadow-glow rounded-xl border-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Create User
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
