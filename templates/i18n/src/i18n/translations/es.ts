import type { TranslationKeys } from './en';

/**
 * Spanish translations
 */
export const es: TranslationKeys = {
  // Site
  site: {
    name: 'Velocity',
    description: 'Una plantilla moderna de inicio con Astro',
  },

  // Navigation
  nav: {
    home: 'Inicio',
    about: 'Acerca de',
    blog: 'Blog',
    contact: 'Contacto',
    features: 'Características',
    components: 'Componentes',
    docs: 'Documentación',
    getStarted: 'Comenzar',
  },

  // Common
  common: {
    readMore: 'Leer más',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    notFound: 'Página no encontrada',
    backHome: 'Volver al inicio',
    copied: '¡Copiado!',
    copy: 'Copiar',
  },

  // Hero Section
  hero: {
    badge: 'v1.0 Beta Pública Disponible',
    title: 'Tu próximo sitio',
    titleHighlight: 'comienza aquí.',
    description:
      'Clona el repositorio. Personaliza los tokens. Despliega el viernes. Velocity maneja las partes tediosas para que puedas enfocarte en el trabajo que importa.',
    cta: 'Comenzar',
    github: 'Ver en GitHub',
    socialProof: 'Usado por más de 40 agencias en producción',
  },

  // Tech Stack Section
  techStack: {
    astro: {
      name: 'Astro 6',
      desc: 'Islas de servidor y capa de contenido',
    },
    tailwind: {
      name: 'Tailwind v4',
      desc: 'Motor CSS sin runtime',
    },
    typescript: {
      name: 'TypeScript',
      desc: 'Seguridad de tipos estricta por defecto',
    },
    motion: {
      name: 'Motion',
      desc: 'Animaciones declarativas',
    },
  },

  // Feature Tabs Section
  features: {
    sectionTitle: 'Todo lo que necesitas.',
    sectionTitleHighlight: 'Nada que no.',
    sectionDescription:
      'Eliminamos el exceso y mantuvimos las primitivas que realmente aceleran el desarrollo para agencias y freelancers.',
    tabs: {
      design: {
        label: 'Sistema de Diseño',
        desc: 'Tokens globales y tipografía',
        title: 'Tokens de Diseño CSS-First',
        content:
          'Velocity implementa un sistema de diseño completo usando la nueva configuración CSS-first de Tailwind v4. Sin archivos de configuración JavaScript desordenados.',
      },
      seo: {
        label: 'SEO y Meta',
        desc: 'OpenGraph y sitemaps',
        title: 'Manejo Automatizado de SEO',
        content:
          'Las colecciones de contenido de Astro potencian la inyección de metadatos tipados para cada página. Las imágenes para compartir se generan automáticamente.',
      },
      perf: {
        label: 'Rendimiento',
        desc: '100/100 Core Web Vitals',
        title: 'Cero JS por Defecto',
        content:
          'Utilizamos la arquitectura de islas de Astro para asegurar que tus páginas de marketing envíen 0kb de JavaScript al cliente a menos que sea explícitamente interactivo.',
      },
      components: {
        label: 'Componentes',
        desc: 'Primitivas de UI reutilizables',
        title: 'Componentes Type-Safe',
        content:
          'Construye con confianza usando componentes TypeScript-first. Validación completa de props y autocompletado del IDE incluidos.',
      },
      i18n: {
        label: 'Internacionalización',
        desc: 'Soporte multilenguaje',
        title: 'Internacionalización Integrada',
        content:
          'Soporte de primera clase para sitios multilenguaje con traducciones type-safe, detección automática de idioma y estructuras de URL amigables para SEO.',
      },
    },
  },

  // Credibility Section
  credibility: {
    badge: 'Probado en Producción',
    title: 'Creado por Southwell Media. Nacido de la',
    titleHighlight: 'presión de plazos',
    paragraph1:
      'Somos una agencia digital que entrega sitios de marketing de alto rendimiento. Nos cansamos de pasar los primeros 3 días de cada proyecto configurando las mismas herramientas, configuraciones SEO y definiciones de tipos.',
    paragraph2:
      'Velocity no es un ejercicio teórico. Es exactamente el código que usamos para entregar proyectos de clientes en 14-21 días en lugar del estándar de la industria de 60.',
    stats: {
      lighthouse: {
        score: 'Perfecto',
        label: 'Puntuaciones Lighthouse',
      },
      delivery: {
        days: '14 Días',
        label: 'Tiempo Promedio de Entrega',
      },
    },
    standard: {
      title: 'El Estándar Velocity',
      items: [
        'Sin CSS no utilizado en producción',
        'Imágenes optimizadas en tiempo de compilación',
        'Content Collections tipadas',
        'Primitivas accesibles preconfiguradas',
      ],
    },
    testimonial: {
      quote: '"El boilerplate más limpio que he visto en 2024. Elimina lo innecesario."',
      author: '— Alex C., Senior Frontend Dev',
    },
  },

  // CTA Section
  cta: {
    title: 'Deja de configurar.',
    titleHighlight: 'Empieza a entregar.',
    description:
      'Únete a los desarrolladores que construyen sitios web más rápidos y mejores con Velocity. Open source y gratis para siempre.',
    docs: 'Leer la Documentación',
    command: 'npm create velocity@latest',
  },

  // Footer
  footer: {
    copyright: '© {year} Velocity. Todos los derechos reservados.',
    madeWith: 'Hecho con',
    maintainedBy: 'Mantenido por',
    links: {
      documentation: 'Documentación',
      github: 'GitHub',
      twitter: 'Twitter',
      license: 'Licencia',
    },
  },

  // Home page
  home: {
    title: 'Bienvenido a Velocity',
    subtitle: 'El starter de Astro con opiniones que realmente quieres usar',
    cta: 'Comenzar',
  },

  // About page
  about: {
    meta: {
      title: 'Sobre Nosotros',
      description: 'Conoce Velocity y el equipo detrás del proyecto.',
    },
    hero: {
      badge: 'Nuestra Historia',
      title: 'Creado por desarrolladores,',
      titleHighlight: 'para desarrolladores.',
      description: 'Velocity nació de la frustración de configurar las mismas herramientas una y otra vez. Decidimos crear el starter que siempre quisimos que existiera.',
    },
    mission: {
      title: 'Nuestra Misión',
      description: 'Ayudar a los desarrolladores a crear sitios web hermosos y de alto rendimiento más rápido, eliminando el código repetitivo y proporcionando valores predeterminados sensatos.',
    },
    values: {
      title: 'Lo Que Creemos',
      performance: {
        title: 'Rendimiento Primero',
        description: 'Cada decisión se toma pensando en el rendimiento. Cero JavaScript por defecto, imágenes optimizadas y CSS mínimo.',
      },
      simplicity: {
        title: 'La Simplicidad Importa',
        description: 'Eliminamos la complejidad para que puedas enfocarte en lo que importa: crear excelentes productos para tus usuarios.',
      },
      openSource: {
        title: 'Código Abierto',
        description: 'Velocity es gratuito y de código abierto. Creemos en devolver a la comunidad que hizo esto posible.',
      },
    },
  },

  // Contact page
  contact: {
    meta: {
      title: 'Contáctanos',
      description: 'Ponte en contacto con el equipo de Velocity.',
    },
    hero: {
      badge: 'Ponte en Contacto',
      title: 'Vamos a',
      titleHighlight: 'conectar.',
      description: '¿Tienes una pregunta, sugerencia o simplemente quieres saludar? Nos encantaría saber de ti.',
    },
    form: {
      title: 'Envíanos un mensaje',
      name: 'Tu Nombre',
      namePlaceholder: 'Juan Pérez',
      email: 'Correo Electrónico',
      emailPlaceholder: 'juan@ejemplo.com',
      subject: 'Asunto',
      subjectPlaceholder: '¿Cómo podemos ayudarte?',
      message: 'Mensaje',
      messagePlaceholder: 'Cuéntanos más sobre tu proyecto o pregunta...',
      submit: 'Enviar Mensaje',
      sending: 'Enviando...',
      success: '¡Mensaje enviado con éxito! Te responderemos pronto.',
      error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.',
    },
    info: {
      title: 'Otras formas de contactarnos',
      email: {
        label: 'Correo',
        value: 'hola@velocity.dev',
      },
      github: {
        label: 'GitHub',
        value: 'github.com/velocity',
      },
      twitter: {
        label: 'Twitter',
        value: '@velocity_dev',
      },
    },
  },

  // Forms
  form: {
    name: 'Nombre',
    email: 'Correo electrónico',
    message: 'Mensaje',
    submit: 'Enviar',
    sending: 'Enviando...',
    success: '¡Mensaje enviado con éxito!',
    error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.',
  },

  // Blog
  blog: {
    title: 'Blog',
    description: 'Últimos artículos y actualizaciones',
    allPosts: 'Todos los artículos',
    featured: 'Destacados',
    noPosts: 'No se encontraron artículos',
    relatedPosts: 'Artículos relacionados',
    backToBlog: 'Volver al Blog',
    subscribe: 'Suscríbete',
    subscribeDescription: 'Recibe los últimos artículos y actualizaciones en tu correo.',
    emailPlaceholder: 'Introduce tu correo',
    subscribeButton: 'Suscribirse',
  },

  // Components Page
  components: {
    meta: {
      title: 'Componentes',
      description: 'Explora la biblioteca completa de componentes UI de Velocity. Listos para producción, accesibles y bellamente diseñados.',
    },
    hero: {
      badge: 'Componentes de Producción',
      title: 'Biblioteca de',
      titleHighlight: 'Componentes',
      description: 'Primitivas UI listas para producción, construidas con accesibilidad y rendimiento en mente. Copia, pega y personaliza para tu marca.',
      browseComponents: 'Explorar Componentes',
      viewSource: 'Ver Código',
    },
    categories: {
      buttons: 'Botones',
      inputs: 'Campos de Formulario',
      feedback: 'Retroalimentación',
      overlays: 'Superposiciones',
      data: 'Visualización de Datos',
      loading: 'Cargando',
    },
    sections: {
      buttons: {
        title: 'Botones',
        description: 'Elementos interactivos para acciones y navegación. Todas las variantes soportan iconos, estados de carga y accesibilidad completa.',
        variants: 'Variantes',
        variantsHint: '6 estilos para diferentes contextos',
        sizes: 'Tamaños',
        sizesHint: 'Escalado responsivo',
        states: 'Estados',
        withIcons: 'Con Iconos',
        primary: 'Primario',
        secondary: 'Secundario',
        outline: 'Contorno',
        ghost: 'Fantasma',
        link: 'Enlace',
        destructive: 'Destructivo',
        small: 'Pequeño',
        medium: 'Mediano',
        large: 'Grande',
        default: 'Por defecto',
        loading: 'Cargando',
        disabled: 'Deshabilitado',
        send: 'Enviar',
        export: 'Exportar',
        star: 'Favorito',
      },
      inputs: {
        title: 'Campos de Formulario',
        description: 'Campos de texto, selectores, casillas de verificación y más. Construidos con validación nativa y soporte ARIA.',
        textInput: 'Campo de Texto',
        textInputHint: 'Con etiquetas y validación',
        textarea: 'Área de Texto',
        textareaHint: 'Entrada de texto multilínea',
        select: 'Selector',
        selectHint: 'Desplegable nativo',
        checkboxes: 'Casillas',
        checkboxesHint: 'Controles de selección múltiple',
        planSelection: 'Selección de Plan',
        planSelectionHint: 'Opciones tipo tarjeta',
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'tu@ejemplo.com',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: '••••••••',
        passwordHint: 'Mínimo 8 caracteres',
        disabledLabel: 'Deshabilitado',
        disabledPlaceholder: 'No editable',
        messageLabel: 'Mensaje',
        messagePlaceholder: 'Escribe tu mensaje aquí...',
        messageHint: 'Soporta formato markdown',
        countryLabel: 'País',
        selectCountry: 'Selecciona un país...',
        termsLabel: 'Acepto los términos de servicio',
        updatesLabel: 'Enviarme actualizaciones del producto',
        notificationsLabel: 'Habilitar notificaciones',
        notificationsDesc: 'Recibir alertas de actualizaciones importantes',
        planFree: 'Gratis',
        planFreeDesc: 'Funciones básicas para proyectos personales',
        planPro: 'Pro',
        planProDesc: 'Herramientas avanzadas para profesionales',
        planTeam: 'Equipo',
        planTeamDesc: 'Funciones de colaboración para equipos',
      },
      feedback: {
        title: 'Retroalimentación',
        description: 'Insignias, alertas e indicadores de estado para comunicar estados y guiar acciones del usuario.',
        badges: 'Insignias',
        badgesHint: 'Indicadores de estado',
        alerts: 'Alertas',
        alertsHint: 'Mensajes contextuales',
        default: 'Por defecto',
        success: 'Éxito',
        warning: 'Advertencia',
        error: 'Error',
        info: 'Info',
        tipTitle: 'Consejo',
        tipContent: 'Usa atajos de teclado para navegar más rápido. Presiona',
        tipKey: '⌘K',
        tipEnd: 'para abrir la paleta de comandos.',
        deployTitle: 'Despliegue exitoso',
        deployContent: 'Tus cambios están en vivo en',
        limitTitle: 'Acercándose al límite',
        limitContent: 'Has usado el 80% de tu cuota mensual de API. Considera actualizar tu plan.',
        buildTitle: 'Compilación fallida',
        buildContent: 'Error en',
        buildError: '— falta prop requerida "variant"',
      },
      overlays: {
        title: 'Superposiciones',
        description: 'Diálogos, menús desplegables, tooltips y pestañas. Navegación completa por teclado y gestión de foco.',
        dialog: 'Diálogo',
        dialogHint: 'Superposición modal',
        dropdown: 'Menú',
        dropdownHint: 'Menú de acciones',
        tooltips: 'Tooltips',
        tooltipsHint: 'Sugerencias contextuales',
        tabs: 'Pestañas',
        tabsHint: 'Organización de contenido',
        openDialog: 'Abrir Diálogo',
        deleteTitle: '¿Eliminar proyecto?',
        deleteDesc: 'Esta acción no se puede deshacer.',
        deleteConfirm: '¿Estás seguro de que quieres eliminar',
        deleteWarning: 'Todos los archivos, despliegues y datos analíticos serán eliminados permanentemente.',
        cancel: 'Cancelar',
        deleteProject: 'Eliminar Proyecto',
        actions: 'Acciones',
        edit: 'Editar',
        duplicate: 'Duplicar',
        share: 'Compartir',
        archive: 'Archivar',
        delete: 'Eliminar',
        top: 'Arriba',
        bottom: 'Abajo',
        left: 'Izquierda',
        right: 'Derecha',
        tooltipTop: 'Tooltip arriba',
        tooltipBottom: 'Tooltip abajo',
        tooltipLeft: 'Tooltip izquierda',
        tooltipRight: 'Tooltip derecha',
        overview: 'Resumen',
        analytics: 'Analíticas',
        settings: 'Configuración',
        overviewContent: 'Resumen del proyecto con métricas clave y actividad reciente. Las pestañas soportan navegación completa por teclado.',
        analyticsContent: 'Datos analíticos con gráficos e información de rendimiento. Usa las flechas para navegar entre pestañas.',
        settingsContent: 'Configura los ajustes de tu proyecto. Usa Inicio/Fin para saltar a la primera/última pestaña.',
      },
      data: {
        title: 'Visualización de Datos',
        description: 'Tarjetas, avatares e iconos para presentar contenido e información del usuario.',
        cards: 'Tarjetas',
        cardsHint: 'Contenedores de contenido',
        avatars: 'Avatares',
        avatarsHint: 'Representaciones de usuario',
        icons: 'Iconos',
        iconsHint: 'Set de iconos Lucide — 24 incluidos',
        stacked: 'Apilados',
        performance: 'Rendimiento',
        performanceScore: '100/100 Lighthouse',
        performanceDesc: 'Cero JavaScript por defecto. Arquitectura de islas con hidratación selectiva para velocidad óptima.',
        typeSafe: 'Type-Safe',
        typeSafeScore: 'TypeScript Completo',
        typeSafeDesc: 'Tipos estrictos con autocompletado del IDE y verificación de errores en tiempo de compilación.',
        i18nReady: 'i18n Listo',
        i18nScore: 'Multi-idioma',
        i18nDesc: 'Sistema de traducción integrado con URLs amigables para SEO y detección automática de idioma.',
      },
      loading: {
        title: 'Cargando',
        description: 'Esqueletos de carga para rendimiento percibido mientras se obtiene el contenido.',
        skeletonTypes: 'Tipos de Esqueleto',
        skeletonTypesHint: 'Texto, circular, rectangular',
        cardSkeleton: 'Esqueleto de Tarjeta',
        cardSkeletonHint: 'Estado de carga compuesto',
      },
    },
    cta: {
      title: '¿Listo para construir?',
      description: 'Estos componentes son solo el comienzo. Clona Velocity y empieza a entregar más rápido.',
      cloneRepo: 'Clonar Repositorio',
      readDocs: 'Leer Documentación',
    },
  },

  // Consent Banner
  consent: {
    heading: 'Preferencias de Cookies',
    description: 'Usamos cookies para mejorar tu experiencia de navegación, ofrecer contenido personalizado y analizar nuestro tráfico.',
    acceptAll: 'Aceptar Todo',
    declineAll: 'Rechazar Todo',
    customize: 'Personalizar',
    savePreferences: 'Guardar Preferencias',
    settingsHeading: 'Configuración de Privacidad',
    privacyPolicyLabel: 'Política de Privacidad',
    alwaysOn: 'Siempre activo',
  },
} as const;
