import type { TranslationKeys } from './en';

/**
 * French translations
 */
export const fr: TranslationKeys = {
  // Site
  site: {
    name: 'Velocity',
    description: 'Un template de démarrage Astro moderne',
  },

  // Navigation
  nav: {
    home: 'Accueil',
    about: 'À propos',
    blog: 'Blog',
    contact: 'Contact',
    features: 'Fonctionnalités',
    components: 'Composants',
    docs: 'Documentation',
    getStarted: 'Commencer',
  },

  // Common
  common: {
    readMore: 'Lire la suite',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    notFound: 'Page non trouvée',
    backHome: "Retour à l'accueil",
    copied: 'Copié !',
    copy: 'Copier',
  },

  // Hero Section
  hero: {
    badge: 'v1.0 Bêta Publique Disponible',
    title: 'Votre prochain site',
    titleHighlight: 'commence ici.',
    description:
      "Clonez le dépôt. Personnalisez les tokens. Déployez vendredi. Velocity gère les parties fastidieuses pour que vous puissiez vous concentrer sur le travail qui compte.",
    cta: 'Commencer',
    github: 'Voir sur GitHub',
    socialProof: 'Utilisé par plus de 40 agences en production',
  },

  // Tech Stack Section
  techStack: {
    astro: {
      name: 'Astro 6',
      desc: 'Îles serveur et couche de contenu',
    },
    tailwind: {
      name: 'Tailwind v4',
      desc: 'Moteur CSS sans runtime',
    },
    typescript: {
      name: 'TypeScript',
      desc: 'Typage strict par défaut',
    },
    motion: {
      name: 'Motion',
      desc: 'Animations déclaratives',
    },
  },

  // Feature Tabs Section
  features: {
    sectionTitle: 'Tout ce dont vous avez besoin.',
    sectionTitleHighlight: 'Rien de superflu.',
    sectionDescription:
      "Nous avons éliminé le superflu et gardé les primitives qui accélèrent vraiment le développement pour les agences et les freelances.",
    tabs: {
      design: {
        label: 'Système de Design',
        desc: 'Tokens globaux et typographie',
        title: 'Tokens de Design CSS-First',
        content:
          "Velocity implémente un système de design complet utilisant la nouvelle configuration CSS-first de Tailwind v4. Pas de fichiers de configuration JavaScript désordonnés.",
      },
      seo: {
        label: 'SEO et Meta',
        desc: 'OpenGraph et sitemaps',
        title: 'Gestion SEO Automatisée',
        content:
          "Les collections de contenu d'Astro alimentent l'injection de métadonnées typées pour chaque page. Les images de partage sont générées automatiquement.",
      },
      perf: {
        label: 'Performance',
        desc: '100/100 Core Web Vitals',
        title: 'Zéro JS par Défaut',
        content:
          "Nous utilisons l'architecture en îles d'Astro pour garantir que vos pages marketing n'envoient 0kb de JavaScript au client sauf si explicitement interactif.",
      },
      components: {
        label: 'Composants',
        desc: 'Primitives UI réutilisables',
        title: 'Composants Type-Safe',
        content:
          "Construisez avec confiance en utilisant des composants TypeScript-first. Validation complète des props et autocomplétion de l'IDE incluses.",
      },
      i18n: {
        label: 'Internationalisation',
        desc: 'Support multilingue',
        title: 'Internationalisation Intégrée',
        content:
          "Support de première classe pour les sites multilingues avec des traductions type-safe, détection automatique de la langue et structures d'URL optimisées pour le SEO.",
      },
    },
  },

  // Credibility Section
  credibility: {
    badge: 'Testé en Production',
    title: 'Créé par Southwell Media. Né de la',
    titleHighlight: 'pression des délais',
    paragraph1:
      "Nous sommes une agence digitale qui livre des sites marketing haute performance. Nous en avions assez de passer les 3 premiers jours de chaque projet à configurer les mêmes outils, configs SEO et définitions de types.",
    paragraph2:
      "Velocity n'est pas un exercice théorique. C'est exactement le code que nous utilisons pour livrer des projets clients en 14-21 jours au lieu des 60 jours standard de l'industrie.",
    stats: {
      lighthouse: {
        score: 'Parfait',
        label: 'Scores Lighthouse',
      },
      delivery: {
        days: '14 Jours',
        label: 'Temps de Livraison Moyen',
      },
    },
    standard: {
      title: 'Le Standard Velocity',
      items: [
        'Aucun CSS inutilisé en production',
        'Images optimisées au build',
        'Content Collections typées',
        'Primitives accessibles préconfigurées',
      ],
    },
    testimonial: {
      quote: '"Le boilerplate le plus propre que j\'ai vu en 2024. Il élimine le superflu."',
      author: '— Alex C., Senior Frontend Dev',
    },
  },

  // CTA Section
  cta: {
    title: 'Arrêtez de configurer.',
    titleHighlight: 'Commencez à livrer.',
    description:
      "Rejoignez les développeurs qui construisent des sites web plus rapides et meilleurs avec Velocity. Open source et gratuit pour toujours.",
    docs: 'Lire la Documentation',
    command: 'npm create velocity@latest',
  },

  // Footer
  footer: {
    copyright: '© {year} Velocity. Tous droits réservés.',
    madeWith: 'Fait avec',
    maintainedBy: 'Maintenu par',
    links: {
      documentation: 'Documentation',
      github: 'GitHub',
      twitter: 'Twitter',
      license: 'Licence',
    },
  },

  // Home page
  home: {
    title: 'Bienvenue sur Velocity',
    subtitle: "Le starter Astro opinioné que vous voulez vraiment utiliser",
    cta: 'Commencer',
  },

  // About page
  about: {
    meta: {
      title: 'À Propos',
      description: 'Découvrez Velocity et l\'équipe derrière le projet.',
    },
    hero: {
      badge: 'Notre Histoire',
      title: 'Créé par des développeurs,',
      titleHighlight: 'pour des développeurs.',
      description: 'Velocity est né de la frustration de configurer les mêmes outils encore et encore. Nous avons décidé de créer le starter que nous avions toujours voulu.',
    },
    mission: {
      title: 'Notre Mission',
      description: 'Aider les développeurs à créer des sites web beaux et performants plus rapidement en éliminant le code répétitif et en fournissant des valeurs par défaut sensées.',
    },
    values: {
      title: 'Ce Que Nous Croyons',
      performance: {
        title: 'Performance Avant Tout',
        description: 'Chaque décision est prise en pensant à la performance. Zéro JavaScript par défaut, images optimisées et CSS minimal.',
      },
      simplicity: {
        title: 'La Simplicité Compte',
        description: 'Nous éliminons la complexité pour que vous puissiez vous concentrer sur ce qui compte : créer d\'excellents produits pour vos utilisateurs.',
      },
      openSource: {
        title: 'Open Source',
        description: 'Velocity est gratuit et open source. Nous croyons qu\'il faut rendre à la communauté ce qui a rendu cela possible.',
      },
    },
  },

  // Contact page
  contact: {
    meta: {
      title: 'Contactez-nous',
      description: 'Prenez contact avec l\'équipe Velocity.',
    },
    hero: {
      badge: 'Prenez Contact',
      title: 'Restons en',
      titleHighlight: 'contact.',
      description: 'Une question, une suggestion ou juste envie de dire bonjour ? Nous serions ravis de vous entendre.',
    },
    form: {
      title: 'Envoyez-nous un message',
      name: 'Votre Nom',
      namePlaceholder: 'Jean Dupont',
      email: 'Adresse E-mail',
      emailPlaceholder: 'jean@exemple.fr',
      subject: 'Sujet',
      subjectPlaceholder: 'Comment pouvons-nous vous aider ?',
      message: 'Message',
      messagePlaceholder: 'Dites-nous en plus sur votre projet ou question...',
      submit: 'Envoyer le Message',
      sending: 'Envoi en cours...',
      success: 'Message envoyé avec succès ! Nous vous répondrons bientôt.',
      error: 'Échec de l\'envoi du message. Veuillez réessayer plus tard.',
    },
    info: {
      title: 'Autres moyens de nous contacter',
      email: {
        label: 'E-mail',
        value: 'bonjour@velocity.dev',
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
    name: 'Nom',
    email: 'E-mail',
    message: 'Message',
    submit: 'Envoyer',
    sending: 'Envoi en cours...',
    success: 'Message envoyé avec succès !',
    error: "Échec de l'envoi du message. Veuillez réessayer.",
  },

  // Blog
  blog: {
    title: 'Blog',
    description: 'Derniers articles et mises à jour',
    allPosts: 'Tous les articles',
    featured: 'À la une',
    noPosts: 'Aucun article trouvé',
    relatedPosts: 'Articles connexes',
    backToBlog: 'Retour au Blog',
    subscribe: "S'abonner",
    subscribeDescription: 'Recevez les derniers articles et mises à jour dans votre boîte mail.',
    emailPlaceholder: 'Entrez votre e-mail',
    subscribeButton: "S'abonner",
  },

  // Components Page
  components: {
    meta: {
      title: 'Composants',
      description: "Explorez la bibliothèque complète de composants UI de Velocity. Prêts pour la production, accessibles et magnifiquement conçus.",
    },
    hero: {
      badge: 'Composants de Production',
      title: 'Bibliothèque de',
      titleHighlight: 'Composants',
      description: "Primitives UI prêtes pour la production, construites avec l'accessibilité et la performance en tête. Copiez, collez et personnalisez pour votre marque.",
      browseComponents: 'Parcourir les Composants',
      viewSource: 'Voir le Code',
    },
    categories: {
      buttons: 'Boutons',
      inputs: 'Champs de Formulaire',
      feedback: 'Retour Utilisateur',
      overlays: 'Superpositions',
      data: 'Affichage de Données',
      loading: 'Chargement',
    },
    sections: {
      buttons: {
        title: 'Boutons',
        description: "Éléments interactifs pour les actions et la navigation. Toutes les variantes supportent les icônes, les états de chargement et l'accessibilité complète.",
        variants: 'Variantes',
        variantsHint: '6 styles pour différents contextes',
        sizes: 'Tailles',
        sizesHint: 'Mise à échelle responsive',
        states: 'États',
        withIcons: 'Avec Icônes',
        primary: 'Primaire',
        secondary: 'Secondaire',
        outline: 'Contour',
        ghost: 'Fantôme',
        link: 'Lien',
        destructive: 'Destructif',
        small: 'Petit',
        medium: 'Moyen',
        large: 'Grand',
        default: 'Par défaut',
        loading: 'Chargement',
        disabled: 'Désactivé',
        send: 'Envoyer',
        export: 'Exporter',
        star: 'Favori',
      },
      inputs: {
        title: 'Champs de Formulaire',
        description: 'Champs de texte, sélecteurs, cases à cocher et plus. Construits avec validation native et support ARIA.',
        textInput: 'Champ de Texte',
        textInputHint: 'Avec labels et validation',
        textarea: 'Zone de Texte',
        textareaHint: 'Saisie de texte multiligne',
        select: 'Sélecteur',
        selectHint: 'Liste déroulante native',
        checkboxes: 'Cases à Cocher',
        checkboxesHint: 'Contrôles de sélection multiple',
        planSelection: 'Sélection de Plan',
        planSelectionHint: 'Options style carte',
        emailLabel: 'Adresse e-mail',
        emailPlaceholder: 'vous@exemple.com',
        passwordLabel: 'Mot de passe',
        passwordPlaceholder: '••••••••',
        passwordHint: 'Minimum 8 caractères',
        disabledLabel: 'Désactivé',
        disabledPlaceholder: 'Non modifiable',
        messageLabel: 'Message',
        messagePlaceholder: 'Écrivez votre message ici...',
        messageHint: 'Supporte le formatage markdown',
        countryLabel: 'Pays',
        selectCountry: 'Sélectionnez un pays...',
        termsLabel: "J'accepte les conditions d'utilisation",
        updatesLabel: "M'envoyer les mises à jour produit",
        notificationsLabel: 'Activer les notifications',
        notificationsDesc: 'Recevoir des alertes pour les mises à jour importantes',
        planFree: 'Gratuit',
        planFreeDesc: 'Fonctionnalités de base pour projets personnels',
        planPro: 'Pro',
        planProDesc: 'Outils avancés pour professionnels',
        planTeam: 'Équipe',
        planTeamDesc: "Fonctionnalités de collaboration pour les équipes",
      },
      feedback: {
        title: 'Retour Utilisateur',
        description: "Badges, alertes et indicateurs d'état pour communiquer l'état et guider les actions utilisateur.",
        badges: 'Badges',
        badgesHint: "Indicateurs d'état",
        alerts: 'Alertes',
        alertsHint: 'Messages contextuels',
        default: 'Par défaut',
        success: 'Succès',
        warning: 'Avertissement',
        error: 'Erreur',
        info: 'Info',
        tipTitle: 'Astuce',
        tipContent: 'Utilisez les raccourcis clavier pour naviguer plus vite. Appuyez sur',
        tipKey: '⌘K',
        tipEnd: 'pour ouvrir la palette de commandes.',
        deployTitle: 'Déploiement réussi',
        deployContent: 'Vos modifications sont en ligne sur',
        limitTitle: 'Limite approchant',
        limitContent: "Vous avez utilisé 80% de votre quota API mensuel. Envisagez de passer à un plan supérieur.",
        buildTitle: 'Build échoué',
        buildContent: 'Erreur dans',
        buildError: '— prop requise "variant" manquante',
      },
      overlays: {
        title: 'Superpositions',
        description: 'Dialogues, menus déroulants, tooltips et onglets. Navigation clavier complète et gestion du focus.',
        dialog: 'Dialogue',
        dialogHint: 'Superposition modale',
        dropdown: 'Menu',
        dropdownHint: "Menu d'actions",
        tooltips: 'Tooltips',
        tooltipsHint: 'Indices contextuels',
        tabs: 'Onglets',
        tabsHint: 'Organisation du contenu',
        openDialog: 'Ouvrir le Dialogue',
        deleteTitle: 'Supprimer le projet ?',
        deleteDesc: 'Cette action ne peut pas être annulée.',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer',
        deleteWarning: 'Tous les fichiers, déploiements et données analytiques seront définitivement supprimés.',
        cancel: 'Annuler',
        deleteProject: 'Supprimer le Projet',
        actions: 'Actions',
        edit: 'Modifier',
        duplicate: 'Dupliquer',
        share: 'Partager',
        archive: 'Archiver',
        delete: 'Supprimer',
        top: 'Haut',
        bottom: 'Bas',
        left: 'Gauche',
        right: 'Droite',
        tooltipTop: 'Tooltip en haut',
        tooltipBottom: 'Tooltip en bas',
        tooltipLeft: 'Tooltip à gauche',
        tooltipRight: 'Tooltip à droite',
        overview: 'Aperçu',
        analytics: 'Analytiques',
        settings: 'Paramètres',
        overviewContent: "Aperçu du projet avec métriques clés et activité récente. Les onglets supportent la navigation clavier complète.",
        analyticsContent: "Données analytiques avec graphiques et informations de performance. Utilisez les flèches pour naviguer entre les onglets.",
        settingsContent: 'Configurez les paramètres de votre projet. Utilisez Début/Fin pour aller au premier/dernier onglet.',
      },
      data: {
        title: 'Affichage de Données',
        description: "Cartes, avatars et icônes pour présenter le contenu et les informations utilisateur.",
        cards: 'Cartes',
        cardsHint: 'Conteneurs de contenu',
        avatars: 'Avatars',
        avatarsHint: "Représentations d'utilisateurs",
        icons: 'Icônes',
        iconsHint: 'Set Lucide — 24 incluses',
        stacked: 'Empilés',
        performance: 'Performance',
        performanceScore: '100/100 Lighthouse',
        performanceDesc: "Zéro JavaScript par défaut. Architecture en îles avec hydratation sélective pour une vitesse optimale.",
        typeSafe: 'Type-Safe',
        typeSafeScore: 'TypeScript Complet',
        typeSafeDesc: "Types stricts avec autocomplétion IDE et vérification d'erreurs à la compilation.",
        i18nReady: 'i18n Prêt',
        i18nScore: 'Multilingue',
        i18nDesc: 'Système de traduction intégré avec URLs SEO-friendly et détection automatique de la langue.',
      },
      loading: {
        title: 'Chargement',
        description: 'Squelettes de chargement pour une performance perçue pendant le chargement du contenu.',
        skeletonTypes: 'Types de Squelettes',
        skeletonTypesHint: 'Texte, circulaire, rectangulaire',
        cardSkeleton: 'Squelette de Carte',
        cardSkeletonHint: 'État de chargement composé',
      },
    },
    cta: {
      title: 'Prêt à construire ?',
      description: "Ces composants ne sont que le début. Clonez Velocity et commencez à livrer plus vite.",
      cloneRepo: 'Cloner le Dépôt',
      readDocs: 'Lire la Documentation',
    },
  },

  // Consent Banner
  consent: {
    heading: 'Préférences de Cookies',
    description: 'Nous utilisons des cookies pour améliorer votre expérience de navigation, proposer du contenu personnalisé et analyser notre trafic.',
    acceptAll: 'Tout Accepter',
    declineAll: 'Tout Refuser',
    customize: 'Personnaliser',
    savePreferences: 'Enregistrer les Préférences',
    settingsHeading: 'Paramètres de Confidentialité',
    privacyPolicyLabel: 'Politique de Confidentialité',
    alwaysOn: 'Toujours actif',
  },
} as const;
