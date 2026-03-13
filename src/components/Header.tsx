'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation, LANGUAGE_OPTIONS, type Language } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-service';
import { Bell, ChevronDown, Menu, X, User, LogOut } from 'lucide-react';

// BMRCL Logo SVG Component
function BmrclLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="BMRCL Logo">
      {/* Outer circle - Purple */}
      <circle cx="50" cy="50" r="48" fill="#7B2D8B" />
      {/* Inner circle - Green */}
      <circle cx="50" cy="50" r="38" fill="#00A550" />
      {/* White center */}
      <circle cx="50" cy="50" r="28" fill="#FFFFFF" />
      {/* M letter stylized */}
      <path
        d="M30 65 L30 40 L50 55 L70 40 L70 65 L62 65 L62 52 L50 62 L38 52 L38 65 Z"
        fill="#7B2D8B"
      />
    </svg>
  );
}

export default function Header() {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === language);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d7e4d8] bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand Name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <BmrclLogo className="w-10 h-10 sm:w-12 sm:h-12" />
            <div className="hidden sm:block">
              <span className="text-[#7B2D8B] font-bold text-sm sm:text-base leading-tight">
                Bangalore Metro Rail
              </span>
              <br />
              <span className="text-[#00A550] font-bold text-sm sm:text-base leading-tight">
                Corporation Limited
              </span>
            </div>
            <span className="sm:hidden text-[#7B2D8B] font-bold text-lg">BMRCL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-black hover:text-[#7B2D8B] font-medium transition">
              {t('nav.home')}
            </Link>
            <Link href="/trains" className="text-black hover:text-[#7B2D8B] font-medium transition">
              {t('nav.trains')}
            </Link>
            <Link href="/commuter" className="text-black hover:text-[#00A550] font-medium transition">
              Live Map
            </Link>
            <Link href="/edge-gate" className="text-black hover:text-[#00A550] font-medium transition">
              Edge Gate
            </Link>
            <Link href="/xai-dashboard" className="text-black hover:text-[#7B2D8B] font-medium transition">
              XAI
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-black hover:text-[#7B2D8B] font-medium transition">
                  {t('nav.dashboard')}
                </Link>
                <Link href="/booking" className="text-black hover:text-[#00A550] font-medium transition">
                  {t('nav.booking')}
                </Link>
              </>
            )}
          </nav>

          {/* Right side: Lang toggle, notifications, user */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-black hover:bg-[#eef5ef] rounded-lg transition"
              >
                <span className="hidden sm:inline">{currentLang?.nativeLabel}</span>
                <span className="sm:hidden">{language.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-[#d7e4d8] py-1 z-50">
                  {LANGUAGE_OPTIONS.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setLanguage(opt.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                        language === opt.code ? 'text-[#7B2D8B] font-semibold bg-[#f1e8f4]' : 'text-black'
                      }`}
                    >
                      {opt.nativeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications (only when logged in) */}
            {user && (
              <Link
                href="/dashboard"
                className="relative p-2 text-black hover:text-[#7B2D8B] hover:bg-[#eef5ef] rounded-full transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#7B2D8B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu or Login */}
            {user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#7B2D8B] text-white rounded-lg hover:bg-[#6a2679] transition"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-[#d7e4d8] py-1 z-50">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-[#eef5ef]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      href="/wallet"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-[#eef5ef]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('nav.wallet')}
                    </Link>
                    <Link
                      href="/tickets"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-black hover:bg-[#eef5ef]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('nav.tickets')}
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 bg-[#00A550] text-white text-sm font-semibold rounded-lg hover:bg-[#008c44] transition"
              >
                {t('nav.login')}
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-black hover:bg-[#eef5ef] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#d7e4d8]">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/trains"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
              >
                {t('nav.trains')}
              </Link>
              <Link
                href="/commuter"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
              >
                Live Map
              </Link>
              <Link
                href="/edge-gate"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
              >
                Edge Gate
              </Link>
              <Link
                href="/xai-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
              >
                XAI Dashboard
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href="/booking"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
                  >
                    {t('nav.booking')}
                  </Link>
                  <Link
                    href="/tickets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
                  >
                    {t('nav.tickets')}
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-black hover:bg-[#eef5ef] rounded-lg"
                  >
                    {t('nav.wallet')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
