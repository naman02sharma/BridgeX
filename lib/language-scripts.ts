/**
 * Offline script-based language detection for Indian languages.
 * Pure functions, no network, safe on both client and server.
 */

export interface ScriptDetection {
  /** ISO 639-1 code, or null when the text is not mostly in an Indic script */
  lang: string | null
  /** Share (0-1) of letters that belong to the detected script */
  share: number
}

const RANGES: Array<{ lang: string; from: number; to: number }> = [
  { lang: "devanagari", from: 0x0900, to: 0x097f }, // Hindi / Marathi
  { lang: "bn", from: 0x0980, to: 0x09ff }, // Bengali
  { lang: "pa", from: 0x0a00, to: 0x0a7f }, // Gurmukhi (Punjabi)
  { lang: "gu", from: 0x0a80, to: 0x0aff }, // Gujarati
  { lang: "or", from: 0x0b00, to: 0x0b7f }, // Odia
  { lang: "ta", from: 0x0b80, to: 0x0bff }, // Tamil
  { lang: "te", from: 0x0c00, to: 0x0c7f }, // Telugu
  { lang: "kn", from: 0x0c80, to: 0x0cff }, // Kannada
  { lang: "ml", from: 0x0d00, to: 0x0d7f }, // Malayalam
]

// Words / letters that are strongly Marathi (vs. Hindi) in Devanagari
const MARATHI_MARKERS = /ळ|आहे|आहेत|आहोत|नाही|मला|माझ[ाीे]|तुम्ही|आम्ही|झाल[ाीे]|होत[ेा]|करा|वाचवा|पाहिजे|हवी|हवे|मदत|त्रास|अपघात|रुग्णालय|दवाखाना|पोलीस|आग|जीव|संकट|धावा|लवकर|कळवा|बेशुद्ध|चक्कर|रक्त|जखम|हृदय|छातीत|घरात|पेटली|भडका|मारहाण|चोर|पळा|द्या|होईल|कसं|कसा|कुठे|आलो|गेलो|होतोय|होतीये|लागलं|पडलो|पडला|पडली|जळाला|जळाली|फुटला|धडक|धडकले|दुखतंय|घाबरलो|धावपळ|विझवा|सांडलं|अडकलो|अडकले|आत्ता|त्वरित|तातडीने|येतोय|जातोय|सांगा|कळले|काय|केव्हा|किती|कोण|कुठून|आलेय|गेलेय|बघा|पहा|सांगतो|सांगतेय|लवकर या|रुग्णवाहिका|ऑक्सिजन|शस्त्रक्रिया|डोकेदुखी|पोटदुखी|उलटी|ताप|अंगदुखी|सर्दी|खोकला|श्वास|नाडी|रक्तदाब|मधुमेह|अर्धांगवायू|झटका|गर्भ|प्रसूती|बाळ|मुल|बालक|वृद्ध|थकवा|विश्रांती|औषधे|उपचार|शस्त्र|दंगल|लूटमार|अत्याचार|हल्ला|धमकी|अपहरण|बलात्कार|हत्या|खून|खंडणी|घरफोडी/g

const HINDI_MARKERS = /है|हैं|मैं|मुझे|मेरा|मेरी|मेरे|नहीं|कृपया|रहा|रही|रहे|बचाओ|चाहिए|हमें|आप|मदद|तकलीफ|दुर्घटना|अस्पताल|पुलिस|आग|जान|जल्दी|खतरा|खून|चोट|दर्द|दौरा|धुआं|मारपीट|चोरी|लूट|सांस|बेहोश|डॉक्टर|जहर|मरीज|जला|फटा|कहाँ|कैसे|हुआ|गया|आया|लग गई|हो गया|गिर गया|गिर गए|जल गया|टूट गई|टकरा गई|दम घुट|अटक गया|फंस गया|फंस गए|दुख रहा|घबरा|बुझाओ|तुरंत|अभी|मदद करो|बुलाओ|भेजो|क्या|कब|कितना|कौन|कैसे|कहाँ|यहाँ|वहाँ|इधर|उधर|ऊपर|नीचे|सामने|पीछे|अंदर|बाहर|रुको|आओ|जाओ|देखो|सुनो|बताओ|समझो|एम्बुलेंस|ऑक्सीजन|ऑपरेशन|सिरदर्द|पेटदर्द|उल्टी|बुखार|शरीर|नाड़ी|रक्तचाप|शुगर|लकवा|दौरा|गर्भ|प्रसव|बच्चा|बुजुर्ग|थकान|आराम|दवाई|इलाज|हथियार|दंगा|डकैती|अत्याचार|हमला|धमकी|अपहरण|बलात्कार|हत्या|खून|ब्लैकमेल|सेंधमारी/g

