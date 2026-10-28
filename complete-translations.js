const fs = require('fs');
const path = require('path');

// Complete translations for all 9 languages
const completeTranslations = {
  en: {
    navigation: {
      home: "Home",
      about: "About",
      map: "Map",
      responders: "Responders",
      contact: "Contact",
      dashboard: "Dashboard",
      logout: "Logout",
      login: "Login",
      register: "Register"
    },
    pages: {
      emergencyMap: "Emergency Map",
      joinNetwork: "Join Network",
      responderPortal: "Responder Portal",
      documentation: "Documentation",
      safetyGuidelines: "Safety Guidelines",
      contactSupport: "Contact Support"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      submit: "Submit",
      close: "Close",
      loading: "Loading",
      success: "Success",
      error: "Error",
      warning: "Warning",
      next: "Next",
      previous: "Previous",
      finish: "Finish",
      continue: "Continue"
    },
    emergency: {
      sendSOS: "SEND SOS",
      medicalEmergency: "Medical Emergency",
      fireEmergency: "Fire Emergency",
      securityEmergency: "Security Threat",
      otherEmergency: "Other Emergency",
      alertActive: "SOS Alert Active",
      respondersNotified: "Emergency responders have been notified",
      medicalEmergencyDesc: "Injuries, illness, medical crisis",
      fireEmergencyDesc: "Fire, smoke, or risk of fire",
      securityEmergencyDesc: "Violence, assault, safety threat",
      otherEmergencyDesc: "Accident or other urgent situation",
      selectEmergencyType: "Select Emergency Type",
      describeEmergency: "Describe your emergency",
      addVoiceMessage: "Add Voice Message",
      attachPhotos: "Attach Photos/Videos",
      sendAlert: "Send Alert",
      broadcasting: "Broadcasting Emergency...",
      yourLocation: "Your Location",
      panicMode: "PANIC MODE",
      panicModeDesc: "Hold for 3 seconds for instant emergency broadcast",
      locationDetected: "Location Detected",
      respondersAlerted: "responders alerted",
      emergencyBroadcast: "Emergency Broadcast Active"
    },
    forms: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      name: "Name",
      fullName: "Full Name",
      message: "Message",
      describeEmergency: "Describe your emergency situation",
      phoneNumber: "Phone Number",
      organization: "Organization",
      location: "Location",
      address: "Address",
      city: "City",
      country: "Country",
      emailAddress: "Email Address",
      yourMessage: "Your message",
      optional: "Optional"
    },
    auth: {
      welcomeBack: "Welcome back",
      signIn: "Sign in",
      signInToDashboard: "Sign in to access your emergency response dashboard",
      dontHaveAccount: "Don't have an account?",
      registerAsResponder: "Register as a responder",
      joinTheNetwork: "Join the network",
      registerAsVerifiedResponder: "Register to become a verified emergency responder",
      alreadyHaveAccount: "Already have an account?",
      createAccount: "Create Account",
      signingIn: "Signing in...",
      creatingAccount: "Creating account...",
      forgotPassword: "Forgot password?",
      rememberMe: "Remember me"
    },
    footer: {
      copyright: "© 2025 BridgeX. Empowering emergency response worldwide.",
      platform: "Platform",
      resources: "Resources",
      description: "AI-driven multilingual emergency translation and coordination platform connecting crisis responders worldwide. Saving lives across borders.",
      builtWith: "Built with",
      usingTech: "using Next.js & AI SDK"
    },
    home: {
      emergencyResponseWithoutBorders: "Emergency response without borders",
      aiPoweredPlatformDescription: "AI-powered multilingual platform connecting people in crisis with verified responders worldwide. Instant translation, real-time coordination, life-saving help in any language.",
      emergencySOSSystem: "Emergency SOS System",
      emergencySOSDescription: "Send emergency alerts with voice messages, attach photos/videos, and get instant help in your language",
      emergencyResponseCenter: "Emergency Response Center",
      emergencyResponseCenterDescription: "Real-time alerts, nearby responders, and live mapping for immediate emergency coordination"
    },
    features: {
      title: "Technology that saves lives",
      description: "Advanced AI and real-time coordination tools designed for emergency response",
      aiTranslation: "AI Translation",
      aiTranslationDescription: "Powered by advanced AI for instant, accurate translation in 100+ languages",
      smartLocation: "Smart Location",
      smartLocationDescription: "Automatically finds nearest hospitals, NGOs, and verified responders",
      realTimeAlerts: "Real-time Alerts",
      realTimeAlertsDescription: "SOS broadcasts reach responders in under 2 seconds with WebSocket technology",
      verifiedNetwork: "Verified Network",
      verifiedNetworkDescription: "All responders are verified organizations and trained volunteers",
      responderDashboard: "Responder Dashboard",
      responderDashboardDescription: "Comprehensive tools for NGOs and emergency services to manage incidents",
      globalCoverage: "Global Coverage",
      globalCoverageDescription: "Borderless emergency response connecting people worldwide 24/7"
    },
    howItWorks: {
      title: "How it works",
      subtitle: "From emergency to resolution in four seamless steps",
      badge: "Simple & Fast",
      step1Title: "Trigger SOS",
      step1Desc: "Press the emergency button. Your location is captured automatically.",
      step2Title: "AI Translation",
      step2Desc: "Your message is instantly translated into local languages of nearby responders.",
      step3Title: "Alert Broadcast",
      step3Desc: "Verified responders within your area receive your alert in real-time.",
      step4Title: "Live Coordination",
      step4Desc: "Chat with responders through multilingual real-time translation until help arrives."
    },
    globalImpact: {
      title: "Built for global emergencies",
      description: "Whether you're a traveler in a foreign country or facing a local crisis, BridgeX connects you with the right help instantly.",
      verifiedResponders: "Verified Responders",
      countriesCovered: "Countries Covered",
      languagesSupported: "Languages Supported",
      alwaysAvailable: "Always Available",
      joinGlobalNetwork: "Join our global emergency response network",
      becomeResponder: "Become a Responder"
    }
  },
  // Add other languages with their translations
};

