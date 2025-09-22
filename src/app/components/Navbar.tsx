'use client';

import Link from 'next/link';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'DASHBOARD', path: '/dashboard' },
    { name: 'FEATURES', path: '/features' },
    { name: 'PRICING', path: '/pricing' },
    { name: 'DEMO', path: '/demo' },
    { name: 'CASE STUDIES', path: '/case-studies' },
    { name: 'ANALYTICS', path: '/analytics' },
    { name: 'CALLS', path: '/calls' },
    { name: 'PROFILE', path: '/profile' },
    { name: 'CONTACT', path: '/support' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900 shadow-lg' : 'bg-gray-900/80'} rounded-b-xl`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo with pulse animation */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="text-white text-2xl font-bold"
          >
            <Link href="/" className="flex items-center">
              <Image src="/favicon.ico" alt="Logo" width={32} height={32} className="h-8 w-8 mr-2" />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <ul className="flex space-x-10">
              {navItems.map((item) => (
                <li key={item.path} className="relative group">
                  <Link 
                    href={item.path} 
                    className={`text-white uppercase font-bold text-sm tracking-wider transition-colors duration-300 ${pathname === item.path ? 'text-blue-400' : 'hover:text-blue-300'}`}
                  >
                    {item.name}
                    {pathname === item.path && (
                      <motion.span 
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400 rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                  <div className="absolute h-0.5 w-0 bg-blue-400 group-hover:w-full transition-all duration-300 bottom-0 left-0" />
                </li>
              ))}
            </ul>

            {/* Auth Button */}
            {!isLoaded ? (
              <div className="w-20 h-10 bg-gray-700 rounded-full animate-pulse"></div>
            ) : (
              <>
                <SignedIn>
                  <div className="flex items-center space-x-4">
                    {user && (
                      <span className="text-gray-300 text-sm">Hi, {user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0]}</span>
                    )}
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full text-sm uppercase tracking-wider transition-all duration-300"
                    >
                      Sign In
                    </motion.button>
                  </SignInButton>
                </SignedOut>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-6 flex flex-col items-end space-y-1.5">
              <span className={`${`h-0.5 bg-cyan-300 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`}`}></span>
              <span className={`${`h-0.5 bg-cyan-300 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'w-4'}`}`}></span>
              <span className={`${`h-0.5 bg-cyan-300 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'w-6 -rotate-45 -translate-y-2' : 'w-2'}`}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden fixed inset-0 bg-gray-900/95 backdrop-blur-sm pt-24 z-40"
          >
            <div className="container mx-auto px-6">
              <ul className="flex flex-col space-y-8">
                {navItems.map((item, index) => (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: 0.1 + index * 0.05 }
                    }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Link 
                      href={item.path} 
                      className={`text-white uppercase font-bold text-xl ${pathname === item.path ? 'text-blue-400' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              {/* Mobile Auth Button */}
              <div className="mt-12 space-y-4">
                <SignedIn>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-300">{user?.primaryEmailAddress?.emailAddress}</div>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                      exit={{ opacity: 0, y: 20 }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-10 rounded-full text-lg uppercase tracking-wider"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </motion.button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;