// Anything that is not whitespace, a digit, punctuation or a symbol counts as a letter.
// (Avoids \\p{...} regex escapes so it compiles for any TypeScript target.)
const NON_LETTER = /[\s0-9!-\/:-@\[-`{-~\u00A0-\u00BF\u2000-\u206F\u2190-\u2BFF\u0964\u0965\uFE0F]/
function isLetter(ch: string): boolean {
  return !NON_LETTER.test(ch) && (ch.codePointAt(0) as number) > 31
}
const LATIN_LETTER = /[A-Za-z\u00C0-\u024F]/

function matchCount(text: string, re: RegExp): number {
  return (text.match(re) || []).length
}

/** Detect which Indian language the text is written in, based on its script. */
export function detectIndicLanguage(text: string): ScriptDetection {
  const counts: Record<string, number> = {}
  let letters = 0

  for (const ch of text) {
    const cp = ch.codePointAt(0) as number
    if (isLetter(ch)) letters++
    for (const r of RANGES) {
      if (cp >= r.from && cp <= r.to) {
        counts[r.lang] = (counts[r.lang] || 0) + 1
        break
      }
    }
  }

  if (letters === 0) return { lang: null, share: 0 }

  let best: string | null = null
  let bestCount = 0
  for (const [lang, n] of Object.entries(counts)) {
    if (n > bestCount) {
      best = lang
      bestCount = n
    }
  }

  const share = bestCount / letters
  if (!best || share < 0.3) return { lang: null, share }

  if (best === "devanagari") {
    const mr = matchCount(text, MARATHI_MARKERS)
    const hi = matchCount(text, HINDI_MARKERS)
    return { lang: mr > hi ? "mr" : "hi", share }
  }

  return { lang: best, share }
}

/** True when the text is plain ASCII (English or romanised, e.g. "mujhe madad chahiye"). */
export function isMostlyAscii(text: string): boolean {
  let letters = 0
  let ascii = 0
  for (const ch of text) {
    if (isLetter(ch)) {
      letters++
      if ((ch.codePointAt(0) as number) < 128) ascii++
    }
  }
  return letters === 0 || ascii / letters > 0.9
}

/** Share of letters that are Latin script (used to sanity-check English output). */
export function latinShare(text: string): number {
  let letters = 0
  let latin = 0
  for (const ch of text) {
    if (isLetter(ch)) {
      letters++
      if (LATIN_LETTER.test(ch)) latin++
    }
  }
  return letters === 0 ? 1 : latin / letters
}

/** BCP-47 tag for the browser speech recognition API. */
export const speechLocales: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  pa: "pa-IN",
  te: "te-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  ur: "ur-IN",
  or: "or-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ar: "ar-SA",
  ru: "ru-RU",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
}

export interface VoiceLanguageOption {
  code: string
  bcp47: string
  name: string
  nativeName: string
  flag: string
}

export const supportedVoiceLanguages: VoiceLanguageOption[] = [
  { code: "hi", bcp47: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", bcp47: "mr-IN", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "en", bcp47: "en-IN", name: "English (India)", nativeName: "English", flag: "🇮🇳" },
  { code: "bn", bcp47: "bn-IN", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "te", bcp47: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", bcp47: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "gu", bcp47: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", bcp47: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", bcp47: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", bcp47: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", bcp47: "ur-IN", name: "Urdu", nativeName: "اردو", flag: "🇮🇳" },
  { code: "or", bcp47: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "en-US", bcp47: "en-US", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸" },
  { code: "es", bcp47: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", bcp47: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", bcp47: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ar", bcp47: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
]

/**
 * Romanised/transliterated keyword detection for all Indian & international languages.
 */
const ROMANISED_KEYWORDS: Record<string, RegExp> = {
  mr: /\b(aag lagli|aag laagali|ambulance pathva|madat kara|madat havi|jeev vachva|dakhavla|haad todala|rakt yete|hospital naya|dokayla dukhatay|pota dukhatay|tumhi|amhi|aahe|aahat|nahi|zhala|jhala|jhali|gela|aala|mhanje|kaay|kiti|kuthe|keva|kona|bapre|dhava|lavkar|shwas|chakkar|bheshuddha|chot lagli|apghat|police bolva|marhan)\b/i,
  hi: /\b(aag lagi|aag lag gayi|ambulance bhejo|madad karo|madad chahiye|jaan bachao|bachao bachao|hospital le jao|doctor bulao|khoon aa raha|sar dard|pet dard|ulti|bukhar|saans nahi|behosh|gir gaya|takkar|dhamaka|chor|police bulao|maar raha|lutera|goli chal|chhuri|beta|bhai|maa|baap|abhi|jaldi|yahan|wahan|kaise|kya|kyun|kab|idhar|udhar|chot|chot lagi|durghatna|taklif|mara|mar gaya)\b/i,
  bn: /\b(aagun legechhe|sahajjo korun|bachan|rokto porchhe|asustho|daktar dakhun|ambulance pathan|batha|ghoraye|ghare agun|police dakun|accident hoyechhe|marpit|mathay aghat|pran bachan|hath bhengechhe|pa bhengechhe|kothay|keno|ki hoyechhe|tahole|kichu)\b/i,
  ta: /\b(thee pidithathu|neruppu|kaapathunga|uthavi seiyavum|raththam|maruthuvamanaikku|maruthuvar|vali|uyir|abathu|kall odanchiduchi|kai odanchiduchi|police koopidunga|ambulance anupunga|mayakkam|moochu vida mudiyala|ennachu|eppadi|enge|vanga)\b/i,
  te: /\b(manta antukundi|sahayam cheyandi|kapadandi|raktham|asupatriki|doctor kavali|gaayam|noppi|pramadam|cheyyi virigindi|kalu virigindi|police pilavandi|ambulance pampandi|spruha thappi|oopiri aadtledu|ela unnaru|ekkada|enduku|tvaraga randi)\b/i,
  gu: /\b(aag laagi|madad karo|bachavo|lohi nikle che|dawakhana|aspataal|dard thaay che|chakkaro aave che|behoshi|haadko bhangi gayo|police bolavo|ambulance moklo|taphleek|jaldi aavo|kai rite|kem|kya chho|aaje)\b/i,
  kn: /\b(benki bidhdhide|sahaya madi|bachisi|raktha barthide|aaspatrege|doctor beku|gaya|novu|apaghata|kai muride|kaalu muride|police karesi|ambulance kalisi|moorche|usiru kattuthide|hegidhdheera|elli|yavaga|bega banni)\b/i,
  ml: /\b(thee pidichu|sahayikku|rakshikku|chora varunnu|aasupathriyil|doctor venam|murivu|vedhana|apakatam|kai odinju|kaal odinju|police vilikku|ambulance ayakkuka|bodham kettu|shwasam kittunnilla|evide|engane|vegam varu)\b/i,
  pa: /\b(agg lagg gayi|madad karo|bachao|khoon peya vaggda|aspatal|doctor bulao|dard hunda|chakkar aunde|behosh ho gya|haddi tutt gayi|police bulao|ambulance bhejo|chheti aao|kiddan|kithe|kyon|aaj)\b/i,
  ur: /\b(aag lag gayi|madad kijiye|jaan bachaiye|khoon beh raha hai|aspataal le chalo|tabeeb ko bulao|dard ho raha hai|behosh ho gaya|hadsi|police ko khabar do|ambulance bhejiye|jaldi kijiye|kahan|kyun|idhar aao)\b/i,
  or: /\b(nia lagichi|sahajya karantu|rakshya karantu|rakta bahuchi|daktarkhana|chot lagichi|bisa|chakkar asuchi|ambulance pathantu|police dakantu|sighra asantu|kahinki|kouthi)\b/i,
  es: /\b(ayuda|fuego|incendio|emergencia|socorro|herido|ambulancia|hospital|dolor|sangre|accidente|auxilio|por favor|socorreme|urgente|rapido)\b/i,
  fr: /\b(aidez-moi|au secours|feu|incendie|urgence|blessé|ambulance|hopital|douleur|sang|accident|sauvez-moi|vite|police)\b/i,
  de: /\b(hilfe|feuer|brand|notfall|verletzt|krankenwagen|krankenhaus|schmerz|blut|unfall|retten sie mich|schnell|polizei)\b/i,
  ar: /\b(musaada|najda|hareeq|tawari|is'af|mustashfa|dam|majrooh|alam|hadith|injadouni|bi-sur'a)\b/i,
}

/**
 * Detect romanised Indic & international text (written in Latin script).
 * Returns matching language code or null.
 */
export function detectRomanisedIndic(text: string): string | null {
  const lower = text.toLowerCase()
  let bestLang: string | null = null
  let maxMatches = 0

  for (const [lang, re] of Object.entries(ROMANISED_KEYWORDS)) {
    const matches = (lower.match(re) || []).length
    if (matches > maxMatches) {
      maxMatches = matches
      bestLang = lang
    }
  }

  return maxMatches > 0 ? bestLang : null
}

/**
 * Instant offline emergency translation dictionary for critical phrases
 */
export const OFFLINE_EMERGENCY_DICTIONARY: Record<string, Record<string, string>> = {
  "help": {
    hi: "मदद करो",
    mr: "मदत करा",
    bn: "সাহায্য করুন",
    ta: "உதவி செய்யுங்கள்",
    te: "సహాయం చేయండి",
    gu: "મદદ કરો",
    kn: "ಸಹಾಯ ಮಾಡಿ",
    ml: "സহായിക്കൂ",
    pa: "ਮਦद ਕਰੋ",
    ur: "مدد کرو",
    es: "Ayuda",
    fr: "Aide",
    de: "Hilfe",
    en: "Help",
  },
  "save me": {
    hi: "मुझे बचाओ",
    mr: "मला वाचवा",
    bn: "আমাকে বাঁচান",
    ta: "என்னை காப்பாற்றுங்கள்",
    te: "నన్ను కాపాడండి",
    gu: "મને બચાવો",
    kn: "ನನ್ನನ್ನು ಉಳಿಸಿ",
    ml: "എന്നെ രക്ഷിക്കൂ",
    pa: "ਮੈਨੂੰ ਬਚਾਓ",
    ur: "मुझे بچاؤ",
    es: "Sálvame",
    fr: "Sauvez-moi",
    de: "Rette mich",
    en: "Save me",
  },
  "fire emergency": {
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
    ta: "தீ விபத்து",
    te: "అగ్ని ప్రమాదం",
    gu: "આગ લાગી છે",
    kn: "ಬೆಂಕಿ ತಗುಲಿದೆ",
    ml: "തീപിടുത്തം",
    pa: "ਅੱਗ ਲੱਗ ਗਈ ਹੈ",
    ur: "آگ لگ گئی ہے",
    es: "Emergencia de incendio",
    fr: "Urgence incendie",
    de: "Feuer Notfall",
    en: "Fire emergency",
  },
  "medical emergency": {
    hi: "चिकित्सा आपातकाल",
    mr: "वैद्यकीय आणीबाणी",
    bn: "চিকিৎসা জরুরি অবস্থা",
    ta: "மருத்துவ அவசரநிலை",
    te: "వైద్య అత్యవసర పరిస్థితి",
    gu: "તબીબી કટોકટી",
    kn: "ವೈದ್ಯಕೀಯ ತುರ್ತು",
    ml: "മെഡിക്കൽ എമർജൻസി",
    pa: "ਡਾਕਟਰੀ ਐਮਰਜੈਂਸੀ",
    ur: "طبی ایمرجنسی",
    es: "Emergencia médica",
    fr: "Urgence médicale",
    de: "Medizinischer Notfall",
    en: "Medical emergency",
  },
  "need ambulance": {
    hi: "एम्बुलेंस चाहिए",
    mr: "रुग्णवाहिका पाठवा",
    bn: "অ্যাম্বুলেন্স দরকার",
    ta: "ஆம்புலன்ஸ் தேவை",
    te: "అంబులెన్స్ కావాలి",
    gu: "એમ્બ્યુલન્સ જોઈએ છે",
    kn: "ಆಂಬ್ಯುಲೆನ್ಸ್ ಬೇಕು",
    ml: "ആംബുലൻസ് വേണം",
    pa: "ਐਂਬੂਲੈਂਸ ਚਾਹੀਦੀ ਹੈ",
    ur: "ایمبولینس چاہیے",
    es: "Necesito una ambulancia",
    fr: "Besoin d'une ambulance",
    de: "Brauche einen Krankenwagen",
    en: "Need an ambulance",
  },
  "bachao": {
    en: "Help / Save me",
    hi: "मुझे बचाओ",
    mr: "मला वाचवा",
    bn: "বাঁচান",
    es: "Socorro",
  },
  "madad karo": {
    en: "Please help me",
    hi: "मदद करो",
    mr: "मदत करा",
    bn: "সাহায্য করুন",
    es: "Ayuda por favor",
  },
  "madad chahiye": {
    en: "I need help immediately",
    hi: "मदद चाहिए",
    mr: "मदत हवी आहे",
    bn: "সাহায্য চাই",
    es: "Necesito ayuda",
  },
  "aag lagi": {
    en: "Fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
    es: "Hay fuego",
  },
  "aag lag gayi hai": {
    en: "Fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
    es: "Se ha producido un incendio",
  },
  "aag lagli": {
    en: "Fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
    es: "Hay un incendio",
  },
  "accident ho gaya": {
    en: "An accident has occurred",
    hi: "दुर्घटना हो गई है",
    mr: "अपघात झाला आहे",
    bn: "দুর্ঘটনা ঘটেছে",
    es: "Ocurrió un accidente",
  },
  "rokto porchhe": {
    en: "Severe bleeding occurring",
    hi: "खून बह रहा है",
    mr: "रक्तस्त्राव होत आहे",
    bn: "রক্ত পড়ছে",
    es: "Sangrado severo",
  },
  "sahayam cheyandi": {
    en: "Please provide emergency help",
    hi: "कृपया मदद करें",
    mr: "कृपया मदत करा",
    te: "దయచేసి సహాయం చేయండి",
    es: "Por favor ayuden",
  },
  "uthavi seiyavum": {
    en: "Please help immediately",
    hi: "तुरंत मदद करें",
    mr: "लवकर मदत करा",
    ta: "உடனடி உதவி செய்யுங்கள்",
    es: "Ayuda inmediata",
  },
  "aag lag gai": {
    en: "A fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
  },
  "aag lag gai hai": {
    en: "A fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
  },
  "aag lag gayi": {
    en: "A fire has broken out",
    hi: "आग लग गई है",
    mr: "आग लागली आहे",
    bn: "আগুন লেগেছে",
  },
  "hello mere idhar aag lag gai hai aag lag gai": {
    en: "Hello, a fire has broken out here! There is a fire!",
    hi: "हैलो मेरे यहाँ आग लग गई है, आग लग गई है",
    mr: "हॅलो, इथे आग लागली आहे",
  },
  "mere idhar aag lag gai hai": {
    en: "A fire has broken out at my location",
    hi: "मेरे यहाँ आग लग गई है",
    mr: "माझ्या इथे आग लागली आहे",
  },
  "mere idhar aag lag gayi hai": {
    en: "A fire has broken out at my location",
    hi: "मेरे यहाँ आग लग गई है",
    mr: "माझ्या इथे आग लागली आहे",
  },
  "idhar aag lagi hai": {
    en: "A fire has broken out here",
    hi: "यहाँ आग लग गई है",
    mr: "इथे आग लागली आहे",
  },
  "cylinder phat gaya": {
    en: "LPG Gas Cylinder has exploded",
    hi: "सिलेंडर फट गया है",
    mr: "सिलेंडरचा स्फोट झाला आहे",
  },
  "police bulao": {
    en: "Please call the police immediately",
    hi: "पुलिस को बुलाओ",
    mr: "पोलीस बोलवा",
  },
  "ambulance bhejo": {
    en: "Send an ambulance immediately",
    hi: "एम्बुलेंस तुरंत भेजो",
    mr: "रुग्णवाहिका तातडीने पाठवा",
  },
  "chori ho gayi": {
    en: "A theft / robbery has occurred",
    hi: "चोरी हो गई है",
    mr: "चोरी झाली आहे",
  },
  "picha kar raha": {
    en: "Someone is following / stalking me, need urgent help",
    hi: "कोई मेरा पीछा कर रहा है, तुरंत मदद चाहिए",
    mr: "कोणीतरी माझा पाठलाग करत आहे, मदत हवी आहे",
  },
  "peecha kar raha": {
    en: "Someone is following / stalking me, need urgent help",
    hi: "कोई मेरा पीछा कर रहा है, तुरंत मदद चाहिए",
    mr: "कोणीतरी माझा पाठलाग करत आहे, मदत हवी आहे",
  },
  "picha kar raha hai": {
    en: "A man has been following me for a long time, I need urgent help",
    hi: "एक आदमी बहुत देर से मेरा पीछा कर रहा है, तुरंत मदद चाहिए",
    mr: "एक व्यक्ती बऱ्याच वेळापासून माझा पाठलाग करत आहे, तातडीने मदत हवी",
  },
  "peecha kar raha hai": {
    en: "A man has been following me for a long time, I need urgent help",
    hi: "एक आदमी बहुत देर से मेरा पीछा कर रहा है, तुरंत मदद चाहिए",
    mr: "एक व्यक्ती बऱ्याच वेळापासून माझा पाठलाग करत आहे, तातडीने मदत हवी",
  },
  "pathlag kartoy": {
    en: "Someone is following / stalking me, need urgent help",
    hi: "कोई मेरा पीछा कर रहा है, तुरंत मदद चाहिए",
    mr: "माझा पाठलाग करतोय, तातडीने मदत हवी आहे",
  },
}

/** Romanised Indic to Devanagari token mapper for MyMemory translation pipeline */
const ROMANISED_DEV_MAP: Record<string, string> = {
  "hello": "हैलो",
  "ek": "एक",
  "aadami": "आदमी",
  "aadmi": "आदमी",
  "koi": "कोई",
  "mera": "मेरा",
  "meri": "मेरी",
  "mere": "मेरे",
  "mujhe": "मुझे",
  "hum": "हम",
  "humein": "हमें",
  "hamara": "हमारा",
  "apna": "अपना",
  "idhar": "इधर",
  "yahan": "यहाँ",
  "wahan": "वहाँ",
  "picha": "पीछा",
  "peecha": "पीछा",
  "pichha": "पीछा",
  "piche": "पीछे",
  "peeche": "पीछे",
  "ladka": "लड़का",
  "ladki": "लड़की",
  "aurat": "महिला",
  "dar": "डर",
  "aa": "आ",
  "aata": "आता",
  "aati": "आती",
  "aate": "आते",
  "kar": "कर",
  "karta": "करता",
  "karti": "करती",
  "karte": "करते",
  "aag": "आग",
  "lag": "लग",
  "gai": "गई",
  "gayi": "गई",
  "hai": "है",
  "hain": "हैं",
  "bhi": "भी",
  "bahut": "बहुत",
  "der": "देर",
  "se": "से",
  "madad": "मदद",
  "chahie": "चाहिए",
  "chahiye": "चाहिए",
  "karo": "करो",
  "kijiye": "कीजिए",
  "bulao": "बुलाओ",
  "bhejo": "भेजो",
  "ambulance": "एम्बुलेंस",
  "doctor": "डॉक्टर",
  "police": "पुलिस",
  "bachao": "बचाओ",
  "chot": "चोट",
  "lagi": "लगी",
  "dard": "दर्द",
  "khoon": "खून",
  "beh": "बह",
  "raha": "रहा",
  "rahi": "रही",
  "rahe": "रहे",
  "accident": "दुर्घटना",
  "cylinder": "सिलेंडर",
  "blast": "धमाका",
  "phat": "फट",
  "gaya": "गया",
  "dhuwan": "धुआं",
  "dhua": "धुआं",
  "ghar": "घर",
  "dukan": "दुकान",
  "chori": "चोरी",
  "chor": "चोर",
  "lutera": "लुटेरा",
  "chaku": "चाकू",
  "banduk": "बंदूक",
  "goli": "गोली",
  "dhamki": "धमकी",
  "gunda": "गुंडा",
  "maar": "मार",
  "peet": "पीट",
  "jaldi": "जल्दी",
  "turant": "तुरंत",
  "mala": "मला",
  "madat": "मदत",
  "havi": "हवी",
  "aahe": "आहे",
  "pathlag": "पाठलाग",
  "kartoy": "करतोय",
  "jhali": "झाली",
  "zhali": "झाली",
  "padla": "पडला",
}

export function transliterateRomanisedToDevanagari(text: string): string {
  if (!text) return text
  return text
    .split(/\b/)
    .map((token) => {
      const lower = token.toLowerCase()
      return ROMANISED_DEV_MAP[lower] || token
    })
    .join("")
}

