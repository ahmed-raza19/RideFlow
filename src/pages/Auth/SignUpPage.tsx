import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chrome, ArrowRight, Car, Users,
  AlertCircle, CheckCircle2, Loader2,
  IdCard, CarFront,
} from 'lucide-react';
import { z } from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/shared/PasswordStrength';
import { fadeSlideUp, scaleIn } from '@/lib/motion';
import { clsx } from 'clsx';

const countryCodes = ['+1', '+44', '+92', '+61', '+49', '+33', '+91', '+971'];

// ── Validation schema ─────────────────────────────────────────────
const signUpSchema = z.object({
  fullName:      z.string().min(2, 'Full name required (first + last)').max(80),
  email:         z.string().email('Enter a valid email address'),
  countryCode:   z.string().min(1, 'Required'),
  phone:         z.string().min(7, 'Enter a valid phone number').max(15).regex(/^[\d\s\-]+$/, 'Digits only'),
  password:      z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include one uppercase letter')
    .regex(/[0-9]/, 'Include one number'),
  terms:         z.boolean().refine((v) => v, 'You must accept the terms'),
  // Driver-only
  licenseNumber: z.string().optional(),
  cnic:          z.string().optional(),
});

type FormValues = z.infer<typeof signUpSchema>;

// ── Banner ─────────────────────────────────────────────────────────
function Banner({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm mb-5 ${
        type === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
      }`}
      role="alert"
    >
      {type === 'error'
        ? <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        : <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />}
      <span>{message}</span>
    </motion.div>
  );
}

export default function SignUpPage() {
  const { signUp, authLoading, authError, clearAuthError } = useAppStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Rider' | 'Driver'>('Rider');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: '+92', terms: false },
  });

  const onSubmit = async (data: FormValues) => {
    clearAuthError();

    // Extra validation for drivers
    if (role === 'Driver') {
      if (!data.licenseNumber?.trim()) {
        return;
      }
      if (!data.cnic?.trim()) {
        return;
      }
    }

    try {
      const redirect = await signUp({
        fullName:      data.fullName,
        email:         data.email,
        countryCode:   data.countryCode,
        phone:         data.phone,
        password:      data.password,
        role,
        licenseNumber: data.licenseNumber,
        cnic:          data.cnic,
      });
      navigate(redirect);
    } catch {
      // error stored in authError
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel — branding ─────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Ambient */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.10) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,65,12,0.07) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-[10%] bottom-[10%] w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(217,119,6,0.2), transparent)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-16 max-w-[500px] w-full">
          <motion.h2 {...fadeSlideUp} className="font-display text-4xl gradient-text mb-5 leading-tight">
            Join the flow.<br />Start your journey.
          </motion.h2>
          <motion.p {...fadeSlideUp} transition={{ delay: 0.15 }} className="text-warm-muted text-base leading-relaxed mb-10">
            Whether you ride or drive, RideFlow delivers premium experience, safety, and earnings.
          </motion.p>

          {/* Stats grid */}
          <motion.div {...fadeSlideUp} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
            {[
              { icon: <Users size={20} />,    stat: '50K+',  label: 'Active Riders' },
              { icon: <Car size={20} />,      stat: '8K+',   label: 'Drivers Online' },
              { icon: <CarFront size={20} />, stat: '4.9★',  label: 'Avg. Rating' },
              { icon: <Zap size={20} />,      stat: '3 min', label: 'Avg. Wait' },
            ].map(({ icon, stat, label }) => (
              <div key={label} className="glass-1 rounded-2xl p-5 flex flex-col gap-2">
                <span className="text-amber-600">{icon}</span>
                <p className="font-display text-2xl text-amber-500 leading-none">{stat}</p>
                <p className="text-xs text-warm-faint uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 relative z-10 overflow-y-auto">

        {/* Logo */}
        <motion.div {...fadeSlideUp} className="mb-8 self-start max-w-[480px] w-full mx-auto">
          <Link to="/" className="font-display text-2xl text-warm-white">
            Ride<span className="text-amber-600">Flow</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div {...scaleIn} className="glass-3 rounded-3xl p-10 w-full max-w-[480px] mx-auto">
          <h1 className="font-display text-[1.85rem] text-warm-white mb-1">Create account</h1>
          <p className="text-sm text-warm-muted mb-7">Join thousands of happy riders and drivers</p>

          {/* Error banner */}
          <AnimatePresence mode="wait">
            {authError && <Banner key="err" type="error" message={authError} />}
          </AnimatePresence>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {[
              { key: 'Rider',  icon: <Users size={20} />,      desc: "I'm looking for rides" },
              { key: 'Driver', icon: <Car size={20} />,        desc: 'I want to earn by driving' },
            ].map(({ key, icon, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key as 'Rider' | 'Driver')}
                className={clsx(
                  'p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-2',
                  role === key
                    ? 'glass-amber border-amber-600/60 text-amber-400'
                    : 'glass-1 border-transparent text-warm-muted hover:border-white/10 hover:text-warm-white'
                )}
              >
                <span className={role === key ? 'text-amber-500' : 'text-warm-faint'}>{icon}</span>
                <p className="font-semibold text-sm">{key}</p>
                <p className="text-xs leading-relaxed opacity-70">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Full name */}
            <FormInput
              label="Full Name"
              type="text"
              error={errors.fullName?.message}
              disabled={authLoading}
              {...register('fullName')}
            />

            {/* Email */}
            <FormInput
              label="Email Address"
              type="email"
              error={errors.email?.message}
              disabled={authLoading}
              {...register('email')}
            />

            {/* Phone + country code */}
            <div className="form-field">
              <div className="phone-group">
                <select className="country-select" disabled={authLoading} {...register('countryCode')}>
                  {countryCodes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    className={clsx('form-input-dark w-full', errors.phone && 'error')}
                    placeholder=" "
                    disabled={authLoading}
                    {...register('phone')}
                  />
                  <label
                    className="absolute pointer-events-none"
                    style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}
                  >
                    Phone Number
                  </label>
                </div>
              </div>
              {errors.phone && <p className="form-error-msg">{errors.phone.message}</p>}
            </div>

            {/* Password + strength */}
            <div>
              <FormInput
                label="Create Password"
                type="password"
                error={errors.password?.message}
                disabled={authLoading}
                {...register('password', { onChange: (e) => setPassword(e.target.value) })}
              />
              <PasswordStrength password={password} />
            </div>

            {/* Driver-only fields */}
            <AnimatePresence>
              {role === 'Driver' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4 mb-2 p-4 rounded-2xl"
                    style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.15)' }}
                  >
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <IdCard size={14} /> Driver Verification
                    </p>
                    <FormInput
                      label="License Number"
                      type="text"
                      wrapperClassName="mb-0"
                      disabled={authLoading}
                      {...register('licenseNumber')}
                    />
                    {role === 'Driver' && !errors.licenseNumber && (
                      <p className="text-xs text-warm-faint mt-1 mb-3">Your driving license number</p>
                    )}
                    <FormInput
                      label="CNIC (13 digits)"
                      type="text"
                      wrapperClassName="mb-0"
                      disabled={authLoading}
                      {...register('cnic')}
                    />
                    {role === 'Driver' && (
                      <p className="text-xs text-warm-faint mt-1">National identity card number</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            <div className="flex items-start gap-3 mt-5 mb-6">
              <input
                type="checkbox"
                id="su-terms"
                className="mt-0.5 w-4 h-4 accent-amber-600 flex-shrink-0"
                disabled={authLoading}
                {...register('terms')}
              />
              <label htmlFor="su-terms" className="text-xs text-warm-muted leading-relaxed">
                I agree to RideFlow's{' '}
                <a href="#" className="text-amber-500 hover:text-amber-400">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-amber-500 hover:text-amber-400">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && <p className="form-error-msg mb-4">{errors.terms.message}</p>}

            {/* Submit */}
            <Button
              variant="primary"
              fullWidth
              size="lg"
              type="submit"
              disabled={authLoading}
              className="mb-5 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Sign Up as {role}
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="form-divider">or continue with</div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              className="btn btn-glass w-full flex items-center gap-3 px-5 py-3 rounded-xl opacity-60 cursor-not-allowed"
              disabled type="button"
            >
              <Chrome size={18} className="text-amber-400" />
              <span className="text-sm">Continue with Google</span>
              <span className="ml-auto text-[10px] uppercase tracking-widest text-warm-faint">Soon</span>
            </button>
          </div>

          {/* Switch */}
          <p className="text-center text-sm text-warm-muted mt-7">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Sign In →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── tiny icon for stats grid ──────────────────────────────────────
function Zap({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
