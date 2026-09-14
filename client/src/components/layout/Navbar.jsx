import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, LayoutDashboard, Calendar, Settings, Menu, X, Sparkles, Scan, Users, Award, Sun, Moon, Home as HomeIcon, ChevronDown, Gamepad2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <HomeIcon className="w-4 h-4" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Winners', path: '/winners', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'User Care', path: '/support', icon: <Menu className="w-4 h-4" /> },
  ];

  const authLinks = user ? [
    { name: 'Dashboard', path: user.role === 'Admin' ? '/admin/dashboard' : '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Games', path: '/games', icon: <Gamepad2 className="w-4 h-4" /> },
    ...((user.role === 'Association Member' || user.role === 'Admin') ? [
      { name: 'Scanner', path: '/scanner', icon: <Scan className="w-4 h-4" /> }
    ] : []),
    ...((['Admin', 'Faculty', 'Class Coordinator', 'Program Coordinator', 'Association Member', 'Association Coordinator'].includes(user.role)) ? [
      { name: 'Work Requests', path: '/work-requests', icon: <Settings className="w-4 h-4" /> }
    ] : []),
    ...((user.role === 'Participant' || user.role === 'Student' || user.role === 'Association Member') ? [
      { name: 'Nominate', path: '/nominate', icon: <Award className="w-4 h-4" /> }
    ] : [])
  ] : [
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register', primary: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ${scrolled ? 'py-3 glass shadow-md border-b-0' : 'py-6 bg-transparent border-b border-transparent' } dark:text-white`}>
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={isDarkMode ? "/MCET_LOGO_DARKMODE.png" : "/MCET_LOGO_LIGHTMODE.png"} 
            alt="MCET Logo" 
            className="h-12 object-contain transition-transform" 
          />
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
          <img src="/DigiflashLogo.png" alt="Digiflash Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white hidden sm:block">
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
                
                {/* Profile Dropdown Triggered by Name/Avatar Button */}
                <div className="relative z-[10000]" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className="flex items-center gap-2 p-1.5 pr-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold overflow-hidden border border-primary-200 dark:border-primary-800">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{user.username}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden py-2 z-[10000]"
                      >
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.username}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                        <Link 
                          to={user.role === 'Association Member' ? '/association-profile' : '/profile'} 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }} 
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold overflow-hidden border border-primary-200 dark:border-primary-800">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <Link 
                    to={user.role === 'Association Member' ? '/association-profile' : '/profile'} 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 text-lg font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 text-lg font-bold text-red-500 hover:text-red-600">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
