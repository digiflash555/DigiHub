import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, LayoutDashboard, Calendar, Settings, Menu, X, Sparkles, Scan, Users, Award, Sun, Moon, Home as HomeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <HomeIcon className="w-4 h-4" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Winners', path: '/winners', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'Support', path: '/support', icon: <Menu className="w-4 h-4" /> },
  ];

  const authLinks = user ? [
    { name: 'Dashboard', path: user.role === 'Admin' ? '/admin/dashboard' : '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ...((user.role === 'Association Member' || user.role === 'Admin') ? [
      { name: 'Scanner', path: '/scanner', icon: <Scan className="w-4 h-4" /> }
    ] : []),
    ...((['Admin', 'Faculty', 'Class Coordinator', 'Program Coordinator', 'Association Member', 'Association Coordinator'].includes(user.role)) ? [
      { name: 'Work Requests', path: '/work-requests', icon: <Settings className="w-4 h-4" /> }
    ] : []),
    ...((user.role === 'Participant' || user.role === 'Association Member') ? [
      { name: 'Nominate', path: '/nominate', icon: <Award className="w-4 h-4" /> }
    ] : []),
    { name: 'Profile', path: user.role === 'Association Member' ? '/association-profile' : '/profile', icon: <User className="w-4 h-4" /> },
  ] : [
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register', primary: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-lg border-b border-slate-200 dark:border-slate-800' : 'py-6 bg-transparent' } dark:text-white`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/DigiflashLogo.png" alt="Digiflash Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Digi<span className="text-primary-600 dark:text-primary-400">Hub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6 pr-6 border-r border-slate-200 dark:border-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 font-bold text-sm transition-colors ${location.pathname === link.path ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white' }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-6">
                {authLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center gap-2">
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
                <button onClick={handleLogout} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all shadow-sm">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 px-4">Login</Link>
                <Link to="/register" className="btn-premium py-2.5 px-6 !text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 overflow-hidden dark:text-white"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Theme</span>
                <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              {navLinks.concat(authLinks).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-lg font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              {user && (
                <button onClick={handleLogout} className="w-full flex items-center gap-3 text-lg font-bold text-red-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
