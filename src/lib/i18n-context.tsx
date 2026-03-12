'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Language Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type Language = 'en' | 'hi' | 'kn';

export const LANGUAGE_OPTIONS: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Translation Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TranslationKey =
  | 'brand.name'
  | 'brand.fullName'
  | 'nav.home'
  | 'nav.trains'
  | 'nav.booking'
  | 'nav.dashboard'
  | 'nav.wallet'
  | 'nav.tickets'
  | 'nav.notifications'
  | 'nav.login'
  | 'nav.logout'
  | 'nav.profile'
  | 'landing.checkTrains'
  | 'landing.bookTickets'
  | 'landing.tagline'
  | 'landing.subtitle'
  | 'footer.copyright'
  | 'footer.about'
  | 'footer.contact'
  | 'footer.terms'
  | 'footer.accessibility'
  | 'footer.rti'
  | 'footer.helpline'
  | 'footer.email'
  | 'trains.title'
  | 'trains.purpleLine'
  | 'trains.greenLine'
  | 'trains.station'
  | 'trains.timing'
  | 'trains.fare'
  | 'trains.distance'
  | 'auth.login'
  | 'auth.signup'
  | 'auth.name'
  | 'auth.email'
  | 'auth.phone'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.forgotPassword'
  | 'auth.loginBtn'
  | 'auth.signupBtn'
  | 'auth.noAccount'
  | 'auth.hasAccount'
  | 'dashboard.welcome'
  | 'dashboard.walletBalance'
  | 'dashboard.bookTrip'
  | 'dashboard.myTickets'
  | 'dashboard.eWallet'
  | 'dashboard.tripHistory'
  | 'dashboard.metroCard'
  | 'booking.title'
  | 'booking.source'
  | 'booking.destination'
  | 'booking.date'
  | 'booking.time'
  | 'booking.passengers'
  | 'booking.findRoute'
  | 'booking.confirm'
  | 'booking.pay'
  | 'booking.platform'
  | 'booking.totalFare'
  | 'booking.duration'
  | 'booking.insufficientBalance'
  | 'booking.addMoney'
  | 'ticket.title'
  | 'ticket.validFor'
  | 'ticket.expired'
  | 'ticket.platform'
  | 'ticket.doorSide'
  | 'ticket.passengers'
  | 'ticket.modify'
  | 'ticket.cancel'
  | 'ticket.cancelConfirm'
  | 'ticket.refund'
  | 'ticket.scanned'
  | 'wallet.title'
  | 'wallet.balance'
  | 'wallet.addMoney'
  | 'wallet.history'
  | 'wallet.credit'
  | 'wallet.debit'
  | 'wallet.refund'
  | 'wallet.topup'
  | 'wallet.noTransactions'
  | 'notifications.title'
  | 'notifications.markAllRead'
  | 'notifications.empty'
  | 'notifications.trainArriving'
  | 'notifications.delay'
  | 'notifications.platformChange'
  | 'notifications.doorSide'
  | 'notifications.crowdAlert'
  | 'common.cancel'
  | 'common.confirm'
  | 'common.close'
  | 'common.save'
  | 'common.loading';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Translations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'brand.name': 'Namma Metro',
    'brand.fullName': 'Bangalore Metro Rail Corporation Limited',
    'nav.home': 'Home',
    'nav.trains': 'Trains',
    'nav.booking': 'Book Ticket',
    'nav.dashboard': 'Dashboard',
    'nav.wallet': 'Wallet',
    'nav.tickets': 'My Tickets',
    'nav.notifications': 'Notifications',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.profile': 'Profile',
    'landing.checkTrains': 'Check Trains',
    'landing.bookTickets': 'Book Tickets',
    'landing.tagline': 'Smart Transit for Smart Bengaluru',
    'landing.subtitle': 'Fast, reliable, and eco-friendly metro travel',
    'footer.copyright': '© 2026 Bangalore Metro Rail Corporation Limited. All rights reserved.',
    'footer.about': 'About BMRCL',
    'footer.contact': 'Contact Us',
    'footer.terms': 'Terms & Conditions',
    'footer.accessibility': 'Accessibility',
    'footer.rti': 'RTI',
    'footer.helpline': 'Helpline',
    'footer.email': 'Email',
    'trains.title': 'Train Schedule & Fares',
    'trains.purpleLine': 'Purple Line',
    'trains.greenLine': 'Green Line',
    'trains.station': 'Station',
    'trains.timing': 'First/Last Train',
    'trains.fare': 'Fare (₹)',
    'trains.distance': 'Distance (km)',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.name': 'Full Name',
    'auth.email': 'Email Address',
    'auth.phone': 'Phone Number',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.loginBtn': 'Log In',
    'auth.signupBtn': 'Create Account',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'dashboard.welcome': 'Welcome',
    'dashboard.walletBalance': 'Wallet Balance',
    'dashboard.bookTrip': 'Book a Trip',
    'dashboard.myTickets': 'My Tickets',
    'dashboard.eWallet': 'E-Wallet',
    'dashboard.tripHistory': 'Trip History',
    'dashboard.metroCard': 'Metro Card No.',
    'booking.title': 'Book Your Journey',
    'booking.source': 'From Station',
    'booking.destination': 'To Station',
    'booking.date': 'Travel Date',
    'booking.time': 'Departure Time',
    'booking.passengers': 'Passengers',
    'booking.findRoute': 'Find Route',
    'booking.confirm': 'Confirm Booking',
    'booking.pay': 'Pay from Wallet',
    'booking.platform': 'Platform',
    'booking.totalFare': 'Total Fare',
    'booking.duration': 'Duration',
    'booking.insufficientBalance': 'Insufficient wallet balance',
    'booking.addMoney': 'Add Money',
    'ticket.title': 'Your Tickets',
    'ticket.validFor': 'Valid for',
    'ticket.expired': 'EXPIRED',
    'ticket.platform': 'Platform',
    'ticket.doorSide': 'Door Side',
    'ticket.passengers': 'Passengers',
    'ticket.modify': 'Modify',
    'ticket.cancel': 'Cancel',
    'ticket.cancelConfirm': 'Cancel this ticket?',
    'ticket.refund': 'Refund',
    'ticket.scanned': 'SCANNED',
    'wallet.title': 'E-Wallet',
    'wallet.balance': 'Current Balance',
    'wallet.addMoney': 'Add Money',
    'wallet.history': 'Transaction History',
    'wallet.credit': 'CREDIT',
    'wallet.debit': 'DEBIT',
    'wallet.refund': 'REFUND',
    'wallet.topup': 'Top-up',
    'wallet.noTransactions': 'No transactions yet',
    'notifications.title': 'Notifications',
    'notifications.markAllRead': 'Mark all read',
    'notifications.empty': 'No notifications',
    'notifications.trainArriving': 'Train Arriving',
    'notifications.delay': 'Delay Alert',
    'notifications.platformChange': 'Platform Change',
    'notifications.doorSide': 'Door Side Info',
    'notifications.crowdAlert': 'Crowd Alert',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.loading': 'Loading...',
  },
  hi: {
    'brand.name': 'नम्मा मेट्रो',
    'brand.fullName': 'बेंगलुरु मेट्रो रेल कॉर्पोरेशन लिमिटेड',
    'nav.home': 'होम',
    'nav.trains': 'ट्रेनें',
    'nav.booking': 'टिकट बुक करें',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.wallet': 'वॉलेट',
    'nav.tickets': 'मेरे टिकट',
    'nav.notifications': 'सूचनाएं',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.profile': 'प्रोफ़ाइल',
    'landing.checkTrains': 'ट्रेनें देखें',
    'landing.bookTickets': 'टिकट बुक करें',
    'landing.tagline': 'स्मार्ट बेंगलुरु के लिए स्मार्ट ट्रांजिट',
    'landing.subtitle': 'तेज़, विश्वसनीय और पर्यावरण अनुकूल मेट्रो यात्रा',
    'footer.copyright': '© 2026 बेंगलुरु मेट्रो रेल कॉर्पोरेशन लिमिटेड। सर्वाधिकार सुरक्षित।',
    'footer.about': 'BMRCL के बारे में',
    'footer.contact': 'संपर्क करें',
    'footer.terms': 'नियम और शर्तें',
    'footer.accessibility': 'सुगम्यता',
    'footer.rti': 'आरटीआई',
    'footer.helpline': 'हेल्पलाइन',
    'footer.email': 'ईमेल',
    'trains.title': 'ट्रेन समय सारणी और किराया',
    'trains.purpleLine': 'पर्पल लाइन',
    'trains.greenLine': 'ग्रीन लाइन',
    'trains.station': 'स्टेशन',
    'trains.timing': 'पहली/आखिरी ट्रेन',
    'trains.fare': 'किराया (₹)',
    'trains.distance': 'दूरी (किमी)',
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.name': 'पूरा नाम',
    'auth.email': 'ईमेल पता',
    'auth.phone': 'फ़ोन नंबर',
    'auth.password': 'पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.loginBtn': 'लॉग इन करें',
    'auth.signupBtn': 'खाता बनाएं',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.hasAccount': 'पहले से खाता है?',
    'dashboard.welcome': 'स्वागत है',
    'dashboard.walletBalance': 'वॉलेट बैलेंस',
    'dashboard.bookTrip': 'यात्रा बुक करें',
    'dashboard.myTickets': 'मेरे टिकट',
    'dashboard.eWallet': 'ई-वॉलेट',
    'dashboard.tripHistory': 'यात्रा इतिहास',
    'dashboard.metroCard': 'मेट्रो कार्ड नं.',
    'booking.title': 'अपनी यात्रा बुक करें',
    'booking.source': 'स्रोत स्टेशन',
    'booking.destination': 'गंतव्य स्टेशन',
    'booking.date': 'यात्रा तिथि',
    'booking.time': 'प्रस्थान समय',
    'booking.passengers': 'यात्री',
    'booking.findRoute': 'मार्ग खोजें',
    'booking.confirm': 'बुकिंग की पुष्टि करें',
    'booking.pay': 'वॉलेट से भुगतान करें',
    'booking.platform': 'प्लेटफॉर्म',
    'booking.totalFare': 'कुल किराया',
    'booking.duration': 'अवधि',
    'booking.insufficientBalance': 'अपर्याप्त वॉलेट बैलेंस',
    'booking.addMoney': 'पैसे जोड़ें',
    'ticket.title': 'आपके टिकट',
    'ticket.validFor': 'के लिए मान्य',
    'ticket.expired': 'समाप्त',
    'ticket.platform': 'प्लेटफॉर्म',
    'ticket.doorSide': 'दरवाजे की ओर',
    'ticket.passengers': 'यात्री',
    'ticket.modify': 'संशोधित करें',
    'ticket.cancel': 'रद्द करें',
    'ticket.cancelConfirm': 'यह टिकट रद्द करें?',
    'ticket.refund': 'रिफंड',
    'ticket.scanned': 'स्कैन किया गया',
    'wallet.title': 'ई-वॉलेट',
    'wallet.balance': 'वर्तमान शेष',
    'wallet.addMoney': 'पैसे जोड़ें',
    'wallet.history': 'लेन-देन इतिहास',
    'wallet.credit': 'क्रेडिट',
    'wallet.debit': 'डेबिट',
    'wallet.refund': 'रिफंड',
    'wallet.topup': 'टॉप-अप',
    'wallet.noTransactions': 'अभी तक कोई लेन-देन नहीं',
    'notifications.title': 'सूचनाएं',
    'notifications.markAllRead': 'सभी पढ़ा हुआ करें',
    'notifications.empty': 'कोई सूचना नहीं',
    'notifications.trainArriving': 'ट्रेन आ रही है',
    'notifications.delay': 'देरी अलर्ट',
    'notifications.platformChange': 'प्लेटफॉर्म बदलाव',
    'notifications.doorSide': 'दरवाजे की जानकारी',
    'notifications.crowdAlert': 'भीड़ अलर्ट',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.close': 'बंद करें',
    'common.save': 'सेव करें',
    'common.loading': 'लोड हो रहा है...',
  },
  kn: {
    'brand.name': 'ನಮ್ಮ ಮೆಟ್ರೋ',
    'brand.fullName': 'ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ರೈಲ್ ಕಾರ್ಪೊರೇಷನ್ ಲಿಮಿಟೆಡ್',
    'nav.home': 'ಮುಖಪುಟ',
    'nav.trains': 'ರೈಲುಗಳು',
    'nav.booking': 'ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.wallet': 'ವಾಲೆಟ್',
    'nav.tickets': 'ನನ್ನ ಟಿಕೆಟ್‌ಗಳು',
    'nav.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'nav.login': 'ಲಾಗಿನ್',
    'nav.logout': 'ಲಾಗ್ಔಟ್',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'landing.checkTrains': 'ರೈಲುಗಳನ್ನು ನೋಡಿ',
    'landing.bookTickets': 'ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ',
    'landing.tagline': 'ಸ್ಮಾರ್ಟ್ ಬೆಂಗಳೂರಿಗೆ ಸ್ಮಾರ್ಟ್ ಟ್ರಾನ್ಸಿಟ್',
    'landing.subtitle': 'ವೇಗ, ವಿಶ್ವಾಸಾರ್ಹ ಮತ್ತು ಪರಿಸರ ಸ್ನೇಹಿ ಮೆಟ್ರೋ ಪ್ರಯಾಣ',
    'footer.copyright': '© 2026 ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ರೈಲ್ ಕಾರ್ಪೊರೇಷನ್ ಲಿಮಿಟೆಡ್. ಎಲ್ಲಾ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    'footer.about': 'BMRCL ಬಗ್ಗೆ',
    'footer.contact': 'ಸಂಪರ್ಕಿಸಿ',
    'footer.terms': 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
    'footer.accessibility': 'ಪ್ರವೇಶಿಸುವಿಕೆ',
    'footer.rti': 'ಆರ್‌ಟಿಐ',
    'footer.helpline': 'ಹೆಲ್ಪ್‌ಲೈನ್',
    'footer.email': 'ಇಮೇಲ್',
    'trains.title': 'ರೈಲು ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ದರಗಳು',
    'trains.purpleLine': 'ನೇರಳೆ ಮಾರ್ಗ',
    'trains.greenLine': 'ಹಸಿರು ಮಾರ್ಗ',
    'trains.station': 'ನಿಲ್ದಾಣ',
    'trains.timing': 'ಮೊದಲ/ಕೊನೆಯ ರೈಲು',
    'trains.fare': 'ದರ (₹)',
    'trains.distance': 'ದೂರ (ಕಿಮೀ)',
    'auth.login': 'ಲಾಗಿನ್',
    'auth.signup': 'ಸೈನ್ ಅಪ್',
    'auth.name': 'ಪೂರ್ಣ ಹೆಸರು',
    'auth.email': 'ಇಮೇಲ್ ವಿಳಾಸ',
    'auth.phone': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.confirmPassword': 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    'auth.forgotPassword': 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
    'auth.loginBtn': 'ಲಾಗ್ ಇನ್',
    'auth.signupBtn': 'ಖಾತೆ ರಚಿಸಿ',
    'auth.noAccount': 'ಖಾತೆ ಇಲ್ಲವೇ?',
    'auth.hasAccount': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
    'dashboard.welcome': 'ಸ್ವಾಗತ',
    'dashboard.walletBalance': 'ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್',
    'dashboard.bookTrip': 'ಪ್ರಯಾಣ ಬುಕ್ ಮಾಡಿ',
    'dashboard.myTickets': 'ನನ್ನ ಟಿಕೆಟ್‌ಗಳು',
    'dashboard.eWallet': 'ಇ-ವಾಲೆಟ್',
    'dashboard.tripHistory': 'ಪ್ರಯಾಣ ಇತಿಹಾಸ',
    'dashboard.metroCard': 'ಮೆಟ್ರೋ ಕಾರ್ಡ್ ಸಂ.',
    'booking.title': 'ನಿಮ್ಮ ಪ್ರಯಾಣ ಬುಕ್ ಮಾಡಿ',
    'booking.source': 'ಮೂಲ ನಿಲ್ದಾಣ',
    'booking.destination': 'ಗಮ್ಯ ನಿಲ್ದಾಣ',
    'booking.date': 'ಪ್ರಯಾಣ ದಿನಾಂಕ',
    'booking.time': 'ಹೊರಡುವ ಸಮಯ',
    'booking.passengers': 'ಪ್ರಯಾಣಿಕರು',
    'booking.findRoute': 'ಮಾರ್ಗ ಹುಡುಕಿ',
    'booking.confirm': 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಿ',
    'booking.pay': 'ವಾಲೆಟ್‌ನಿಂದ ಪಾವತಿ',
    'booking.platform': 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    'booking.totalFare': 'ಒಟ್ಟು ದರ',
    'booking.duration': 'ಅವಧಿ',
    'booking.insufficientBalance': 'ಸಾಕಷ್ಟು ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲ',
    'booking.addMoney': 'ಹಣ ಸೇರಿಸಿ',
    'ticket.title': 'ನಿಮ್ಮ ಟಿಕೆಟ್‌ಗಳು',
    'ticket.validFor': 'ಗೆ ಮಾನ್ಯ',
    'ticket.expired': 'ಮುಕ್ತಾಯಗೊಂಡಿದೆ',
    'ticket.platform': 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    'ticket.doorSide': 'ಬಾಗಿಲು ಕಡೆ',
    'ticket.passengers': 'ಪ್ರಯಾಣಿಕರು',
    'ticket.modify': 'ಮಾರ್ಪಡಿಸಿ',
    'ticket.cancel': 'ರದ್ದುಮಾಡಿ',
    'ticket.cancelConfirm': 'ಈ ಟಿಕೆಟ್ ರದ್ದುಮಾಡುವುದೇ?',
    'ticket.refund': 'ಮರುಪಾವತಿ',
    'ticket.scanned': 'ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆ',
    'wallet.title': 'ಇ-ವಾಲೆಟ್',
    'wallet.balance': 'ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್',
    'wallet.addMoney': 'ಹಣ ಸೇರಿಸಿ',
    'wallet.history': 'ವಹಿವಾಟು ಇತಿಹಾಸ',
    'wallet.credit': 'ಕ್ರೆಡಿಟ್',
    'wallet.debit': 'ಡೆಬಿಟ್',
    'wallet.refund': 'ಮರುಪಾವತಿ',
    'wallet.topup': 'ಟಾಪ್-ಅಪ್',
    'wallet.noTransactions': 'ಇನ್ನೂ ವಹಿವಾಟುಗಳಿಲ್ಲ',
    'notifications.title': 'ಅಧಿಸೂಚನೆಗಳು',
    'notifications.markAllRead': 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ',
    'notifications.empty': 'ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ',
    'notifications.trainArriving': 'ರೈಲು ಬರುತ್ತಿದೆ',
    'notifications.delay': 'ವಿಳಂಬ ಎಚ್ಚರಿಕೆ',
    'notifications.platformChange': 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬದಲಾವಣೆ',
    'notifications.doorSide': 'ಬಾಗಿಲು ಮಾಹಿತಿ',
    'notifications.crowdAlert': 'ಜನಸಂದಣಿ ಎಚ್ಚರಿಕೆ',
    'common.cancel': 'ರದ್ದುಮಾಡಿ',
    'common.confirm': 'ದೃಢೀಕರಿಸಿ',
    'common.close': 'ಮುಚ್ಚಿ',
    'common.save': 'ಉಳಿಸಿ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'bmrcl_language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && ['en', 'hi', 'kn'].includes(stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
