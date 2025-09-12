'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function AnimatedNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navItems = [
    { href: '/', label: 'HOME' },
    { href: '/features', label: 'FEATURES' },
    { href: '/pricing', label: 'PRICING' },
    { href: '/demo', label: 'DEMO' },
    { href: '/case-studies', label: 'CASE STUDIES' },
    { href: '/analytics', label: 'ANALYTICS' },
    { href: '/calls', label: 'CALLS' },
    { href: '/trending-niches', label: 'TRENDING' },
    { href: '/testimonials', label: 'TESTIMONIALS' },
    { href: '/support', label: 'CONTACT' },
    { href: '/profile', label: 'PROFILE' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-700/30'
            : 'bg-gray-900/30 backdrop-blur-sm'
        } rounded-b-2xl`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/clairo_logo.svg"
                  alt="Clairo Logo"
                  width={32}
                  height={32}
                  className="w-9 h-9 transition-all duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-40 transition-all duration-300 blur-sm animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent tracking-tight">
                CLAIRO
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-10 relative">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative group py-3 px-4 text-sm font-bold tracking-wider transition-all duration-300 ease-in-out ${
                    pathname === item.href ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              {isLoaded && user ? (
                <>
                  <span className="text-sm text-gray-300">Welcome, {user.firstName}</span>
                  <SignOutButton>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-full hover:scale-105 transition-transform">
                      Sign Out
                    </button>
                  </SignOutButton>
                </>
              ) : isLoaded ? (
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                >
                  Sign In
                </Link>
              ) : null}
            </div>

            <div className="lg:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === item.href
                      ? 'text-white bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              {isLoaded && user ? (
                <div className="px-5">
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <Image className="h-10 w-10 rounded-full" src={user.imageUrl} alt="" width={40} height={40} />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm font-medium leading-none text-gray-400">
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                  </div>
                  <SignOutButton>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-left block px-3 py-2 mt-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              ) : isLoaded ? (
                <div className="px-2 space-y-1">
                  <Link
                    href="/sign-in"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}