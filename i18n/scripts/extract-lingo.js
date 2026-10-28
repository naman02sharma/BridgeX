#!/usr/bin/env node

/**
 * Lingo.dev Translation Extraction Script
 * 
 * This script extracts all translatable strings from the codebase
 * and prepares them for Lingo.dev translation
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const fs = require('fs')
const path = require('path')

// Base translations object
const baseTranslations = {
  // Navigation
  'navigation.home': 'Home',
  'navigation.about': 'About',
  'navigation.map': 'Emergency Map',
  'navigation.responders': 'NGOs & Hospitals',
  'navigation.contact': 'Contact',
  'navigation.docs': 'Documentation',
  'navigation.safety': 'Safety Guidelines',
  'navigation.support': 'Contact Support',
  'navigation.join': 'Join Network',
  'navigation.portal': 'Responder Portal',
  'navigation.dashboard': 'Dashboard',
  'navigation.login': 'Login',
  'navigation.register': 'Register',
  'navigation.logout': 'Logout',

  // Home Page
  'home.hero.title': 'Global Emergency Response Platform',
  'home.hero.subtitle': 'AI-driven multilingual emergency translation and coordination',
  'home.hero.cta.emergency': 'Send Emergency Alert',
  'home.hero.cta.join': 'Join as Responder',
  'home.emergencySOSSystem': 'Emergency SOS System',
  'home.emergencySOSDescription': 'Send emergency alerts in any language and get instant help',
  'home.emergencyResponseCenter': 'Emergency Response Center',
  'home.emergencyResponseCenterDescription': 'Real-time emergency coordination and response',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.submit': 'Submit',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.clear': 'Clear',
  'common.refresh': 'Refresh',
  'common.retry': 'Retry',

  // Emergency Types
  'emergency.fire': 'Fire',
  'emergency.medical': 'Medical',
  'emergency.police': 'Police',
  'emergency.disaster': 'Natural Disaster',
  'emergency.security': 'Security Threat',
  'emergency.general': 'General Emergency',

  // SOS Interface
  'sos.title': 'Emergency SOS',
  'sos.description': 'Send emergency alert in any language',
  'sos.message.placeholder': 'Describe your emergency...',
  'sos.selectLanguage': 'Select Language',
  'sos.sendAlert': 'Send Emergency Alert',
  'sos.cancel': 'Cancel',
  'sos.detecting': 'Detecting language...',
  'sos.translating': 'Translating...',
  'sos.sending': 'Sending alert...',
  'sos.success': 'Alert sent successfully',
  'sos.error': 'Failed to send alert',
  'sos.location': 'Location',
  'sos.shareLocation': 'Share my location',
  'sos.emergencyType': 'Emergency Type',

  // Translation Demo
  'translation.demo.title': 'Real-Time Translation Demo',
  'translation.demo.description': 'Test our AI-powered multilingual translation',
  'translation.demo.input.placeholder': 'Type your emergency message...',
  'translation.demo.translate': 'Translate',
  'translation.demo.translating': 'Translating...',
  'translation.demo.original': 'Original Text',
  'translation.demo.translated': 'Translated Text',
  'translation.demo.detectedType': 'Detected Emergency Type',
  'translation.demo.severity': 'Severity',
  'translation.demo.time': 'Translation Time',
  'translation.demo.stats.languages': 'Languages',
  'translation.demo.stats.avgTime': 'Avg Time',
  'translation.demo.stats.accuracy': 'Accuracy',

  // Map
  'map.title': 'Live Emergency Map',
  'map.description': 'Track active emergencies in real-time',
  'map.activeAlerts': 'Active Alerts',
  'map.nearbyResponders': 'Nearby Responders',
  'map.nearbyHospitals': 'Nearby Hospitals',
  'map.nearbyPolice': 'Nearby Police Stations',
  'map.findLocation': 'Find my location',

  // Responders
  'responders.title': 'Emergency Responders',
  'responders.description': 'Network of verified emergency responders',
  'responders.become': 'Become a Responder',
  'responders.verify': 'Verify Credentials',
  'responders.available': 'Available',
  'responders.busy': 'Busy',
  'responders.offline': 'Offline',

  // About
  'about.title': 'About BridgeX',
  'about.mission': 'Our Mission',
  'about.vision': 'Our Vision',
  'about.team': 'Our Team',
  'about.technology': 'Technology',

  // Contact
  'contact.title': 'Contact Us',
  'contact.description': 'Get in touch with our support team',
  'contact.name': 'Name',
  'contact.email': 'Email',
  'contact.message': 'Message',
  'contact.send': 'Send Message',
  'contact.success': 'Message sent successfully',
  'contact.error': 'Failed to send message',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.overview': 'Overview',
  'dashboard.activeAlerts': 'Active Alerts',
  'dashboard.respondedAlerts': 'Responded Alerts',
  'dashboard.profile': 'Profile',
  'dashboard.settings': 'Settings',
  'dashboard.notifications': 'Notifications',

  // Auth
  'auth.login.title': 'Login to BridgeX',
  'auth.register.title': 'Create Account',
  'auth.email': 'Email Address',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm Password',
  'auth.forgotPassword': 'Forgot Password?',
  'auth.rememberMe': 'Remember Me',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.signUp': 'Sign Up',
  'auth.signIn': 'Sign In',
  'auth.signOut': 'Sign Out',

  // Errors
  'error.generic': 'Something went wrong',
  'error.network': 'Network error',
  'error.unauthorized': 'Unauthorized',
  'error.notFound': 'Not found',
  'error.serverError': 'Server error',
  'error.validation': 'Validation error',

  // Features
  'features.title': 'Features',
  'features.multilingual.title': 'Multilingual Support',
  'features.multilingual.description': 'Communicate in 100+ languages',
  'features.realtime.title': 'Real-Time Alerts',
  'features.realtime.description': 'Instant emergency notifications',
  'features.aiPowered.title': 'AI-Powered',
  'features.aiPowered.description': 'Smart emergency classification',
  'features.geoLocation.title': 'Geo-Location',
  'features.geoLocation.description': 'Precise location tracking',

  // Footer
  'footer.description': 'Global emergency response platform connecting crisis responders worldwide',
  'footer.quickLinks': 'Quick Links',
  'footer.resources': 'Resources',
  'footer.legal': 'Legal',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.cookies': 'Cookie Policy',
  'footer.copyright': '© 2024 BridgeX. All rights reserved.',
  'footer.poweredBy': 'Powered by Lingo.dev',
}

// Save base English translations
const outputDir = path.join(__dirname, '../../public/i18n/locales')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

fs.writeFileSync(
  path.join(outputDir, 'en.json'),
  JSON.stringify(baseTranslations, null, 2)
)

console.log('✅ Extracted base translations to public/i18n/locales/en.json')
console.log(`📊 Total keys: ${Object.keys(baseTranslations).length}`)

// Create extraction manifest for Lingo.dev CLI
const manifest = {
  sourceLocale: 'en',
  locales: ['es', 'fr', 'ru', 'de', 'ja', 'zh', 'ar', 'ko'],
  sourceFile: 'public/i18n/locales/en.json',
  outputPattern: 'public/i18n/locales/{locale}.json',
  namespace: 'common',
  context: 'emergency_response',
  glossary: {
    'BridgeX': 'BridgeX',
    'SOS': 'SOS',
    'Responder': 'Responder',
  },
}

fs.writeFileSync(
  path.join(__dirname, '../lingo-manifest.json'),
  JSON.stringify(manifest, null, 2)
)

console.log('✅ Created Lingo.dev extraction manifest')
console.log('\n🚀 Next steps:')
console.log('1. Run: lingo translate --input i18n/locales/en.json')
console.log('2. Or use the GitHub Action for automatic translation')
