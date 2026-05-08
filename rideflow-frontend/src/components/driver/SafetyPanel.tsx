import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, Share2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FormInput } from '../ui/FormInput';
import { toast } from '../ui/Toast';
import { driverAPI } from '../../lib/driver';

interface SafetyPanelProps {
  activeRide?: any;
  className?: string;
}

export function SafetyPanel({ activeRide, className = '' }: SafetyPanelProps) {
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
    rideID: activeRide?.RideID || ''
  });
  
  const [shareData, setShareData] = useState({
    rideID: activeRide?.RideID || '',
    contactPhone: ''
  });

  const handleSOS = async () => {
    setLoading(true);
    try {
      await driverAPI.sendSOS();
      toast.success('SOS alert sent! Emergency services have been notified.');
      setSosModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send SOS alert');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.reason || !reportData.rideID) {
      toast.error('Reason and Ride ID are required');
      return;
    }

    setLoading(true);
    try {
      await driverAPI.reportRider(reportData);
      toast.success('Rider reported successfully. We will review your report.');
      setReportModalOpen(false);
      setReportData({ reason: '', description: '', rideID: activeRide?.RideID || '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to report rider');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareData.contactPhone || !shareData.rideID) {
      toast.error('Contact phone and Ride ID are required');
      return;
    }

    setLoading(true);
    try {
      await driverAPI.shareTrip(shareData);
      toast.success('Trip details shared successfully');
      setShareModalOpen(false);
      setShareData({ rideID: activeRide?.RideID || '', contactPhone: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share trip');
    } finally {
      setLoading(false);
    }
  };

  const reportReasons = [
    'Disrespectful behavior',
    'Safety concern',
    'Route deviation',
    'Payment issue',
    'Vehicle damage',
    'Other'
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-amber-500" />
        <h3 className="text-lg font-display text-white">Safety Features</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* SOS Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="glass"
            className="w-full h-auto p-4 flex flex-col items-center gap-2 border-error/50 hover:border-error"
            onClick={() => setSosModalOpen(true)}
          >
            <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
              <Phone size={24} className="text-error" />
            </div>
            <span className="text-sm font-medium text-error">Emergency SOS</span>
            <span className="text-xs text-text-muted">Get immediate help</span>
          </Button>
        </motion.div>

        {/* Report Rider */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="glass"
            className="w-full h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => setReportModalOpen(true)}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <span className="text-sm font-medium text-white">Report Rider</span>
            <span className="text-xs text-text-muted">Report an issue</span>
          </Button>
        </motion.div>

        {/* Share Trip */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="glass"
            className="w-full h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => setShareModalOpen(true)}
            disabled={!activeRide}
          >
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <Share2 size={24} className="text-success" />
            </div>
            <span className="text-sm font-medium text-white">Share Trip</span>
            <span className="text-xs text-text-muted">
              {activeRide ? 'Share with contacts' : 'No active ride'}
            </span>
          </Button>
        </motion.div>
      </div>

      {/* SOS Modal */}
      <Modal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mx-auto">
              <Phone size={40} className="text-error" />
            </div>
            
            <div>
              <h3 className="text-2xl font-display text-white mb-2">Emergency SOS</h3>
              <p className="text-text-muted">
                This will alert emergency services and share your location. 
                Use this only in real emergencies.
              </p>
            </div>

            <div className="bg-error/10 border border-error/30 rounded-lg p-4">
              <h4 className="font-medium text-error mb-2">What happens next:</h4>
              <ul className="text-sm text-text-muted space-y-1 text-left">
                <li>• Emergency services will be notified</li>
                <li>• Your current location will be shared</li>
                <li>• RideFlow support will be alerted</li>
                <li>• You'll receive a call shortly</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="glass" onClick={() => setSosModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="neon" 
                onClick={handleSOS}
                loading={loading}
                className="bg-error hover:bg-error/90 border-error"
              >
                Send SOS Alert
              </Button>
            </div>
          </div>
        </motion.div>
      </Modal>

      {/* Report Rider Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-display text-white mb-2">Report Rider</h3>
              <p className="text-text-muted">
                Help us maintain a safe community by reporting inappropriate behavior.
              </p>
            </div>

            <form onSubmit={handleReport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Reason for Report</label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-glass-bg-light border border-glass-border text-text-primary rounded-radius-md px-4 py-3 outline-none transition-all duration-300 hover:border-glass-border-accent focus:border-amber-500 focus:shadow-[0_0_0_1px_#F59E0B]"
                  required
                >
                  <option value="">Select a reason</option>
                  {reportReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Ride ID"
                value={reportData.rideID}
                onChange={(e) => setReportData(prev => ({ ...prev, rideID: e.target.value }))}
                placeholder="Enter ride ID"
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Description</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide details about the incident..."
                  rows={4}
                  className="w-full bg-glass-bg-light border border-glass-border text-text-primary rounded-radius-md px-4 py-3 outline-none transition-all duration-300 hover:border-glass-border-accent focus:border-amber-500 focus:shadow-[0_0_0_1px_#F59E0B] resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="glass" onClick={() => setReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </Modal>

      {/* Share Trip Modal */}
      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-display text-white mb-2">Share Trip Details</h3>
              <p className="text-text-muted">
                Share your current trip information with a trusted contact.
              </p>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              <FormInput
                label="Ride ID"
                value={shareData.rideID}
                onChange={(e) => setShareData(prev => ({ ...prev, rideID: e.target.value }))}
                placeholder="Enter ride ID"
                required
              />

              <FormInput
                label="Contact Phone Number"
                value={shareData.contactPhone}
                onChange={(e) => setShareData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+92-300-1234567"
                required
              />

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <h4 className="font-medium text-amber-500 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  What will be shared
                </h4>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Current trip status</li>
                  <li>• Pickup and drop-off locations</li>
                  <li>• Rider name (if available)</li>
                  <li>• Your real-time location</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="glass" onClick={() => setShareModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Share Trip
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}
