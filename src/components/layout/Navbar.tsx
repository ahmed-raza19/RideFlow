import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const roleDashboard = () => {
    if (!user?.role) return;
    const paths: Record<string, string> = {
      rider: '/rider',
      driver: '/driver',
      admin: '/admin',
    };
    navigate(paths[user.role] || '/');
  };

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-[50] h-[72px] flex items-center transition-all duration-300',
        scrolled
          ? 'bg-bg-base/82 backdrop-blur-[20px] border-b border-white/[0.06] shadow-lg shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="container-rf w-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-[1.375rem] text-warm-white no-underline">
          Ride<span className="text-amber-600">Flow</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Ride', href: '/#vehicles' },
            { label: 'Drive', href: '/#how-it-works' },
            { label: 'Safety', href: '/#safety' },
            { label: 'Support', href: '#' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="relative text-warm-white/70 text-sm font-medium hover:text-amber-400 transition-colors duration-200 group"
            >
              {label}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={roleDashboard}
                className="flex items-center gap-2 text-sm text-warm-muted hover:text-amber-400 transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <Button variant="glass" size="sm" onClick={logout} className="flex items-center gap-2">
                <LogOut size={16} />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="glass" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden btn-icon"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <User size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[72px] left-0 right-0 glass-3 p-6 flex flex-col gap-4 md:hidden"
          >
            {['Ride', 'Drive', 'Safety', 'Support'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-warm-white/80 font-medium hover:text-amber-400 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              {user ? (
                <Button variant="glass" fullWidth onClick={() => { roleDashboard(); setMenuOpen(false); }}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="glass" fullWidth onClick={() => { navigate('/login'); setMenuOpen(false); }}>
                    Sign In
                  </Button>
                  <Button variant="primary" fullWidth onClick={() => { navigate('/signup'); setMenuOpen(false); }}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
