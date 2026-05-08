import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Car, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { Badge } from '../ui/Badge';
import { toast } from '../ui/Toast';
import { driverAPI } from '../../lib/driver';
import { fadeSlideUp } from '../../motion/presets';

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: any;
  onUpdate: () => void;
}

export function VehicleForm({ isOpen, onClose, vehicle, onUpdate }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    make: vehicle?.Make || '',
    model: vehicle?.Model || '',
    year: vehicle?.Year || '',
    color: vehicle?.Color || '',
    licensePlate: vehicle?.LicensePlate || '',
    vehicleType: vehicle?.VehicleType || 'Economy'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.make || !formData.model || !formData.year || !formData.licensePlate || !formData.vehicleType) {
      toast.error('All required fields must be filled');
      return;
    }

    if (formData.year < 1990 || formData.year > 2100) {
      toast.error('Please enter a valid year between 1990 and 2100');
      return;
    }

    setLoading(true);
    try {
      if (vehicle) {
        // Edit existing vehicle
        await driverAPI.editVehicle(vehicle.VehicleID, formData);
        toast.success('Vehicle updated successfully');
      } else {
        // Add new vehicle
        await driverAPI.addVehicle(formData);
        toast.success('Vehicle added successfully - pending verification');
      }
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: 'Economy', label: 'Economy' },
    { value: 'Business', label: 'Business' },
    { value: 'Bike', label: 'Bike' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div variants={fadeSlideUp} initial="initial" animate="animate" exit="exit">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-white">
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </h2>
          <Button variant="glass" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Make"
              value={formData.make}
              onChange={(e) => handleInputChange('make', e)}
              placeholder="e.g., Toyota"
              required
            />
            <FormInput
              label="Model"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e)}
              placeholder="e.g., Corolla"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => handleInputChange('year', e)}
              placeholder="e.g., 2022"
              min="1990"
              max="2100"
              required
            />
            <FormInput
              label="Color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e)}
              placeholder="e.g., Silver"
            />
          </div>

          <FormInput
            label="License Plate"
            value={formData.licensePlate}
            onChange={(e) => handleInputChange('licensePlate', e)}
            placeholder="e.g., ABC-123"
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Vehicle Type</label>
            <select
              value={formData.vehicleType}
              onChange={(e) => handleInputChange('vehicleType', e)}
              className="w-full bg-glass-bg-light border border-glass-border text-text-primary rounded-radius-md px-4 py-3 outline-none transition-all duration-300 hover:border-glass-border-accent focus:border-amber-500 focus:shadow-[0_0_0_1px_#F59E0B]"
              required
            >
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <h4 className="font-medium text-amber-500 mb-2">Verification Notice</h4>
            <p className="text-sm text-text-muted">
              All vehicles must be verified before they can be used for rides. 
              The verification process typically takes 24-48 hours.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="glass" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
}

interface VehicleCardProps {
  vehicle: any;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export function VehicleCard({ vehicle, onEdit, onUpdate }: VehicleCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this vehicle? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await driverAPI.removeVehicle(vehicle.VehicleID);
      toast.success('Vehicle removed successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove vehicle');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-4 border border-glass-border rounded-radius-md bg-glass-bg-light"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Car size={20} className="text-amber-500" />
            <div className="font-medium text-white">
              {vehicle.Make} {vehicle.Model} ({vehicle.Year})
            </div>
          </div>
          <div className="text-sm text-text-muted mb-3">
            {vehicle.LicensePlate} • {vehicle.Color || 'Color not specified'} • {vehicle.VehicleType}
          </div>
          <Badge variant={vehicle.VerificationStatus === 'Verified' ? 'success' : 'warning'}>
            {vehicle.VerificationStatus}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="glass" size="sm" onClick={onEdit}>
            <Edit2 size={16} />
          </Button>
          <Button 
            variant="glass" 
            size="sm" 
            onClick={handleDelete}
            loading={deleting}
            className="text-error hover:border-error"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
