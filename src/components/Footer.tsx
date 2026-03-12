'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-context';
import { Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

// BMRCL Logo SVG Component (same as Header)
function BmrclLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="BMRCL Logo">
      <circle cx="50" cy="50" r="48" fill="#7B2D8B" />
      <circle cx="50" cy="50" r="38" fill="#00A550" />
      <circle cx="50" cy="50" r="28" fill="#FFFFFF" />
      <path
        d="M30 65 L30 40 L50 55 L70 40 L70 65 L62 65 L62 52 L50 62 L38 52 L38 65 Z"
        fill="#7B2D8B"
      />
    </svg>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { key: 'footer.about' as const, href: '#' },
    { key: 'footer.contact' as const, href: '#' },
    { key: 'footer.terms' as const, href: '#' },
    { key: 'footer.accessibility' as const, href: '#' },
    { key: 'footer.rti' as const, href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/nammaMetroBMRCL', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/nammaMetro', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/nammaMetroBMRCL', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/nammaMetro', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BmrclLogo className="w-12 h-12" />
              <div>
                <span className="text-[#a855f7] font-bold text-sm">Bangalore Metro Rail</span>
                <br />
                <span className="text-[#22c55e] font-bold text-sm">Corporation Limited</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition text-sm"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <div className="space-y-3">
              <a
                href="tel:1800-425-1663"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition"
              >
                <div className="w-8 h-8 bg-[#7B2D8B] rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('footer.helpline')}</p>
                  <p className="font-semibold text-white">1800-425-1663</p>
                </div>
              </a>
              <a
                href="mailto:customercare@bmrc.co.in"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition"
              >
                <div className="w-8 h-8 bg-[#00A550] rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('footer.email')}</p>
                  <p className="font-semibold text-white text-sm">customercare@bmrc.co.in</p>
                </div>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Follow Us</h3>
            <div className="flex gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-[#7B2D8B] rounded-full flex items-center justify-center transition"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            {/* App badges placeholder */}
            <div className="mt-6 flex gap-2">
              <div className="h-10 w-32 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500">
                App Store
              </div>
              <div className="h-10 w-32 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500">
                Play Store
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
