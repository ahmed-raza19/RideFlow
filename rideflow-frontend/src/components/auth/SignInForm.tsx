import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { FormInput } from '../ui/FormInput';
import { Button } from '../ui/Button';
import { authAPI } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../ui/Toast';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data.email, data.password);
      if (res.data.success) {
        setAuth(res.data.data.token, res.data.data.user);
        toast.success('Successfully signed in!');
        onSuccess();
        const role = res.data.data.user.role;
        navigate(`/${role.toLowerCase()}`);
      }
    } catch (err: any) {
      console.log('=== SIGNIN ERROR ===');
      console.log('Error:', err);
      console.log('Response:', err.response?.data);
      
      // Extract specific error message
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
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
      <div className="text-center mb-6">
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
          Welcome back
        </h3>
        <p className="text-sm text-text-muted">Enter your details to access your account</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <FormInput
          label="Email Address"
          type="email"
          error={errors.email?.message}
          register={register('email')}
          autoComplete="email"
          className="pl-12"
        />
        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/4 text-text-muted" size={18} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <FormInput
          label="Password"
          type={showPwd ? 'text' : 'password'}
          error={errors.password?.message}
          register={register('password')}
          autoComplete="current-password"
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPwd(!showPwd)}
          className="absolute right-4 top-1/2 transform -translate-y-1/4 text-text-muted hover:text-amber-400 transition-colors"
        >
          {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-glass-border bg-glass-bg-light text-amber-500 focus:ring-amber-500 focus:ring-2 focus:ring-offset-0"
          />
          <span className="text-sm text-text-muted group-hover:text-text-primary transition-colors">
            Remember me
          </span>
        </label>
        
        <a 
          href="#" 
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
        >
          Forgot password?
        </a>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <Button 
          type="submit" 
          loading={loading} 
          className="w-full py-4 text-lg font-semibold shadow-glow hover:shadow-glow-intense transition-all duration-300 group"
        >
          {loading ? 'Signing In...' : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight 
                size={20} 
                className="transform group-hover:translate-x-1 transition-transform duration-300" 
              />
            </span>
          )}
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pt-4 border-t border-glass-border"
      >
        <p className="text-sm text-text-muted">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => {/* This would switch to signup mode */}}
            className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            Sign up
          </button>
        </p>
      </motion.div>
    </form>
  );
}
