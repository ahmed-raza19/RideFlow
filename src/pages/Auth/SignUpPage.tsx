import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chrome, ArrowRight, Car, CarFront, Truck, Users } from 'lucide-react';
import { signUpSchema, type SignUpFormValues } from '@/lib/validators';
import { useAppStore } from '@/store/useAppStore';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/shared/PasswordStrength';
import { fadeSlideUp, scaleIn } from '@/lib/motion';
import { clsx } from 'clsx';

const countryCodes = ['+1', '+44', '+92', '+61', '+49', '+33', '+91', '+971'];

const roleCards = [
  {
    key: 'rider',
    icon: <Users size={22} />,
    label: 'Rider',
    desc: "I'm looking for premium rides",
  },
  {
    key: 'driver',
    icon: <Car size={22} />,
    label: 'Driver',
    desc: 'I want to earn by driving',
  },
];

export default function SignUpPage() {
  const { login } = useAppStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: '+1', terms: false },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    await new Promise((r) => setTimeout(r, 700));
    // Build email with role prefix so the store infers the correct role
    const prefixedEmail = `${role}@rideflow-demo.app`;
    login(prefixedEmail, data.fullName);
    navigate(role === 'driver' ? '/driver' : '/rider');
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Left panel — branding ───────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Ambient blobs */}
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

        {/* Vertical divider */}
        <div
          className="absolute right-0 top-[10%] bottom-[10%] w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(217,119,6,0.2), transparent)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-16 max-w-[500px] w-full">
          <motion.h2
            {...fadeSlideUp}
            className="font-display text-4xl gradient-text mb-5 leading-tight"
          >
            Join the flow.<br />Start your journey.
          </motion.h2>

          <motion.p
            {...fadeSlideUp}
            transition={{ delay: 0.15 }}
            className="text-warm-muted text-base leading-relaxed mb-10"
          >
            Whether you ride or drive, RideFlow delivers premium
            experience, safety, and earnings.
          </motion.p>

          {/* Feature grid */}
          <motion.div
            {...fadeSlideUp}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: <Users size={20} />, stat: '50K+', label: 'Active Riders' },
              { icon: <Car size={20} />, stat: '8K+', label: 'Drivers Online' },
              { icon: <CarFront size={20} />, stat: '4.9★', label: 'Avg. Rating' },
              { icon: <Truck size={20} />, stat: '3 min', label: 'Avg. Wait' },
            ].map(({ icon, stat, label }) => (
              <div
                key={label}
                className="glass-1 rounded-2xl p-5 flex flex-col gap-2"
              >
                <span className="text-amber-600">{icon}</span>
                <p className="font-display text-2xl text-amber-500 leading-none">
                  {stat}
                </p>
                <p className="text-xs text-warm-faint uppercase tracking-widest">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10 overflow-y-auto">

        {/* Logo */}
        <motion.div {...fadeSlideUp} className="mb-8 self-start max-w-[480px] w-full mx-auto">
          <Link to="/" className="font-display text-2xl text-warm-white">
            Ride<span className="text-amber-600">Flow</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          {...scaleIn}
          className="glass-3 rounded-3xl p-10 w-full max-w-[480px] mx-auto"
        >
          <h1 className="font-display text-[1.85rem] text-warm-white mb-1">
            Create account
          </h1>
          <p className="text-sm text-warm-muted mb-7">
            Join thousands of happy riders and drivers
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {roleCards.map(({ key, icon, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key as 'rider' | 'driver')}
                className={clsx(
                  'p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-2',
                  role === key
                    ? 'glass-amber border-amber-600/60 text-amber-400'
                    : 'glass-1 border-transparent text-warm-muted hover:border-white/10 hover:text-warm-white'
                )}
              >
                <span className={role === key ? 'text-amber-500' : 'text-warm-faint'}>
                  {icon}
                </span>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs leading-relaxed opacity-70">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormInput
              label="Full Name"
              type="text"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <FormInput
              label="Email Address"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Phone + country code */}
            <div className="form-field">
              <div className="phone-group">
                <select className="country-select" {...register('countryCode')}>
                  {countryCodes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    className={clsx(
                      'form-input-dark w-full',
                      errors.phone && 'error'
                    )}
                    placeholder=" "
                    {...register('phone')}
                  />
                  <label
                    className="absolute pointer-events-none"
                    style={{
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    Phone Number
                  </label>
                </div>
              </div>
              {errors.phone && (
                <p className="form-error-msg">{errors.phone.message}</p>
              )}
            </div>

            {/* Password + strength */}
            <div>
              <FormInput
                label="Create Password"
                type="password"
                error={errors.password?.message}
                {...register('password', {
                  onChange: (e) => setPassword(e.target.value),
                })}
              />
              <PasswordStrength password={password} />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 mt-5 mb-6">
              <input
                type="checkbox"
                id="su-terms"
                className="mt-0.5 w-4 h-4 accent-amber-600 flex-shrink-0"
                {...register('terms')}
              />
              <label htmlFor="su-terms" className="text-xs text-warm-muted leading-relaxed">
                I agree to RideFlow's{' '}
                <a href="#" className="text-amber-500 hover:text-amber-400">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-amber-500 hover:text-amber-400">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && (
              <p className="form-error-msg mb-4">{errors.terms.message}</p>
            )}

            <Button
              variant="primary"
              fullWidth
              size="lg"
              type="submit"
              disabled={isSubmitting}
              className="mb-5"
            >
              {isSubmitting ? 'Creating account…' : `Sign Up as ${role === 'driver' ? 'Driver' : 'Rider'}`}
              {!isSubmitting && <ArrowRight size={18} />}
            </Button>
          </form>

          {/* Divider */}
          <div className="form-divider">or continue with</div>

          {/* Social */}
          <div className="flex flex-col gap-3 mt-4">
            <button className="btn btn-glass w-full flex items-center gap-3 px-5 py-3 rounded-xl">
              <Chrome size={18} className="text-amber-400" />
              <span className="text-sm">Continue with Google</span>
            </button>
            <button className="btn btn-glass w-full flex items-center gap-3 px-5 py-3 rounded-xl">
              <span className="text-amber-400 text-base leading-none font-bold"></span>
              <span className="text-sm">Continue with Apple</span>
            </button>
          </div>

          {/* Switch link */}
          <p className="text-center text-sm text-warm-muted mt-7">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              Sign In →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
