import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function Navbar({ onLoginClick, onSignupClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the admin dashboard
  const isAdminDashboard = location.pathname === '/admin';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Safety', href: '#safety' },
    { label: 'Drive', href: '#drive' },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(10,9,8,0.82)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.06)]' : 'bg-transparent border-transparent'
      }`}
      style={{ height: '72px' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left side - Logo only */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-display font-bold">
            <span className="text-text-primary">Ride</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-[#C2410C]">Flow</span>
          </Link>
        </div>

        {/* Center - Navigation links (hidden on admin dashboard) */}
        {!isAdminDashboard && (
          <nav className="hidden md:flex gap-6 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-text-secondary hover:text-text-primary relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-[#C2410C] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
        )}

        {/* Right side - User info and actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated() && user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-text-primary">{user.firstName} {user.lastName}</span>
                <Badge variant="info" className="scale-75 origin-right -mt-0.5">{user.role}</Badge>
              </div>
              <Button variant="gradient-border" size="sm" onClick={() => {
                const dashboardRoute = user.role.toLowerCase() === 'rider' ? '/customer' : `/${user.role.toLowerCase()}`;
                navigate(dashboardRoute);
              }}>
                Dashboard
              </Button>
              <Button variant="icon" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <>
              <Button variant="glass" size="sm" onClick={onLoginClick}>Sign In</Button>
              <Button variant="primary" size="sm" onClick={onSignupClick}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-text-primary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-bg-elevated border-b border-glass-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {!isAdminDashboard && navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-text-primary font-medium" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}
              {!isAdminDashboard && <hr className="border-glass-border my-2" />}
              {isAuthenticated() && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span>{user.firstName} {user.lastName}</span>
                    <Badge variant="info">{user.role}</Badge>
                  </div>
                  <Button variant="gradient-border" onClick={() => { 
                    const dashboardRoute = user.role.toLowerCase() === 'rider' ? '/customer' : `/${user.role.toLowerCase()}`;
                    navigate(dashboardRoute); 
                    setMobileOpen(false); 
                  }}>
                    Dashboard
                  </Button>
                  <Button variant="glass" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="glass" onClick={() => { setMobileOpen(false); onLoginClick?.(); }}>Sign In</Button>
                  <Button variant="primary" onClick={() => { setMobileOpen(false); onSignupClick?.(); }}>Get Started</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
