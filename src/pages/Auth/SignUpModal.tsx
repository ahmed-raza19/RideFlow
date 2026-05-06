import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';
import { useState } from 'react';
import { signUpSchema, type SignUpFormValues } from '@/lib/validators';
import { useAppStore } from '@/store/useAppStore';
import { Modal } from '@/components/ui/Modal';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/shared/PasswordStrength';
import { fadeSlideUp } from '@/lib/motion';

const countryCodes = ['+1', '+44', '+92', '+61', '+49', '+33', '+91'];

export function SignUpModal() {
  const { isSignUpOpen, closeModals, openSignIn, login } = useAppStore();
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: '+1', terms: false },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    login(data.email, data.fullName);
  };

  return (
    <Modal isOpen={isSignUpOpen} onClose={closeModals} maxWidth="480px">
      <motion.div key="signup" {...fadeSlideUp}>
        <h2 className="font-display text-[1.75rem] text-warm-white mb-1">Create Account</h2>
        <p className="text-sm text-warm-muted mb-8">Join thousands of happy riders</p>

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

          {/* Phone with country code */}
          <div className="form-field">
            <div className="phone-group">
              <select
                className="country-select"
                {...register('countryCode')}
              >
                {countryCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex-1 relative">
                <input
                  type="tel"
                  className={`form-input-dark w-full ${errors.phone ? 'error' : ''}`}
                  placeholder=" "
                  {...register('phone')}
                />
                <label
                  className="absolute"
                  style={{
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    pointerEvents: 'none',
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
          <div className="flex items-start gap-3 mt-4 mb-6">
            <input
              type="checkbox"
              id="terms-check"
              className="mt-1 w-4 h-4 accent-amber-600"
              {...register('terms')}
            />
            <label htmlFor="terms-check" className="text-xs text-warm-muted leading-relaxed">
              By signing up, you agree to our{' '}
              <a href="#" className="text-amber-500 hover:text-amber-400">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-amber-500 hover:text-amber-400">Privacy Policy</a>
            </label>
          </div>
          {errors.terms && (
            <p className="form-error-msg mb-4">{errors.terms.message}</p>
          )}

          <Button variant="primary" fullWidth type="submit" disabled={isSubmitting} className="mb-6">
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </Button>
        </form>

        <div className="form-divider">or</div>

        <div className="flex flex-col gap-3 mt-2">
          {[
            { label: 'Continue with Google', icon: <Chrome size={18} /> },
            { label: 'Continue with Apple', icon: <span className="text-lg leading-none">⌘</span> },
          ].map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className="btn btn-glass w-full flex items-center gap-3 justify-start px-5 py-3"
            >
              <span className="text-amber-400">{icon}</span>
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-warm-muted mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={openSignIn}
            className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            Sign In →
          </button>
        </p>
      </motion.div>
    </Modal>
  );
}
