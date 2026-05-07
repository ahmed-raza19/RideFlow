import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Lock, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { toast } from '../ui/Toast';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: () => void;
}

export function ProfileEditModal({ isOpen, onClose, profile, onUpdate }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    firstName: profile.FullName?.split(' ')[0] || '',
    lastName: profile.FullName?.split(' ')[1] || '',
    email: profile.Email || '',
    password: '',
    confirmPassword: '',
    profilePhoto: profile.ProfilePhoto || ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleBasicInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    setLoading(true);
    try {
      await driverAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      toast.success('Profile updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await driverAPI.updateProfile({ password: formData.password });
      toast.success('Password updated successfully');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = async () => {
    if (!formData.profilePhoto) {
      toast.error('Please enter a photo URL');
      return;
    }

    setLoading(true);
    try {
      await driverAPI.uploadProfilePhoto(formData.profilePhoto);
      toast.success('Profile photo updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
    { id: 'photo', label: 'Profile Photo', icon: <Camera size={16} /> }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div variants={fadeSlideUp} initial="initial" animate="animate" exit="exit">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-white">Edit Profile</h2>
          <Button variant="glass" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-glass-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-text-muted hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div
              key="basic"
              variants={fadeSlideUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <form onSubmit={handleBasicInfoUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e)}
                    placeholder="Enter first name"
                    required
                  />
                  <FormInput
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="relative">
                  <FormInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e)}
                    placeholder="Enter email"
                    disabled
                  />
                  <div className="absolute -bottom-6 left-0 text-xs text-text-muted">
                    Email cannot be changed here. Contact support for email changes.
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="glass" onClick={onClose}>Cancel</Button>
                  <Button type="submit" loading={loading}>
                    Update Basic Info
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              variants={fadeSlideUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-500 font-medium mb-1">Password Security</p>
                      <p className="text-text-muted">
                        Choose a strong password with at least 6 characters. Include numbers and special characters for better security.
                      </p>
                    </div>
                  </div>
                </div>
                
                <FormInput
                  label="New Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e)}
                  placeholder="Enter new password"
                  required
                />
                <FormInput
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e)}
                  placeholder="Confirm new password"
                  required
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="glass" onClick={onClose}>Cancel</Button>
                  <Button type="submit" loading={loading}>
                    Update Password
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'photo' && (
            <motion.div
              key="photo"
              variants={fadeSlideUp}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-amber-600 flex items-center justify-center text-4xl font-display text-bg-base overflow-hidden">
                      {formData.profilePhoto ? (
                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        profile.FullName?.charAt(0)
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-bg-surface">
                      <Camera size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <FormInput
                    label="Profile Photo URL"
                    value={formData.profilePhoto}
                    onChange={(e) => handleInputChange('profilePhoto', e)}
                    placeholder="Enter image URL"
                  />
                  <div className="absolute -bottom-8 left-0 text-xs text-text-muted">
                    Upload your photo to a service like Imgur and paste the URL here.
                  </div>
                </div>

                <div className="bg-glass-bg-light rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Photo Guidelines</h4>
                  <ul className="text-sm text-text-muted space-y-1">
                    <li>• Clear, recent photo of your face</li>
                    <li>• Plain background preferred</li>
                    <li>• No sunglasses or hats</li>
                    <li>• File size should be under 2MB</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="glass" onClick={onClose}>Cancel</Button>
                  <Button onClick={handlePhotoUpdate} loading={loading}>
                    Update Photo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Modal>
  );
}
