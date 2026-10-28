const fs = require('fs');
const path = require('path');

// Read the English (master) file
const enPath = path.join(__dirname, 'public', 'i18n', 'locales', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

// Manual translations for all 9 languages
const translations = {
  es: { // Spanish
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
    pages: {
      emergencyMap: "Mapa de Emergencias",
      joinNetwork: "Unirse a la Red",
      responderPortal: "Portal del Respondedor",
      documentation: "Documentación",
      safetyGuidelines: "Pautas de Seguridad",
      contactSupport: "Contactar Soporte"
    },
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      submit: "Enviar",
      close: "Cerrar",
      loading: "Cargando",
      success: "Éxito",
      error: "Error",
      warning: "Advertencia",
      next: "Siguiente",
      previous: "Anterior",
      finish: "Finalizar",
      continue: "Continuar"
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
      panicModeDesc: "Mantén presionado 3 segundos para transmisión instantánea",
      locationDetected: "Ubicación Detectada",
      respondersAlerted: "respondedores alertados",
      emergencyBroadcast: "Transmisión de Emergencia Activa"
    },
    forms: {
      email: "Correo Electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      name: "Nombre",
      fullName: "Nombre Completo",
      message: "Mensaje",
      describeEmergency: "Describe tu situación de emergencia",
      phoneNumber: "Número de Teléfono",
      organization: "Organización",
      location: "Ubicación",
      address: "Dirección",
      city: "Ciudad",
      country: "País",
      emailAddress: "Dirección de Correo",
      yourMessage: "Tu mensaje",
      optional: "Opcional"
    },
    auth: {
      welcomeBack: "Bienvenido de nuevo",
      signIn: "Iniciar sesión",
      signInToDashboard: "Inicia sesión para acceder a tu panel de respuesta de emergencias",
      dontHaveAccount: "¿No tienes cuenta?",
      registerAsResponder: "Regístrate como respondedor",
      joinTheNetwork: "Únete a la red",
      registerAsVerifiedResponder: "Regístrate para convertirte en un respondedor de emergencias verificado",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      createAccount: "Crear Cuenta",
      signingIn: "Iniciando sesión...",
      creatingAccount: "Creando cuenta...",
      forgotPassword: "¿Olvidaste tu contraseña?",
      rememberMe: "Recuérdame"
    },
    footer: {
      description: "Conectando personas en crisis con respondedores verificados en todo el mundo a través de traducción multilingüe de emergencias impulsada por IA.",
      platform: "Plataforma",
      resources: "Recursos",
      copyright: "© 2025 BridgeX. Construido con ❤️ para respuesta de emergencias global."
    },
    home: {
      emergencyResponseWithoutBorders: "Respuesta de emergencia sin fronteras",
      aiPoweredPlatformDescription: "Plataforma multilingüe impulsada por IA que conecta a personas en crisis con respondedores verificados en todo el mundo. Traducción instantánea, coordinación en tiempo real, ayuda vital en cualquier idioma.",
      emergencySOSSystem: "Sistema de Emergencia SOS",
      emergencySOSDescription: "Envía alertas de emergencia con mensajes de voz, adjunta fotos/videos y obtén ayuda instantánea en tu idioma",
      emergencyResponseCenter: "Centro de Respuesta de Emergencias",
      emergencyResponseCenterDescription: "Alertas en tiempo real, respondedores cercanos y mapeo en vivo para coordinación inmediata"
    },
    features: {
      title: "Tecnología que salva vidas",
      description: "Herramientas avanzadas de IA y coordinación en tiempo real diseñadas para respuesta de emergencias",
      aiTranslation: "Traducción IA",
      aiTranslationDescription: "Impulsado por IA avanzada para traducción instantánea y precisa en más de 100 idiomas",
      smartLocation: "Ubicación Inteligente",
      smartLocationDescription: "Encuentra automáticamente hospitales, ONGs y respondedores verificados más cercanos",
      realTimeAlerts: "Alertas en Tiempo Real",
      realTimeAlertsDescription: "Las transmisiones SOS llegan a los respondedores en menos de 2 segundos",
      verifiedNetwork: "Red Verificada",
      verifiedNetworkDescription: "Todos los respondedores son organizaciones verificadas y voluntarios capacitados",
      responderDashboard: "Panel de Respondedor",
      responderDashboardDescription: "Herramientas completas para ONGs y servicios de emergencia",
      globalCoverage: "Cobertura Global",
      globalCoverageDescription: "Respuesta de emergencia sin fronteras conectando personas 24/7"
    },
    howItWorks: {
      title: "Cómo funciona",
      subtitle: "De la emergencia a la resolución en cuatro pasos",
      badge: "Simple y Rápido",
      step1Title: "Activar SOS",
      step1Desc: "Presiona el botón de emergencia. Tu ubicación se captura automáticamente.",
      step2Title: "Traducción IA",
      step2Desc: "Tu mensaje se traduce instantáneamente a los idiomas locales de los respondedores cercanos.",
      step3Title: "Transmisión de Alerta",
      step3Desc: "Los respondedores verificados en tu área reciben tu alerta en tiempo real.",
      step4Title: "Coordinación en Vivo",
      step4Desc: "Chatea con respondedores a través de traducción multilingüe en tiempo real hasta que llegue la ayuda."
    },
    globalImpact: {
      title: "Impacto Global",
      description: "Haciendo la respuesta de emergencias accesible en todo el mundo",
      verifiedResponders: "Respondedores Verificados",
      countriesCovered: "Países Cubiertos",
      languagesSupported: "Idiomas Soportados",
      alwaysAvailable: "Siempre Disponible"
    },
    about: {
      title: "Acerca de BridgeX",
      subtitle: "Rompiendo barreras lingüísticas en la respuesta de emergencias para salvar vidas a través de fronteras",
      mission: {
        title: "Nuestra Misión",
        description1: "BridgeX se fundó en una creencia simple pero poderosa: el idioma nunca debería ser una barrera para recibir ayuda de emergencia. En situaciones de crisis, cada segundo cuenta, y los desafíos de comunicación pueden significar la diferencia entre la vida y la muerte.",
        description2: "Hemos construido la primera plataforma de coordinación de emergencias multilingüe impulsada por IA del mundo que conecta instantáneamente a las personas en crisis con respondedores verificados, independientemente de las barreras lingüísticas. Nuestra tecnología traduce las comunicaciones de emergencia en tiempo real en más de 100 idiomas, asegurando que la ayuda llegue más rápido y de manera más efectiva."
      },
      values: {
        title: "Nuestros Valores",
        humanity: {
          title: "Humanidad Primero",
          description: "Cada decisión que tomamos prioriza la seguridad y dignidad humana por encima de todo."
        },
        speed: {
          title: "La Velocidad Importa",
          description: "En emergencias, los segundos cuentan. Optimizamos para los tiempos de respuesta más rápidos posibles."
        },
        access: {
          title: "Acceso Universal",
          description: "La ayuda de emergencia debería ser accesible para todos, independientemente de la ubicación o el idioma."
        }
      },
      howWeWork: {
        title: "Cómo Trabajamos",
        network: {
          title: "Red Verificada",
          description: "Todos los respondedores pasan por una verificación rigurosa para asegurar que te conectes con ONGs legítimas, hospitales y profesionales capacitados."
        },
        translation: {
          title: "Traducción IA",
          description: "Nuestra IA avanzada traduce instantáneamente los mensajes de emergencia con conciencia de contexto, asegurando que los detalles críticos nunca se pierdan en la traducción."
        },
        coordination: {
          title: "Respuesta Coordinada",
          description: "Los algoritmos de emparejamiento inteligente te conectan con los respondedores cercanos más apropiados basados en ubicación, disponibilidad y experiencia."
        },
        availability: {
          title: "Disponibilidad 24/7",
          description: "Nuestra red global asegura que la ayuda esté siempre disponible, sin importar dónde estés o a qué hora ocurra la emergencia."
        }
      },
      impact: {
        title: "Nuestro Impacto",
        responders: "Respondedores Verificados",
        countries: "Países",
        languages: "Idiomas",
        responseTime: "Tiempo de Respuesta Promedio"
      }
    },
    contact: {
      category: "Categoría",
      subject: "Asunto",
      attachment: "Adjunto",
      fileTooLarge: "El tamaño del archivo debe ser menor a 10MB",
      fillAllFields: "Por favor complete todos los campos requeridos",
      invalidEmail: "Por favor ingrese una dirección de email válida",
      submitting: "Enviando...",
      submitSuccess: "Su solicitud de soporte ha sido enviada. Responderemos dentro de 24 horas.",
      submitError: "Error al enviar la solicitud",
      general: "Consulta General",
      technical: "Soporte Técnico",
      bug: "Reporte de Error",
      feature: "Solicitud de Función",
      partnership: "Asociación",
      emergency: "Contacto de Emergencia",
      placeholder: {
        name: "Su nombre completo",
        email: "su.email@ejemplo.com",
        subject: "Breve descripción de su consulta",
        message: "Por favor proporcione detalles sobre su pregunta o problema..."
      },
      attachFile: "Adjuntar un archivo (opcional)",
      maxFileSize: "Tamaño máximo de archivo: 10MB",
      supportedFormats: "Formatos soportados: PDF, DOC, DOCX, TXT, JPG, PNG",
      privacyNotice: "Su información está segura y solo se utilizará para responder a su consulta.",
      responseTime: "Típicamente respondemos dentro de 24 horas.",
      alternativeContact: "Para asuntos urgentes, por favor llame directamente a servicios de emergencia."
    }
  },
  fr: { // French
    navigation: {
      home: "Accueil",
      about: "À propos",
      map: "Carte",
      responders: "Intervenants",
      contact: "Contact",
      dashboard: "Tableau de bord",
      logout: "Déconnexion",
      login: "Connexion",
      register: "S'inscrire"
    },
    emergency: {
      sendSOS: "ENVOYER SOS",
      medicalEmergency: "Urgence Médicale",
      fireEmergency: "Urgence Incendie",
      securityEmergency: "Menace de Sécurité",
      otherEmergency: "Autre Urgence",
      medicalEmergencyDesc: "Blessures, maladie, crise médicale",
      fireEmergencyDesc: "Feu, fumée ou risque d'incendie",
      securityEmergencyDesc: "Violence, agression, menace de sécurité",
      otherEmergencyDesc: "Accident ou autre situation urgente"
    },
    home: {
      emergencyResponseWithoutBorders: "Réponse d'urgence sans frontières",
      aiPoweredPlatformDescription: "Plateforme multilingue alimentée par l'IA connectant les personnes en crise avec des intervenants vérifiés dans le monde entier."
    },
    features: {
      title: "Technologie qui sauve des vies",
      description: "Outils d'IA avancés et de coordination en temps réel conçus pour la réponse d'urgence"
    },
    globalImpact: {
      title: "Impact Global",
      description: "Rendre la réponse d'urgence accessible dans le monde entier",
      verifiedResponders: "Intervenants Vérifiés",
      countriesCovered: "Pays Couvert",
      languagesSupported: "Langues Supportées",
      alwaysAvailable: "Toujours Disponible"
    },
    footer: {
      description: "Connecter les personnes en crise avec des intervenants vérifiés dans le monde entier grâce à la traduction multilingue d'urgence alimentée par l'IA.",
      platform: "Plateforme",
      resources: "Ressources",
      copyright: "© 2025 BridgeX. Construit avec ❤️ pour la réponse d'urgence mondiale."
    },
    about: {
      title: "À propos de BridgeX",
      subtitle: "Briser les barrières linguistiques dans la réponse d'urgence pour sauver des vies à travers les frontières",
      mission: {
        title: "Notre Mission",
        description1: "BridgeX a été fondée sur une croyance simple mais puissante : la langue ne devrait jamais être une barrière pour recevoir de l'aide d'urgence. Dans les situations de crise, chaque seconde compte, et les défis de communication peuvent faire la différence entre la vie et la mort.",
        description2: "Nous avons construit la première plateforme de coordination d'urgence multilingue alimentée par l'IA au monde qui connecte instantanément les personnes en crise avec des intervenants vérifiés, quels que soient les barrières linguistiques. Notre technologie traduit les communications d'urgence en temps réel dans plus de 100 langues, assurant que l'aide arrive plus rapidement et plus efficacement."
      },
      values: {
        title: "Nos Valeurs",
        humanity: {
          title: "L'Humanité d'Abord",
          description: "Chaque décision que nous prenons priorise la sécurité et la dignité humaines avant tout."
        },
        speed: {
          title: "La Vitesse Compte",
          description: "En cas d'urgence, les secondes comptent. Nous optimisons pour les temps de réponse les plus rapides possibles."
        },
        access: {
          title: "Accès Universel",
          description: "L'aide d'urgence devrait être accessible à tous, indépendamment de l'emplacement ou de la langue."
        }
      },
      howWeWork: {
        title: "Comment Nous Travaillons",
        network: {
          title: "Réseau Vérifié",
          description: "Tous les intervenants subissent une vérification rigoureuse pour s'assurer que vous êtes connecté avec des ONG légitimes, des hôpitaux et des professionnels formés."
        },
        translation: {
          title: "Traduction IA",
          description: "Notre IA avancée traduit instantanément les messages d'urgence avec une conscience contextuelle, assurant que les détails critiques ne sont jamais perdus dans la traduction."
        },
        coordination: {
          title: "Réponse Coordinée",
          description: "Les algorithmes d'appariement intelligents vous connectent avec les intervenants proches les plus appropriés en fonction de l'emplacement, de la disponibilité et de l'expertise."
        },
        availability: {
          title: "Disponibilité 24/7",
          description: "Notre réseau mondial assure que l'aide est toujours disponible, peu importe où vous êtes ou à quelle heure l'urgence frappe."
        }
      },
      impact: {
        title: "Notre Impact",
        responders: "Intervenants Vérifiés",
        countries: "Pays",
        languages: "Langues",
        responseTime: "Temps de Réponse Moyen"
      }
    },
    contact: {
      title: "Contactez-nous",
      subtitle: "Besoin d'aide ou avez-vous des questions ? Nous sommes là pour vous aider.",
      form: {
        name: "Nom",
        email: "Email",
        category: "Catégorie",
        message: "Message",
        submit: "Envoyer le Message",
        sending: "Envoi en cours...",
        namePlaceholder: "Votre nom complet",
        emailPlaceholder: "votre.email@exemple.com",
        messagePlaceholder: "Décrivez votre demande d'assistance..."
      },
      categories: {
        general: "Question Générale",
        technical: "Support Technique",
        partnership: "Partenariat",
        feedback: "Commentaires",
        emergency: "Urgence"
      },
      validation: {
        fillAllFields: "Veuillez remplir tous les champs obligatoires.",
        invalidEmail: "Veuillez saisir une adresse email valide.",
        messageTooShort: "Le message doit contenir au moins 10 caractères.",
        messageTooLong: "Le message ne peut pas dépasser 1000 caractères."
      },
      messages: {
        submitSuccess: "Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.",
        submitError: "Une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer.",
        networkError: "Erreur de réseau. Veuillez vérifier votre connexion internet et réessayer."
      }
    }
  },
  ru: { // Russian
    navigation: {
      home: "Главная",
      about: "О нас",
      map: "Карта",
      responders: "Спасатели",
      contact: "Контакты",
      dashboard: "Панель управления",
      logout: "Выйти",
      login: "Войти",
      register: "Регистрация"
    },
    emergency: {
      sendSOS: "ОТПРАВИТЬ SOS",
      medicalEmergency: "Медицинская Экстренная Ситуация",
      fireEmergency: "Пожарная Экстренная Ситуация",
      securityEmergency: "Угроза Безопасности",
      otherEmergency: "Другая Экстренная Ситуация",
      medicalEmergencyDesc: "Травмы, болезнь, медицинский кризис",
      fireEmergencyDesc: "Огонь, дым или риск пожара",
      securityEmergencyDesc: "Насилие, нападение, угроза безопасности",
      otherEmergencyDesc: "Авария или другая срочная ситуация"
    },
    home: {
      emergencyResponseWithoutBorders: "Экстренная помощь без границ",
      aiPoweredPlatformDescription: "Многоязычная платформа на базе ИИ, соединяющая людей в кризисных ситуациях с проверенными спасателями по всему миру."
    },
    features: {
      title: "Технология, спасающая жизни",
      description: "Продвинутые инструменты ИИ и координации в реальном времени, разработанные для экстренного реагирования"
    },
    globalImpact: {
      title: "Глобальное Влияние",
      description: "Делаем экстренное реагирование доступным по всему миру",
      verifiedResponders: "Проверенные Спасатели",
      countriesCovered: "Охваченные Страны",
      languagesSupported: "Поддерживаемые Языки",
      alwaysAvailable: "Всегда Доступно"
    },
    footer: {
      description: "Соединяем людей в кризисных ситуациях с проверенными спасателями по всему миру через многоязычный перевод экстренных ситуаций на базе ИИ.",
      platform: "Платформа",
      resources: "Ресурсы",
      copyright: "© 2025 BridgeX. Создано с ❤️ для глобального экстренного реагирования."
    },
    about: {
      title: "О BridgeX",
      subtitle: "Разрушая языковые барьеры в экстренном реагировании для спасения жизней через границы",
      mission: {
        title: "Наша Миссия",
        description1: "BridgeX была основана на простой, но мощной вере: язык никогда не должен быть барьером для получения экстренной помощи. В кризисных ситуациях каждая секунда имеет значение, и коммуникационные вызовы могут означать разницу между жизнью и смертью.",
        description2: "Мы создали первую в мире платформу координации экстренных ситуаций на базе ИИ, которая мгновенно соединяет людей в кризисных ситуациях с проверенными спасателями, независимо от языковых барьеров. Наша технология переводит экстренные коммуникации в реальном времени более чем на 100 языков, обеспечивая, что помощь приходит быстрее и эффективнее."
      },
      values: {
        title: "Наши Ценности",
        humanity: {
          title: "Человечность Прежде Всего",
          description: "Каждое наше решение в первую очередь приоритизирует безопасность и достоинство человека."
        },
        speed: {
          title: "Скорость Имеет Значение",
          description: "В экстренных ситуациях секунды имеют значение. Мы оптимизируем для максимально быстрых времен реагирования."
        },
        access: {
          title: "Универсальный Доступ",
          description: "Экстренная помощь должна быть доступна всем, независимо от местоположения или языка."
        }
      },
      howWeWork: {
        title: "Как Мы Работаем",
        network: {
          title: "Проверенная Сеть",
          description: "Все спасатели проходят тщательную проверку, чтобы обеспечить, что вы связаны с легитимными НПО, больницами и обученными профессионалами."
        },
        translation: {
          title: "ИИ Перевод",
          description: "Наш продвинутый ИИ мгновенно переводит экстренные сообщения с учетом контекста, обеспечивая, что критические детали никогда не теряются в переводе."
        },
        coordination: {
          title: "Координированное Реагирование",
          description: "Умные алгоритмы сопоставления соединяют вас с наиболее подходящими ближайшими спасателями на основе местоположения, доступности и экспертизы."
        },
        availability: {
          title: "Доступность 24/7",
          description: "Наша глобальная сеть обеспечивает, что помощь всегда доступна, независимо от того, где вы находитесь или в какое время происходит экстренная ситуация."
        }
      },
      impact: {
        title: "Наше Влияние",
        responders: "Проверенные Спасатели",
        countries: "Страны",
        languages: "Языки",
        responseTime: "Среднее Время Реагирования"
      }
    },
    navigation: { ...enData.navigation, home: "Главная", about: "О нас", map: "Карта" },
    emergency: { ...enData.emergency, sendSOS: "ОТПРАВИТЬ SOS" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "Экстренная помощь без границ" },
    globalImpact: {
      title: "Глобальное воздействие",
      description: "Обеспечение доступности экстренной помощи по всему миру",
      verifiedResponders: "Проверенные спасатели",
      countriesCovered: "Охваченные страны",
      languagesSupported: "Поддерживаемые языки",
      alwaysAvailable: "Всегда доступно"
    },
    footer: {
      description: "Соединение людей в кризисных ситуациях с проверенными спасателями по всему миру через многоязычный перевод экстренных ситуаций на базе ИИ.",
      platform: "Платформа",
      resources: "Ресурсы",
      copyright: "© 2025 BridgeX. Создано с ❤️ для глобального реагирования на чрезвычайные ситуации."
    },
    contact: {
      title: "Свяжитесь с нами",
      subtitle: "Нужна помощь или есть вопросы? Мы здесь, чтобы помочь вам.",
      form: {
        name: "Имя",
        email: "Email",
        category: "Категория",
        message: "Сообщение",
        submit: "Отправить Сообщение",
        sending: "Отправка...",
        namePlaceholder: "Ваше полное имя",
        emailPlaceholder: "ваш.email@пример.com",
        messagePlaceholder: "Опишите ваш запрос на помощь..."
      },
      categories: {
        general: "Общий Вопрос",
        technical: "Техническая Поддержка",
        partnership: "Партнерство",
        feedback: "Отзывы",
        emergency: "Экстренная Ситуация"
      },
      validation: {
        fillAllFields: "Пожалуйста, заполните все обязательные поля.",
        invalidEmail: "Пожалуйста, введите действительный адрес электронной почты.",
        messageTooShort: "Сообщение должно содержать не менее 10 символов.",
        messageTooLong: "Сообщение не может превышать 1000 символов."
      },
      messages: {
        submitSuccess: "Ваше сообщение успешно отправлено! Мы ответим вам в ближайшее время.",
        submitError: "Произошла ошибка при отправке вашего сообщения. Пожалуйста, попробуйте еще раз.",
        networkError: "Ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз."
      }
    }
  },
  de: { // German
    navigation: { ...enData.navigation, home: "Startseite", about: "Über uns", map: "Karte" },
    emergency: { ...enData.emergency, sendSOS: "SOS SENDEN" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "Notfallhilfe ohne Grenzen" },
    globalImpact: {
      title: "Globaler Impact",
      description: "Notfallhilfe weltweit zugänglich machen",
      verifiedResponders: "Verifizierte Helfer",
      countriesCovered: "Abgedeckte Länder",
      languagesSupported: "Unterstützte Sprachen",
      alwaysAvailable: "Immer verfügbar"
    },
    footer: {
      description: "Menschen in Krisen mit verifizierten Helfern weltweit durch KI-gestützte mehrsprachige Notfallübersetzung verbinden.",
      platform: "Plattform",
      resources: "Ressourcen",
      copyright: "© 2025 BridgeX. Gebaut mit ❤️ für globale Notfallhilfe."
    },
    about: {
      title: "Über BridgeX",
      subtitle: "Sprachbarrieren in der Notfallhilfe durchbrechen, um Leben über Grenzen hinweg zu retten",
      mission: {
        title: "Unsere Mission",
        description1: "BridgeX wurde auf einem einfachen aber mächtigen Glauben gegründet: Sprache sollte niemals eine Barriere für den Erhalt von Notfallhilfe sein. In Krisensituationen zählt jede Sekunde, und Kommunikationsherausforderungen können den Unterschied zwischen Leben und Tod bedeuten.",
        description2: "Wir haben die weltweit erste KI-gestützte mehrsprachige Notfallkoordinationsplattform gebaut, die Menschen in Krisen sofort mit verifizierten Helfern verbindet, unabhängig von Sprachbarrieren. Unsere Technologie übersetzt Notfallkommunikation in Echtzeit in mehr als 100 Sprachen und stellt sicher, dass Hilfe schneller und effektiver ankommt."
      },
      values: {
        title: "Unsere Werte",
        humanity: {
          title: "Menschlichkeit Zuerst",
          description: "Jede Entscheidung, die wir treffen, priorisiert menschliche Sicherheit und Würde über alles."
        },
        speed: {
          title: "Geschwindigkeit Zählt",
          description: "In Notfällen zählen Sekunden. Wir optimieren für die schnellstmöglichen Reaktionszeiten."
        },
        access: {
          title: "Universeller Zugang",
          description: "Notfallhilfe sollte für alle zugänglich sein, unabhängig von Standort oder Sprache."
        }
      },
      howWeWork: {
        title: "Wie Wir Arbeiten",
        network: {
          title: "Verifiziertes Netzwerk",
          description: "Alle Helfer durchlaufen eine strenge Verifizierung, um sicherzustellen, dass Sie mit legitimen NGOs, Krankenhäusern und geschulten Fachkräften verbunden werden."
        },
        translation: {
          title: "KI-Übersetzung",
          description: "Unsere fortschrittliche KI übersetzt Notfallnachrichten sofort mit Kontextbewusstsein und stellt sicher, dass kritische Details niemals in der Übersetzung verloren gehen."
        },
        coordination: {
          title: "Koordinierte Antwort",
          description: "Intelligente Matching-Algorithmen verbinden Sie mit den am besten geeigneten nahegelegenen Helfern basierend auf Standort, Verfügbarkeit und Fachwissen."
        },
        availability: {
          title: "24/7 Verfügbarkeit",
          description: "Unser globales Netzwerk stellt sicher, dass Hilfe immer verfügbar ist, egal wo Sie sind oder zu welcher Uhrzeit der Notfall eintritt."
        }
      },
      impact: {
        title: "Unser Impact",
        responders: "Verifizierte Helfer",
        countries: "Länder",
        languages: "Sprachen",
        responseTime: "Durchschnittliche Reaktionszeit"
      }
    },
    contact: {
      title: "Kontaktieren Sie uns",
      subtitle: "Brauchen Sie Hilfe oder haben Sie Fragen? Wir sind hier, um Ihnen zu helfen.",
      form: {
        name: "Name",
        email: "E-Mail",
        category: "Kategorie",
        message: "Nachricht",
        submit: "Nachricht senden",
        sending: "Wird gesendet...",
        namePlaceholder: "Ihr vollständiger Name",
        emailPlaceholder: "ihre.email@beispiel.com",
        messagePlaceholder: "Beschreiben Sie Ihre Hilfsanfrage..."
      },
      categories: {
        general: "Allgemeine Frage",
        technical: "Technischer Support",
        partnership: "Partnerschaft",
        feedback: "Feedback",
        emergency: "Notfall"
      },
      validation: {
        fillAllFields: "Bitte füllen Sie alle erforderlichen Felder aus.",
        invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        messageTooShort: "Die Nachricht muss mindestens 10 Zeichen enthalten.",
        messageTooLong: "Die Nachricht darf 1000 Zeichen nicht überschreiten."
      },
      messages: {
        submitSuccess: "Ihre Nachricht wurde erfolgreich gesendet! Wir werden uns so schnell wie möglich bei Ihnen melden.",
        submitError: "Beim Senden Ihrer Nachricht ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        networkError: "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
      }
    }
  },
  ja: { // Japanese
    navigation: { ...enData.navigation, home: "ホーム", about: "概要", map: "地図" },
    emergency: { ...enData.emergency, sendSOS: "SOS送信" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "国境を越えた緊急対応" },
    globalImpact: {
      title: "グローバルインパクト",
      description: "世界中で緊急対応をアクセスしやすくする",
      verifiedResponders: "検証済みレスポンダー",
      countriesCovered: "カバー国数",
      languagesSupported: "サポート言語",
      alwaysAvailable: "常に利用可能"
    },
    footer: {
      description: "AIを活用した多言語緊急翻訳を通じて、世界中の危機的状況にある人々と検証済みレスポンダーをつなぐ。",
      platform: "プラットフォーム",
      resources: "リソース",
      copyright: "© 2025 BridgeX. グローバル緊急対応のために ❤️ で構築。"
    },
    about: {
      title: "BridgeXについて",
      subtitle: "国境を越えて命を救うための緊急対応における言語障壁を打破",
      mission: {
        title: "私たちの使命",
        description1: "BridgeXはシンプルだが強力な信念に基づいて設立されました：言語は決して緊急援助を受ける障壁になってはなりません。危機的状況では毎秒が重要であり、コミュニケーションの課題が生死の違いを生む可能性があります。",
        description2: "私たちは世界初のAIを活用した多言語緊急調整プラットフォームを構築し、言語障壁に関係なく危機的状況にある人々を検証済みレスポンダーと即座につなぎます。私たちのテクノロジーは緊急コミュニケーションを100以上の言語でリアルタイムに翻訳し、支援がより速く効果的に到着することを保証します。"
      },
      values: {
        title: "私たちの価値観",
        humanity: {
          title: "人間性第一",
          description: "私たちが下すすべての決定は、人間の安全と尊厳を何よりも優先します。"
        },
        speed: {
          title: "速度が重要",
          description: "緊急時には秒単位が重要です。私たちは可能な限り最速の対応時間を最適化します。"
        },
        access: {
          title: "普遍的なアクセス",
          description: "緊急援助は場所や言語に関係なく、すべての人にアクセス可能であるべきです。"
        }
      },
      howWeWork: {
        title: "私たちの働き方",
        network: {
          title: "検証済みネットワーク",
          description: "すべてのレスポンダーは厳格な検証を受け、あなたが正当なNGO、病院、訓練された専門家とつながっていることを保証します。"
        },
        translation: {
          title: "AI翻訳",
          description: "私たちの高度なAIは文脈認識で緊急メッセージを即座に翻訳し、重要な詳細が翻訳で失われることがないようにします。"
        },
        coordination: {
          title: "調整された対応",
          description: "スマートなマッチングアルゴリズムが、場所、可用性、専門知識に基づいてあなたを最も適切な近くのレスポンダーとつなぎます。"
        },
        availability: {
          title: "24/7可用性",
          description: "私たちのグローバルネットワークは、あなたがどこにいても、緊急事態が発生する時間がいつであっても、支援が常に利用可能であることを保証します。"
        }
      },
      impact: {
        title: "私たちの影響",
        responders: "検証済みレスポンダー",
        countries: "国",
        languages: "言語",
        responseTime: "平均対応時間"
      }
    },
    contact: {
      title: "お問い合わせ",
      subtitle: "お手伝いが必要ですか、またはご質問がありますか？私たちがお手伝いします。",
      form: {
        name: "名前",
        email: "メール",
        category: "カテゴリ",
        message: "メッセージ",
        submit: "メッセージを送信",
        sending: "送信中...",
        namePlaceholder: "あなたのフルネーム",
        emailPlaceholder: "your.email@example.com",
        messagePlaceholder: "あなたの支援リクエストを説明してください..."
      },
      categories: {
        general: "一般的な質問",
        technical: "テクニカルサポート",
        partnership: "パートナーシップ",
        feedback: "フィードバック",
        emergency: "緊急事態"
      },
      validation: {
        fillAllFields: "必須フィールドをすべて入力してください。",
        invalidEmail: "有効なメールアドレスを入力してください。",
        messageTooShort: "メッセージは10文字以上である必要があります。",
        messageTooLong: "メッセージは1000文字を超えることはできません。"
      },
      messages: {
        submitSuccess: "メッセージが正常に送信されました！できるだけ早くご連絡いたします。",
        submitError: "メッセージの送信中にエラーが発生しました。もう一度お試しください。",
        networkError: "ネットワークエラー。インターネット接続を確認して、もう一度お試しください。"
      }
    }
  },
  zh: { // Chinese
    navigation: { ...enData.navigation, home: "首页", about: "关于", map: "地图" },
    emergency: { ...enData.emergency, sendSOS: "发送SOS" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "无国界紧急响应" },
    globalImpact: {
      title: "全球影响",
      description: "让紧急响应在世界各地都可访问",
      verifiedResponders: "已验证响应者",
      countriesCovered: "覆盖国家",
      languagesSupported: "支持语言",
      alwaysAvailable: "始终可用"
    },
    footer: {
      description: "通过AI驱动的多语言紧急翻译，将危机中的人与世界各地的已验证响应者连接起来。",
      platform: "平台",
      resources: "资源",
      copyright: "© 2025 BridgeX. 用 ❤️ 为全球紧急响应而建。"
    },
    about: {
      title: "关于BridgeX",
      subtitle: "打破紧急响应中的语言障碍，在边境间拯救生命",
      mission: {
        title: "我们的使命",
        description1: "BridgeX建立在一个简单但强大的信念之上：语言永远不应该成为获得紧急援助的障碍。在危机情况下，每一秒都很重要，沟通挑战可能意味着生与死的区别。",
        description2: "我们建立了世界上第一个AI驱动的多语言紧急协调平台，它立即将处于危机中的人与经过验证的响应者连接起来，无论语言障碍如何。我们的技术将紧急通信实时翻译成100多种语言，确保援助更快更有效地到达。"
      },
      values: {
        title: "我们的价值观",
        humanity: {
          title: "人性至上",
          description: "我们做出的每一个决定都将人类安全和尊严置于首位。"
        },
        speed: {
          title: "速度至关重要",
          description: "在紧急情况下，秒数很重要。我们针对尽可能快的响应时间进行优化。"
        },
        access: {
          title: "普遍访问",
          description: "紧急援助应该对所有人都是可访问的，无论地点或语言如何。"
        }
      },
      howWeWork: {
        title: "我们如何工作",
        network: {
          title: "验证网络",
          description: "所有响应者都经过严格验证，确保您与合法的NGO、医院和训练有素的专业人士连接。"
        },
        translation: {
          title: "AI翻译",
          description: "我们的先进AI立即翻译紧急消息，具有上下文意识，确保关键细节永远不会在翻译中丢失。"
        },
        coordination: {
          title: "协调响应",
          description: "智能匹配算法根据位置、可用性和专业知识将您与最合适的附近响应者连接。"
        },
        availability: {
          title: "24/7可用性",
          description: "我们的全球网络确保无论您身处何处或紧急情况何时发生，帮助始终可用。"
        }
      },
      impact: {
        title: "我们的影响",
        responders: "已验证响应者",
        countries: "国家",
        languages: "语言",
        responseTime: "平均响应时间"
      }
    },
    contact: {
      title: "联系我们",
      subtitle: "需要帮助或有疑问？我们在这里为您提供帮助。",
      form: {
        name: "姓名",
        email: "邮箱",
        category: "类别",
        message: "消息",
        submit: "发送消息",
        sending: "发送中...",
        namePlaceholder: "您的全名",
        emailPlaceholder: "your.email@example.com",
        messagePlaceholder: "描述您的帮助请求..."
      },
      categories: {
        general: "一般问题",
        technical: "技术支持",
        partnership: "合作伙伴关系",
        feedback: "反馈",
        emergency: "紧急情况"
      },
      validation: {
        fillAllFields: "请填写所有必填字段。",
        invalidEmail: "请输入有效的邮箱地址。",
        messageTooShort: "消息必须至少包含10个字符。",
        messageTooLong: "消息不能超过1000个字符。"
      },
      messages: {
        submitSuccess: "您的消息已成功发送！我们会尽快回复您。",
        submitError: "发送消息时发生错误。请重试。",
        networkError: "网络错误。请检查您的互联网连接并重试。"
      }
    }
  },
  ar: { // Arabic
    navigation: { ...enData.navigation, home: "الرئيسية", about: "حول", map: "خريطة" },
    emergency: { ...enData.emergency, sendSOS: "إرسال SOS" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "الاستجابة للطوارئ بلا حدود" },
    globalImpact: {
      title: "التأثير العالمي",
      description: "جعل الاستجابة للطوارئ متاحة في جميع أنحاء العالم",
      verifiedResponders: "المستجيبون المعتمدون",
      countriesCovered: "الدول المغطاة",
      languagesSupported: "اللغات المدعومة",
      alwaysAvailable: "متاح دائمًا"
    },
    footer: {
      description: "ربط الأشخاص في الأزمات بالمستجيبين المعتمدين في جميع أنحاء العالم من خلال ترجمة الطوارئ متعددة اللغات المعتمدة على الذكاء الاصطناعي.",
      platform: "المنصة",
      resources: "الموارد",
      copyright: "© 2025 BridgeX. مبني بـ ❤️ للاستجابة للطوارئ العالمية."
    },
    about: {
      title: "حول BridgeX",
      subtitle: "كسر حواجز اللغة في الاستجابة للطوارئ لإنقاذ الأرواح عبر الحدود",
      mission: {
        title: "مهمتنا",
        description1: "تم تأسيس BridgeX على اعتقاد بسيط ولكنه قوي: يجب ألا تكون اللغة حاجزًا أبدًا أمام الحصول على المساعدة في حالات الطوارئ. في حالات الأزمات، كل ثانية مهمة، وقد تعني تحديات التواصل الفرق بين الحياة والموت.",
        description2: "لقد بنينا أول منصة تنسيق طوارئ متعددة اللغات معتمدة على الذكاء الاصطناعي في العالم، والتي تربط فورًا الأشخاص في الأزمات بالمستجيبين المعتمدين، بغض النظر عن حواجز اللغة. تقوم تقنيتنا بترجمة الاتصالات الطارئة في الوقت الفعلي إلى أكثر من 100 لغة، مما يضمن وصول المساعدة بشكل أسرع وأكثر فعالية."
      },
      values: {
        title: "قيمنا",
        humanity: {
          title: "الإنسانية أولاً",
          description: "كل قرار نتخذه يعطي الأولوية للسلامة والكرامة الإنسانية فوق كل شيء."
        },
        speed: {
          title: "السرعة مهمة",
          description: "في حالات الطوارئ، الثواني مهمة. نحن نعمل على تحسين أسرع أوقات الاستجابة الممكنة."
        },
        access: {
          title: "الوصول العالمي",
          description: "يجب أن تكون المساعدة في حالات الطوارئ متاحة للجميع، بغض النظر عن الموقع أو اللغة."
        }
      },
      howWeWork: {
        title: "كيف نعمل",
        network: {
          title: "الشبكة المعتمدة",
          description: "يخضع جميع المستجيبين للتحقق الصارم لضمان اتصالك بالمنظمات غير الحكومية الشرعية والمستشفيات والمتخصصين المدربين."
        },
        translation: {
          title: "ترجمة الذكاء الاصطناعي",
          description: "يترجم ذكاؤنا الاصطناعي المتقدم رسائل الطوارئ فورًا مع الوعي بالسياق، مما يضمن عدم فقدان التفاصيل الحرجة في الترجمة."
        },
        coordination: {
          title: "الاستجابة المنسقة",
          description: "تربط خوارزميات المطابقة الذكية بك مع أنسب المستجيبين القريبين بناءً على الموقع والتوافر والخبرة."
        },
        availability: {
          title: "التوافر 24/7",
          description: "تضمن شبكتنا العالمية توافر المساعدة دائمًا، بغض النظر عن مكان وجودك أو وقت حدوث الطوارئ."
        }
      },
      impact: {
        title: "تأثيرنا",
        responders: "المستجيبون المعتمدون",
        countries: "الدول",
        languages: "اللغات",
        responseTime: "متوسط وقت الاستجابة"
      }
    },
    contact: {
      title: "اتصل بنا",
      subtitle: "هل تحتاج إلى مساعدة أو لديك أسئلة؟ نحن هنا لمساعدتك.",
      form: {
        name: "الاسم",
        email: "البريد الإلكتروني",
        category: "الفئة",
        message: "الرسالة",
        submit: "إرسال الرسالة",
        sending: "جارٍ الإرسال...",
        namePlaceholder: "اسمك الكامل",
        emailPlaceholder: "your.email@example.com",
        messagePlaceholder: "وصف طلب المساعدة الخاص بك..."
      },
      categories: {
        general: "سؤال عام",
        technical: "الدعم الفني",
        partnership: "الشراكة",
        feedback: "التعليقات",
        emergency: "الطوارئ"
      },
      validation: {
        fillAllFields: "يرجى ملء جميع الحقول المطلوبة.",
        invalidEmail: "يرجى إدخال عنوان بريد إلكتروني صالح.",
        messageTooShort: "يجب أن تحتوي الرسالة على 10 أحرف على الأقل.",
        messageTooLong: "لا يمكن أن تتجاوز الرسالة 1000 حرف."
      },
      messages: {
        submitSuccess: "تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت ممكن.",
        submitError: "حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.",
        networkError: "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
      }
    }
  },
  ko: { // Korean
    navigation: { ...enData.navigation, home: "홈", about: "소개", map: "지도" },
    emergency: { ...enData.emergency, sendSOS: "SOS 보내기" },
    home: { ...enData.home, emergencyResponseWithoutBorders: "국경 없는 긴급 대응" },
    globalImpact: {
      title: "글로벌 영향",
      description: "전 세계적으로 긴급 대응을 접근 가능하게 만들기",
      verifiedResponders: "검증된 응답자",
      countriesCovered: "커버 국가",
      languagesSupported: "지원 언어",
      alwaysAvailable: "항상 사용 가능"
    },
    footer: {
      description: "AI 기반 다국어 긴급 번역을 통해 전 세계 위기 상황에 있는 사람들과 검증된 응답자를 연결합니다.",
      platform: "플랫폼",
      resources: "리소스",
      copyright: "© 2025 BridgeX. 글로벌 긴급 대응을 위해 ❤️로 구축."
    },
    about: {
      title: "BridgeX 소개",
      subtitle: "국경을 넘어 생명을 구하기 위한 긴급 대응에서 언어 장벽을 허무는 것",
      mission: {
        title: "우리의 사명",
        description1: "BridgeX는 단순하지만 강력한 신념에 기반하여 설립되었습니다: 언어는 긴급 도움을 받는 데 장벽이 되어서는 안 됩니다. 위기 상황에서 매 초가 중요하며, 의사소통 도전이 삶과 죽음의 차이를 의미할 수 있습니다.",
        description2: "우리는 언어 장벽에 관계없이 위기 상황에 있는 사람들을 검증된 응답자와 즉시 연결하는 세계 최초의 AI 기반 다국어 긴급 조정 플랫폼을 구축했습니다. 우리의 기술은 긴급 커뮤니케이션을 100개 이상의 언어로 실시간 번역하여 도움이 더 빠르고 효과적으로 도착하도록 합니다."
      },
      values: {
        title: "우리의 가치",
        humanity: {
          title: "인간성 우선",
          description: "우리가 내리는 모든 결정은 인간의 안전과 존엄성을 최우선으로 합니다."
        },
        speed: {
          title: "속도가 중요",
          description: "긴급 상황에서 초가 중요합니다. 우리는 가능한 가장 빠른 응답 시간을 최적화합니다."
        },
        access: {
          title: "보편적 접근",
          description: "긴급 도움은 위치나 언어에 관계없이 모든 사람이 접근할 수 있어야 합니다."
        }
      },
      howWeWork: {
        title: "우리가 어떻게 일하는지",
        network: {
          title: "검증된 네트워크",
          description: "모든 응답자는 엄격한 검증을 거쳐 합법적인 NGO, 병원, 훈련된 전문가와 연결되도록 합니다."
        },
        translation: {
          title: "AI 번역",
          description: "우리의 고급 AI는 컨텍스트 인식으로 긴급 메시지를 즉시 번역하여 중요한 세부 사항이 번역에서 손실되지 않도록 합니다."
        },
        coordination: {
          title: "조정된 응답",
          description: "스마트 매칭 알고리즘이 위치, 가용성, 전문성에 기반하여 가장 적합한 근처 응답자와 연결합니다."
        },
        availability: {
          title: "24/7 가용성",
          description: "우리의 글로벌 네트워크는 어디에 있든 긴급 상황이 언제 발생하든 도움이 항상 이용 가능하도록 합니다."
        }
      },
      impact: {
        title: "우리의 영향",
        responders: "검증된 응답자",
        countries: "국가",
        languages: "언어",
        responseTime: "평균 응답 시간"
      }
    },
    contact: {
      title: "문의하기",
      subtitle: "도움이 필요하거나 질문이 있으신가요? 우리가 도와드리겠습니다.",
      form: {
        name: "이름",
        email: "이메일",
        category: "카테고리",
        message: "메시지",
        submit: "메시지 보내기",
        sending: "보내는 중...",
        namePlaceholder: "귀하의 전체 이름",
        emailPlaceholder: "your.email@example.com",
        messagePlaceholder: "귀하의 도움 요청을 설명하십시오..."
      },
      categories: {
        general: "일반 질문",
        technical: "기술 지원",
        partnership: "파트너십",
        feedback: "피드백",
        emergency: "긴급 상황"
      },
      validation: {
        fillAllFields: "모든 필수 필드를 작성하십시오.",
        invalidEmail: "유효한 이메일 주소를 입력하십시오.",
        messageTooShort: "메시지는 최소 10자 이상이어야 합니다.",
        messageTooLong: "메시지는 1000자를 초과할 수 없습니다."
      },
      messages: {
        submitSuccess: "메시지가 성공적으로 전송되었습니다! 가능한 한 빨리 답변드리겠습니다.",
        submitError: "메시지 전송 중 오류가 발생했습니다. 다시 시도하십시오.",
        networkError: "네트워크 오류. 인터넷 연결을 확인하고 다시 시도하십시오."
      }
    }
  }
};

// Merge with English data for missing translations
for (const [lang, data] of Object.entries(translations)) {
  const merged = JSON.parse(JSON.stringify(enData)); // Deep clone

  // Convert nested translations to flat keys and merge
  function flattenTranslations(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        Object.assign(result, flattenTranslations(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    return result;
  }

  const flatTranslations = flattenTranslations(data);
  Object.assign(merged, flatTranslations);

  // Write to both locations
  const publicPath = path.join(__dirname, 'public', 'i18n', 'locales', `${lang}.json`);
  const i18nPath = path.join(__dirname, 'i18n', 'locales', `${lang}.json`);

  fs.writeFileSync(publicPath, JSON.stringify(merged, null, 2));
  fs.writeFileSync(i18nPath, JSON.stringify(merged, null, 2));

  console.log(`✅ Generated ${lang}.json`);
}

console.log('\n🎉 All 9 language files generated successfully!');
console.log('📝 Languages: en, es, fr, ru, de, ja, zh, ar, ko');
