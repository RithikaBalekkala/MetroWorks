'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n-context';
import { Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { key: 'footer.about' as const, href: '/about' },
    { key: 'footer.contact' as const, href: '/contact' },
    { key: 'footer.terms' as const, href: '/terms' },
    { key: 'footer.accessibility' as const, href: '/accessibility' },
    { key: 'footer.rti' as const, href: '/rti' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/nammaMetroBMRCL', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/nammaMetro', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/nammaMetroBMRCL', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/nammaMetro', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#f6fbf7] to-[#edf5ef] text-black border-t border-[#d7e4d8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/namma-metro-logo.png"
                alt="Namma Metro logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <div>
                <span className="text-[#7B2D8B] font-extrabold text-base">ನಮ್ಮ ಮೆಟ್ರೋ</span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-[var(--text-muted)] hover:text-[#7B2D8B] transition text-sm"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">Contact Us</h3>
            <div className="space-y-3">
              <a
                href="tel:1800-425-1663"
                className="flex items-center gap-3 text-[var(--text-muted)] hover:text-black transition"
              >
                <div className="w-8 h-8 bg-[#7B2D8B] rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('footer.helpline')}</p>
                  <p className="font-semibold text-black">1800-425-1663</p>
                </div>
              </a>
              <a
                href="mailto:customercare@bmrc.co.in"
                className="flex items-center gap-3 text-[var(--text-muted)] hover:text-black transition"
              >
                <div className="w-8 h-8 bg-[#00A550] rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('footer.email')}</p>
                  <p className="font-semibold text-black text-sm">customercare@bmrc.co.in</p>
                </div>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-black">Follow Us</h3>
            <div className="flex gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white border border-[#d7e4d8] text-black hover:bg-[#7B2D8B] hover:text-white rounded-full flex items-center justify-center transition"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            {/* App badges placeholder */}
            <div className="mt-6 flex gap-2">
              <div className="h-10 w-32 bg-white border border-[#d7e4d8] rounded-lg flex items-center justify-center text-xs text-gray-600">
                App Store
              </div>
              <div className="h-10 w-32 bg-white border border-[#d7e4d8] rounded-lg flex items-center justify-center text-xs text-gray-600">
                Play Store
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#d7e4d8] text-center">
          <p className="text-gray-600 text-sm">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
