import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, CreditCard, IdCard, Eye, EyeOff } from 'lucide-react';
import { FormInput } from '../ui/FormInput';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { authAPI } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../ui/Toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  isDriver: z.boolean(),
  licenseNumber: z.string().optional(),
  cnic: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isDriver) {
    if (!data.licenseNumber || data.licenseNumber.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'License number is required for drivers', path: ['licenseNumber'] });
    }
    if (!data.cnic || data.cnic.length < 13) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid CNIC is required for drivers', path: ['cnic'] });
    }
  }
});

type FormData = z.infer<typeof schema>;

export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isDriver: false }
  });

  const isDriver = watch('isDriver');
  const password = watch('password') || '';

  // Calculate password strength (0-4)
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 1;
    if (pwd.length >= 10) strength += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['text-error', 'text-warning', 'text-amber-400', 'text-success'];
  const strengthBarColors = ['bg-error', 'bg-amber-500', 'bg-amber-400', 'bg-success'];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const role = data.isDriver ? 'Driver' : 'Rider';
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role,
        phone: data.phoneNumber?.trim() || undefined,
      };
      if (data.isDriver) {
        payload.licenseNumber = data.licenseNumber;
        payload.cnic = data.cnic;
      }
      
      const res = await authAPI.register(payload);
      if (res.data.success) {
        toast.success('Account created successfully!');
        setAuth(res.data.data.token, res.data.data.user);
        onSuccess();
        navigate(`/${role.toLowerCase()}`);
      }
    } catch (err: any) {
      console.log('=== SIGNUP ERROR ===');
      console.log('Error:', err);
      console.log('Response:', err.response?.data);
      
      // Extract specific error message
      let errorMessage = 'Failed to register. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 409) {
        errorMessage = 'Email already registered. Please use a different email or sign in.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid information provided. Please check all fields and try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      console.log('Displaying error:', errorMessage);
      toast.error(errorMessage);
      
      // Don't call onSuccess() on error - keep user on the form
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="text-center mb-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
            <User size={32} className="text-white" />
          </div>
        </motion.div>
        <h3 className="text-3xl font-display text-text-primary mb-2 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          Join RideFlow
        </h3>
        <p className="text-sm text-text-muted">Create your account and start your journey</p>
      </div>

      <div className="flex justify-center mb-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-glass-bg-light rounded-2xl p-1 border border-glass-border"
        >
          <Toggle
            checked={isDriver}
            onChange={(checked) => setValue('isDriver', checked, { shouldValidate: true })}
            label="Sign up as Driver"
          />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="relative">
          <FormInput 
            label="First Name" 
            error={errors.firstName?.message} 
            register={register('firstName')} 
            className="pl-12"
          />
          <User className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
        </div>
        <div className="relative">
          <FormInput 
            label="Last Name" 
            error={errors.lastName?.message} 
            register={register('lastName')} 
            className="pl-12"
          />
          <User className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <FormInput 
          label="Email Address" 
          type="email" 
          error={errors.email?.message} 
          register={register('email')} 
          className="pl-12"
        />
        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="relative"
      >
        <FormInput 
          label="Password" 
          type={showPassword ? 'text' : 'password'} 
          error={errors.password?.message} 
          register={register('password')} 
          className="pr-12"
          onFocus={() => setPasswordFocus(true)}
          onBlur={() => setPasswordFocus(false)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/4 text-text-muted hover:text-amber-400 transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        
        <AnimatePresence>
          {(passwordFocus || password) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <div className="flex gap-1 px-1">
                {[1, 2, 3, 4].map((level) => (
                  <motion.div
                    key={level}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: level * 0.1, duration: 0.3 }}
                    className={`h-2 rounded-full transition-colors duration-300 ${
                      strength >= level ? strengthBarColors[level - 1] : 'bg-glass-border'
                    }`}
                  />
                ))}
              </div>
              {password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs font-medium ${strengthColors[strength - 1] || 'text-text-muted'}`}
                >
                  Password strength: {strengthLabels[strength - 1] || 'Very Weak'}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="relative"
      >
        <FormInput 
          label="Phone Number (Optional)" 
          type="tel" 
          error={errors.phoneNumber?.message} 
          register={register('phoneNumber')} 
          className="pl-12"
        />
        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
      </motion.div>

      <AnimatePresence>
        {isDriver && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col gap-4 overflow-hidden"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="relative"
            >
              <FormInput 
                label="License Number" 
                error={errors.licenseNumber?.message} 
                register={register('licenseNumber')} 
                className="pl-12"
              />
              <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="relative"
            >
              <FormInput 
                label="CNIC (Format: XXXXX-XXXXXXX-X)" 
                error={errors.cnic?.message} 
                register={register('cnic')} 
                className="pl-12"
              />
              <IdCard className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-6"
      >
        <Button 
          type="submit" 
          loading={loading} 
          className="w-full py-4 text-lg font-semibold shadow-glow hover:shadow-glow-intense transition-all duration-300"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center"
      >
        <p className="text-xs text-text-muted">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">Privacy Policy</a>
        </p>
      </motion.div>
    </form>
  );
}
