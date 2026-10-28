const fs = require('fs');
const path = require('path');

const translationKeys = {
  en: {
    aiPoweredTranslation: "AI-Powered Translation",
    tryLiveTranslation: "Try live translation",
    experienceInstantMultilingual: "Experience instant multilingual emergency communication powered by AI",
    emergencyMessage: "Emergency Message",
    autoDetect: "Auto-detect",
    typeEmergencyMessage: "Type an emergency message... e.g., 'I need medical help immediately, severe chest pain'",
    translate: "Translate",
    translating: "Translating...",
    translation: "Translation",
    translationWillAppear: "Translation will appear here",
    aiClassification: "AI Classification",
    languagesSupported: "Languages Supported",
    translationTime: "Translation Time",
    accuracyRate: "Accuracy Rate"
  },
  es: {
    aiPoweredTranslation: "Traducción con IA",
    tryLiveTranslation: "Prueba la traducción en vivo",
    experienceInstantMultilingual: "Experimenta la comunicación de emergencia multilingüe instantánea impulsada por IA",
    emergencyMessage: "Mensaje de Emergencia",
    autoDetect: "Detección automática",
    typeEmergencyMessage: "Escribe un mensaje de emergencia... ej., 'Necesito ayuda médica inmediatamente, dolor severo en el pecho'",
    translate: "Traducir",
    translating: "Traduciendo...",
    translation: "Traducción",
    translationWillAppear: "La traducción aparecerá aquí",
    aiClassification: "Clasificación IA",
    languagesSupported: "Idiomas Soportados",
    translationTime: "Tiempo de Traducción",
    accuracyRate: "Tasa de Precisión"
  },
  fr: {
    aiPoweredTranslation: "Traduction alimentée par l'IA",
    tryLiveTranslation: "Essayez la traduction en direct",
    experienceInstantMultilingual: "Expérimentez la communication d'urgence multilingue instantanée alimentée par l'IA",
    emergencyMessage: "Message d'Urgence",
    autoDetect: "Détection automatique",
    typeEmergencyMessage: "Tapez un message d'urgence... par ex., 'J'ai besoin d'aide médicale immédiatement, douleur thoracique sévère'",
    translate: "Traduire",
    translating: "Traduction en cours...",
    translation: "Traduction",
    translationWillAppear: "La traduction apparaîtra ici",
    aiClassification: "Classification IA",
    languagesSupported: "Langues Prises en Charge",
    translationTime: "Temps de Traduction",
    accuracyRate: "Taux de Précision"
  },
  de: {
    aiPoweredTranslation: "KI-gestützte Übersetzung",
    tryLiveTranslation: "Probieren Sie Live-Übersetzung",
    experienceInstantMultilingual: "Erleben Sie sofortige mehrsprachige Notfallkommunikation mit KI",
    emergencyMessage: "Notfallnachricht",
    autoDetect: "Automatische Erkennung",
    typeEmergencyMessage: "Geben Sie eine Notfallnachricht ein... z.B. 'Ich brauche sofort medizinische Hilfe, starke Brustschmerzen'",
    translate: "Übersetzen",
    translating: "Übersetzen...",
    translation: "Übersetzung",
    translationWillAppear: "Die Übersetzung wird hier erscheinen",
    aiClassification: "KI-Klassifizierung",
    languagesSupported: "Unterstützte Sprachen",
    translationTime: "Übersetzungszeit",
    accuracyRate: "Genauigkeitsrate"
  },
  ru: {
    aiPoweredTranslation: "Перевод с помощью ИИ",
    tryLiveTranslation: "Попробуйте живой перевод",
    experienceInstantMultilingual: "Испытайте мгновенную многоязычную экстренную связь на основе ИИ",
    emergencyMessage: "Экстренное Сообщение",
    autoDetect: "Автоопределение",
    typeEmergencyMessage: "Введите экстренное сообщение... например, 'Мне срочно нужна медицинская помощь, сильная боль в груди'",
    translate: "Перевести",
    translating: "Перевод...",
    translation: "Перевод",
    translationWillAppear: "Перевод появится здесь",
    aiClassification: "Классификация ИИ",
    languagesSupported: "Поддерживаемые Языки",
    translationTime: "Время Перевода",
    accuracyRate: "Точность"
  },
  ja: {
    aiPoweredTranslation: "AI翻訳",
    tryLiveTranslation: "リアルタイム翻訳を試す",
    experienceInstantMultilingual: "AIによる即時多言語緊急通信を体験",
    emergencyMessage: "緊急メッセージ",
    autoDetect: "自動検出",
    typeEmergencyMessage: "緊急メッセージを入力してください... 例: 'すぐに医療支援が必要です、胸に激しい痛み'",
    translate: "翻訳",
    translating: "翻訳中...",
    translation: "翻訳",
    translationWillAppear: "翻訳がここに表示されます",
    aiClassification: "AI分類",
    languagesSupported: "対応言語",
    translationTime: "翻訳時間",
    accuracyRate: "精度率"
  },
  ko: {
    aiPoweredTranslation: "AI 기반 번역",
    tryLiveTranslation: "실시간 번역 시도",
    experienceInstantMultilingual: "AI 기반 즉각적인 다국어 비상 통신 경험",
    emergencyMessage: "비상 메시지",
    autoDetect: "자동 감지",
    typeEmergencyMessage: "비상 메시지를 입력하세요... 예: '즉시 의료 도움이 필요합니다, 심한 가슴 통증'",
    translate: "번역",
    translating: "번역 중...",
    translation: "번역",
    translationWillAppear: "번역이 여기에 나타납니다",
    aiClassification: "AI 분류",
    languagesSupported: "지원 언어",
    translationTime: "번역 시간",
    accuracyRate: "정확도"
  },
  zh: {
    aiPoweredTranslation: "AI驱动翻译",
    tryLiveTranslation: "尝试实时翻译",
    experienceInstantMultilingual: "体验AI驱动的即时多语言紧急通信",
    emergencyMessage: "紧急消息",
    autoDetect: "自动检测",
    typeEmergencyMessage: "输入紧急消息...例如，'我立即需要医疗帮助，胸部剧烈疼痛'",
    translate: "翻译",
    translating: "翻译中...",
    translation: "翻译",
    translationWillAppear: "翻译将显示在这里",
    aiClassification: "AI分类",
    languagesSupported: "支持的语言",
    translationTime: "翻译时间",
    accuracyRate: "准确率"
  },
  ar: {
    aiPoweredTranslation: "الترجمة بالذكاء الاصطناعي",
    tryLiveTranslation: "جرب الترجمة المباشرة",
    experienceInstantMultilingual: "تجربة الاتصال الطارئ الفوري متعدد اللغات بالذكاء الاصطناعي",
    emergencyMessage: "رسالة الطوارئ",
    autoDetect: "الكشف التلقائي",
    typeEmergencyMessage: "اكتب رسالة طوارئ... على سبيل المثال، 'أحتاج إلى مساعدة طبية فورية، ألم شديد في الصدر'",
    translate: "ترجمة",
    translating: "جارٍ الترجمة...",
    translation: "الترجمة",
    translationWillAppear: "ستظهر الترجمة هنا",
    aiClassification: "تصنيف الذكاء الاصطناعي",
    languagesSupported: "اللغات المدعومة",
    translationTime: "وقت الترجمة",
    accuracyRate: "معدل الدقة"
  }
};

const localesDir = path.join(__dirname, 'i18n', 'locales');

Object.keys(translationKeys).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add translation section if it doesn't exist
    if (!data.translation) {
      data.translation = translationKeys[lang];

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ Added translation keys to ${lang}.json`);
    } else {
      console.log(`○ ${lang}.json already has translation keys`);
    }
  }
});

console.log('\n✓ Translation keys added successfully!');