// Spanish translations
completeTranslations.es = {
  ...completeTranslations.en,
  navigation: {
    home: "Inicio",
    about: "Acerca de",
    map: "Mapa",
    responders: "Respondedores",
    contact: "Contacto",
    dashboard: "Panel",
    logout: "Cerrar sesión",
    login: "Iniciar sesión",
    register: "Registrarse"
  },
  emergency: {
    sendSOS: "ENVIAR SOS",
    medicalEmergency: "Emergencia Médica",
    fireEmergency: "Emergencia de Incendio",
    securityEmergency: "Amenaza de Seguridad",
    otherEmergency: "Otra Emergencia",
    alertActive: "Alerta SOS Activa",
    respondersNotified: "Los respondedores de emergencia han sido notificados",
    medicalEmergencyDesc: "Lesiones, enfermedad, crisis médica",
    fireEmergencyDesc: "Fuego, humo o riesgo de incendio",
    securityEmergencyDesc: "Violencia, asalto, amenaza de seguridad",
    otherEmergencyDesc: "Accidente u otra situación urgente",
    selectEmergencyType: "Seleccionar Tipo de Emergencia",
    describeEmergency: "Describe tu emergencia",
    addVoiceMessage: "Añadir Mensaje de Voz",
    attachPhotos: "Adjuntar Fotos/Videos",
    sendAlert: "Enviar Alerta",
    broadcasting: "Transmitiendo Emergencia...",
    yourLocation: "Tu Ubicación",
    panicMode: "MODO PÁNICO",
    panicModeDesc: "Mantén presionado 3 segundos para transmisión de emergencia instantánea",
    locationDetected: "Ubicación Detectada",
    respondersAlerted: "respondedores alertados",
    emergencyBroadcast: "Transmisión de Emergencia Activa"
  },
  home: {
    emergencyResponseWithoutBorders: "Respuesta de emergencia sin fronteras",
    aiPoweredPlatformDescription: "Plataforma multilingüe impulsada por IA que conecta a personas en crisis con respondedores verificados en todo el mundo. Traducción instantánea, coordinación en tiempo real, ayuda vital en cualquier idioma.",
    emergencySOSSystem: "Sistema de Emergencia SOS",
    emergencySOSDescription: "Envía alertas de emergencia con mensajes de voz, adjunta fotos/videos y obtén ayuda instantánea en tu idioma",
    emergencyResponseCenter: "Centro de Respuesta de Emergencias",
    emergencyResponseCenterDescription: "Alertas en tiempo real, respondedores cercanos y mapeo en vivo para coordinación inmediata de emergencias"
  },
  features: {
    title: "Tecnología que salva vidas",
    description: "Herramientas avanzadas de IA y coordinación en tiempo real diseñadas para respuesta de emergencias",
    aiTranslation: "Traducción IA",
    aiTranslationDescription: "Impulsado por IA avanzada para traducción instantánea y precisa en más de 100 idiomas",
    smartLocation: "Ubicación Inteligente",
    smartLocationDescription: "Encuentra automáticamente hospitales, ONGs y respondedores verificados más cercanos",
    realTimeAlerts: "Alertas en Tiempo Real",
    realTimeAlertsDescription: "Las transmisiones SOS llegan a los respondedores en menos de 2 segundos con tecnología WebSocket",
    verifiedNetwork: "Red Verificada",
    verifiedNetworkDescription: "Todos los respondedores son organizaciones verificadas y voluntarios capacitados",
    responderDashboard: "Panel de Respondedor",
    responderDashboardDescription: "Herramientas completas para ONGs y servicios de emergencia para gestionar incidentes",
    globalCoverage: "Cobertura Global",
    globalCoverageDescription: "Respuesta de emergencia sin fronteras conectando personas en todo el mundo 24/7"
  }
};

// Function to convert flat keys to nested object
function flatToNested(flat) {
  const nested = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = nested;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return nested;
}

// Write to both locations
const localesDir = path.join(__dirname, 'public', 'i18n', 'locales');
const i18nDir = path.join(__dirname, 'i18n', 'locales');

for (const [lang, translations] of Object.entries(completeTranslations)) {
  const content = JSON.stringify(translations, null, 2);

  // Write to public/i18n/locales
  fs.writeFileSync(path.join(localesDir, `${lang}.json`), content);
  console.log(`✅ Updated ${lang}.json in public/i18n/locales`);

  // Write to i18n/locales
  fs.writeFileSync(path.join(i18nDir, `${lang}.json`), content);
  console.log(`✅ Updated ${lang}.json in i18n/locales`);
}

console.log('\n🎉 All translation files updated with complete coverage!');
