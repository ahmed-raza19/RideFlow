import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, ArrowRight, Star, ShieldCheck, Zap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { signInSchema, type SignInFormValues } from '@/lib/validators';
import { useAppStore } from '@/store/useAppStore';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { fadeSlideUp, scaleIn } from '@/lib/motion';

const perks = [
  { icon: <Zap size={16} />,         text: 'Avg. pickup in 3.2 minutes' },
  { icon: <Star size={16} />,        text: '4.9★ rated drivers nationwide' },
  { icon: <ShieldCheck size={16} />, text: 'GPS-tracked, 24/7 support' },
];

// ── Inline feedback banner ────────────────────────────────────────
function Banner({
  type,
  message,
}: {
  type: 'error' | 'success';
  message: string;
}) {
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
      {type === 'error' ? (
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
      )}
      <span>{message}</span>
    </motion.div>
  );
}

export default function LoginPage() {
  const { signIn, authLoading, authError, clearAuthError } = useAppStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: SignInFormValues) => {
    clearAuthError();
    try {
      const redirect = await signIn(data.emailOrPhone, data.password);
      navigate(redirect);
    } catch {
      // error already stored in authError
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel — form ────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">

        {/* Logo */}
        <motion.div {...fadeSlideUp} className="mb-10 self-start max-w-[440px] w-full mx-auto">
          <Link to="/" className="font-display text-2xl text-warm-white">
            Ride<span className="text-amber-600">Flow</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div {...scaleIn} className="glass-3 rounded-3xl p-10 w-full max-w-[440px] mx-auto">
          <h1 className="font-display text-[1.85rem] text-warm-white mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-warm-muted mb-7">
            Sign in to continue your journey
          </p>

          {/* Error / success banner */}
          <AnimatePresence mode="wait">
            {authError && <Banner key="err" type="error" message={authError} />}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormInput
              label="Email or Phone Number"
              type="email"
              error={errors.emailOrPhone?.message}
              {...register('emailOrPhone')}
              disabled={authLoading}
            />
            <FormInput
              label="Password"
              type="password"
              error={errors.password?.message}
              {...register('password')}
              disabled={authLoading}
            />

            <div className="flex justify-end mb-6 -mt-3">
              <a href="#" className="text-sm text-amber-600 hover:text-amber-400 transition-colors">
                Forgot password?
              </a>
            </div>

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
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="form-divider">or continue with</div>

          {/* Social (UI only — extend when OAuth is ready) */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              type="button"
              className="btn btn-glass w-full flex items-center gap-3 px-5 py-3 rounded-xl opacity-60 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Chrome size={18} className="text-amber-400" />
              <span className="text-sm">Continue with Google</span>
              <span className="ml-auto text-[10px] uppercase tracking-widest text-warm-faint">Soon</span>
            </button>
            <button
              type="button"
              className="btn btn-glass w-full flex items-center gap-3 px-5 py-3 rounded-xl opacity-60 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <span className="text-amber-400 text-base leading-none font-bold"></span>
              <span className="text-sm">Continue with Apple</span>
              <span className="ml-auto text-[10px] uppercase tracking-widest text-warm-faint">Soon</span>
            </button>
          </div>

          {/* Switch */}
          <p className="text-center text-sm text-warm-muted mt-7">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              Create one →
            </Link>
          </p>
        </motion.div>

        {/* Demo hint */}
        <motion.div
          {...fadeSlideUp}
          transition={{ delay: 0.4 }}
          className="mt-5 max-w-[440px] w-full mx-auto rounded-2xl px-5 py-4"
          style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)' }}
        >
          <p className="text-xs text-warm-faint mb-2 font-semibold uppercase tracking-widest text-amber-600">
            Demo credentials (seeded users)
          </p>
          <div className="space-y-1.5 text-xs text-warm-muted font-mono">
            <p><span className="text-amber-500">rider@rideflow.test</span> — password: <span className="text-warm-white">Rider1234</span></p>
            <p><span className="text-amber-500">driver@rideflow.test</span> — password: <span className="text-warm-white">Driver123</span></p>
            <p><span className="text-amber-500">admin@rideflow.test</span> — password: <span className="text-warm-white">Admin1234</span></p>
          </div>
          <p className="text-[10px] text-warm-faint mt-2">
            Or sign up with any real email. Seeded users use Werkzeug hashed passwords.
          </p>
        </motion.div>
      </div>

      {/* ── Right panel — branding ───────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Ambient blobs */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,65,12,0.08) 0%, transparent 65%)' }}
          aria-hidden="true"
        />

        {/* Vertical divider */}
        <div
          className="absolute left-0 top-[10%] bottom-[10%] w-px"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(217,119,6,0.2), transparent)' }}
          aria-hidden="true"
        />

        {/* Central content */}
        <div className="relative z-10 text-center px-16 max-w-[520px]">
          {/* Glow orb */}
          <div className="flex items-center justify-center mb-10">
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(194,65,12,0.06) 60%, transparent 80%)',
                border: '1px solid rgba(217,119,6,0.2)',
              }}
            >
              <div
                className="w-28 h-28 rounded-full animate-float"
                style={{
                  background: 'radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(194,65,12,0.1) 70%)',
                  boxShadow: '0 0 60px rgba(217,119,6,0.3)',
                }}
              />
            </div>
          </div>

          <motion.h2
            {...fadeSlideUp}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl gradient-text mb-4 leading-tight"
          >
            Your ride.<br />Your flow.
          </motion.h2>

          <motion.p
            {...fadeSlideUp}
            transition={{ delay: 0.35 }}
            className="text-warm-muted text-base leading-relaxed mb-10"
          >
            Premium vehicles, professional drivers, seamless booking.
            Warm service — every single ride.
          </motion.p>

          {/* Perks */}
          <motion.div {...fadeSlideUp} transition={{ delay: 0.5 }} className="flex flex-col gap-3">
            {perks.map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 glass-1 rounded-xl px-5 py-3 text-left"
              >
                <span className="text-amber-500 flex-shrink-0">{icon}</span>
                <span className="text-sm text-warm-muted">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
