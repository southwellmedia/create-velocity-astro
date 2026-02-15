/**
 * English translations
 */
export const en = {
  // Site
  site: {
    name: 'Velocity',
    description: 'A modern Astro starter template',
  },

  // Navigation
  nav: {
    home: 'Home',
    about: 'About',
    blog: 'Blog',
    contact: 'Contact',
    features: 'Features',
    components: 'Components',
    docs: 'Docs',
    getStarted: 'Get Started',
  },

  // Common
  common: {
    readMore: 'Read more',
    loading: 'Loading...',
    error: 'An error occurred',
    notFound: 'Page not found',
    backHome: 'Back to home',
    copied: 'Copied!',
    copy: 'Copy',
  },

  // Hero Section
  hero: {
    badge: 'v1.0 Public Beta is Live',
    title: 'Your next site',
    titleHighlight: 'starts here.',
    description:
      'Clone the repo. Customize the tokens. Deploy by Friday. Velocity handles the tedious parts so you can focus on the work that matters.',
    cta: 'Get Started',
    github: 'View on GitHub',
    socialProof: 'Used by 40+ agencies in production',
  },

  // Tech Stack Section
  techStack: {
    astro: {
      name: 'Astro 6',
      desc: 'Server islands & content layer',
    },
    tailwind: {
      name: 'Tailwind v4',
      desc: 'Zero-runtime CSS engine',
    },
    typescript: {
      name: 'TypeScript',
      desc: 'Strict type safety defaults',
    },
    motion: {
      name: 'Motion',
      desc: 'Declarative animations',
    },
  },

  // Feature Tabs Section
  features: {
    sectionTitle: 'Everything you need.',
    sectionTitleHighlight: "Nothing you don't.",
    sectionDescription:
      'We stripped away the bloat and kept the primitives that actually speed up development for agencies and freelancers.',
    tabs: {
      design: {
        label: 'Design System',
        desc: 'Global tokens & typography',
        title: 'CSS-First Design Tokens',
        content:
          "Velocity implements a complete design system using Tailwind v4's new CSS-first configuration. No messy JavaScript config files for theme values.",
      },
      seo: {
        label: 'SEO & Meta',
        desc: 'OpenGraph & sitemaps',
        title: 'Automated SEO Handling',
        content:
          "Astro's content collections power strictly typed metadata injection for every page. Social share images are generated automatically.",
      },
      perf: {
        label: 'Performance',
        desc: '100/100 Core Web Vitals',
        title: 'Zero JS by Default',
        content:
          "We utilize Astro's island architecture to ensure your marketing pages ship 0kb of JavaScript to the client unless explicitly interactive.",
      },
      components: {
        label: 'Components',
        desc: 'Reusable UI primitives',
        title: 'Type-Safe Components',
        content:
          'Build with confidence using TypeScript-first components. Full prop validation and IDE autocompletion out of the box.',
      },
      i18n: {
        label: 'Internationalization',
        desc: 'Multi-language support',
        title: 'Built-in Internationalization',
        content:
          'First-class support for multi-language sites with type-safe translations, automatic locale detection, and SEO-friendly URL structures.',
      },
    },
  },

  // Credibility Section
  credibility: {
    badge: 'Production Tested',
    title: 'Built by Southwell Media. Born from',
    titleHighlight: 'deadline pressure',
    paragraph1:
      "We're a digital agency that ships high-performance marketing sites. We got tired of spending the first 3 days of every project setting up the same tooling, SEO configs, and type definitions.",
    paragraph2:
      "Velocity isn't a theoretical exercise. It's the exact codebase we use to deliver client projects in 14-21 days instead of the industry standard 60.",
    stats: {
      lighthouse: {
        score: 'Perfect',
        label: 'Lighthouse Scores',
      },
      delivery: {
        days: '14 Days',
        label: 'Avg. Delivery Time',
      },
    },
    standard: {
      title: 'The Velocity Standard',
      items: [
        'No unused CSS in production',
        'Images optimized at build time',
        'Type-safe Content Collections',
        'Accessible primitives pre-configured',
      ],
    },
    testimonial: {
      quote: "\"The cleanest boilerplate I've seen in 2024. It cuts the fluff.\"",
      author: '— Alex C., Senior Frontend Dev',
    },
  },

  // CTA Section
  cta: {
    title: 'Stop configuring.',
    titleHighlight: 'Start shipping.',
    description:
      'Join the developers building faster, better websites with Velocity. Open source and free forever.',
    docs: 'Read the Docs',
    command: 'npm create velocity@latest',
  },

  // Footer
  footer: {
    copyright: '© {year} Velocity. All rights reserved.',
    madeWith: 'Made with',
    maintainedBy: 'Maintained by',
    links: {
      documentation: 'Documentation',
      github: 'GitHub',
      twitter: 'Twitter',
      license: 'License',
    },
  },

  // Home page
  home: {
    title: 'Welcome to Velocity',
    subtitle: 'The opinionated Astro starter you actually want to use',
    cta: 'Get Started',
  },

  // About page
  about: {
    meta: {
      title: 'About Us',
      description: 'Learn about Velocity and the team behind it.',
    },
    hero: {
      badge: 'Our Story',
      title: 'Built by developers,',
      titleHighlight: 'for developers.',
      description: 'Velocity was born from the frustration of setting up the same tooling over and over. We decided to create the starter we always wished existed.',
    },
    mission: {
      title: 'Our Mission',
      description: 'To help developers ship beautiful, performant websites faster by eliminating boilerplate and providing sensible defaults.',
    },
    values: {
      title: 'What We Believe',
      performance: {
        title: 'Performance First',
        description: 'Every decision is made with performance in mind. Zero JavaScript by default, optimized images, and minimal CSS.',
      },
      simplicity: {
        title: 'Simplicity Matters',
        description: 'We strip away complexity so you can focus on what matters: building great products for your users.',
      },
      openSource: {
        title: 'Open Source',
        description: 'Velocity is free and open source. We believe in giving back to the community that made this possible.',
      },
    },
  },

  // Contact page
  contact: {
    meta: {
      title: 'Contact Us',
      description: 'Get in touch with the Velocity team.',
    },
    hero: {
      badge: 'Get in Touch',
      title: "Let's",
      titleHighlight: 'connect.',
      description: 'Have a question, suggestion, or just want to say hello? We would love to hear from you.',
    },
    form: {
      title: 'Send us a message',
      name: 'Your Name',
      namePlaceholder: 'John Doe',
      email: 'Email Address',
      emailPlaceholder: 'john@example.com',
      subject: 'Subject',
      subjectPlaceholder: 'How can we help?',
      message: 'Message',
      messagePlaceholder: 'Tell us more about your project or question...',
      submit: 'Send Message',
      sending: 'Sending...',
      success: 'Message sent successfully! We will get back to you soon.',
      error: 'Failed to send message. Please try again later.',
    },
    info: {
      title: 'Other ways to reach us',
      email: {
        label: 'Email',
        value: 'hello@velocity.dev',
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
    name: 'Name',
    email: 'Email',
    message: 'Message',
    submit: 'Submit',
    sending: 'Sending...',
    success: 'Message sent successfully!',
    error: 'Failed to send message. Please try again.',
  },

  // Blog
  blog: {
    title: 'Blog',
    description: 'Latest articles and updates',
    allPosts: 'All posts',
    featured: 'Featured',
    noPosts: 'No posts found',
    relatedPosts: 'Related Posts',
    backToBlog: 'Back to Blog',
    subscribe: 'Subscribe',
    subscribeDescription: 'Get the latest articles and updates delivered to your inbox.',
    emailPlaceholder: 'Enter your email',
    subscribeButton: 'Subscribe',
  },

  // Components Page
  components: {
    meta: {
      title: 'Components',
      description: "Explore Velocity's comprehensive UI component library. Production-ready, accessible, and beautifully designed.",
    },
    hero: {
      badge: 'Production Components',
      title: 'Component',
      titleHighlight: 'Library',
      description: 'Production-ready UI primitives built with accessibility and performance in mind. Copy, paste, and customize to match your brand.',
      browseComponents: 'Browse Components',
      viewSource: 'View Source',
    },
    categories: {
      buttons: 'Buttons',
      inputs: 'Form Inputs',
      feedback: 'Feedback',
      overlays: 'Overlays',
      data: 'Data Display',
      loading: 'Loading',
    },
    sections: {
      buttons: {
        title: 'Buttons',
        description: 'Interactive elements for actions and navigation. All variants support icons, loading states, and full accessibility.',
        variants: 'Variants',
        variantsHint: '6 styles for different contexts',
        sizes: 'Sizes',
        sizesHint: 'Responsive scaling',
        states: 'States',
        withIcons: 'With Icons',
        primary: 'Primary',
        secondary: 'Secondary',
        outline: 'Outline',
        ghost: 'Ghost',
        link: 'Link',
        destructive: 'Destructive',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        default: 'Default',
        loading: 'Loading',
        disabled: 'Disabled',
        send: 'Send',
        export: 'Export',
        star: 'Star',
      },
      inputs: {
        title: 'Form Inputs',
        description: 'Text fields, selects, checkboxes, and more. Built with native validation and ARIA support.',
        textInput: 'Text Input',
        textInputHint: 'With labels & validation',
        textarea: 'Textarea',
        textareaHint: 'Multi-line text input',
        select: 'Select',
        selectHint: 'Native dropdown',
        checkboxes: 'Checkboxes',
        checkboxesHint: 'Multi-select controls',
        planSelection: 'Plan Selection',
        planSelectionHint: 'Card-style radio options',
        emailLabel: 'Email address',
        emailPlaceholder: 'you@example.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        passwordHint: 'Must be at least 8 characters',
        disabledLabel: 'Disabled',
        disabledPlaceholder: 'Cannot edit',
        messageLabel: 'Message',
        messagePlaceholder: 'Write your message here...',
        messageHint: 'Supports markdown formatting',
        countryLabel: 'Country',
        selectCountry: 'Select a country...',
        termsLabel: 'I agree to the terms of service',
        updatesLabel: 'Send me product updates',
        notificationsLabel: 'Enable notifications',
        notificationsDesc: 'Receive alerts for important updates',
        planFree: 'Free',
        planFreeDesc: 'Basic features for personal projects',
        planPro: 'Pro',
        planProDesc: 'Advanced tools for professionals',
        planTeam: 'Team',
        planTeamDesc: 'Collaboration features for teams',
      },
      feedback: {
        title: 'Feedback',
        description: 'Badges, alerts, and status indicators to communicate state and guide user actions.',
        badges: 'Badges',
        badgesHint: 'Status indicators',
        alerts: 'Alerts',
        alertsHint: 'Contextual messages',
        default: 'Default',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        info: 'Info',
        tipTitle: 'Tip',
        tipContent: 'Use keyboard shortcuts to navigate faster. Press',
        tipKey: '⌘K',
        tipEnd: 'to open the command palette.',
        deployTitle: 'Deployment successful',
        deployContent: 'Your changes are now live at',
        limitTitle: 'Approaching limit',
        limitContent: "You've used 80% of your monthly API quota. Consider upgrading your plan.",
        buildTitle: 'Build failed',
        buildContent: 'Error in',
        buildError: '— missing required prop "variant"',
      },
      overlays: {
        title: 'Overlays',
        description: 'Dialogs, dropdowns, tooltips, and tabs. Full keyboard navigation and focus management.',
        dialog: 'Dialog',
        dialogHint: 'Modal overlay',
        dropdown: 'Dropdown',
        dropdownHint: 'Action menu',
        tooltips: 'Tooltips',
        tooltipsHint: 'Contextual hints',
        tabs: 'Tabs',
        tabsHint: 'Content organization',
        openDialog: 'Open Dialog',
        deleteTitle: 'Delete project?',
        deleteDesc: 'This action cannot be undone.',
        deleteConfirm: 'Are you sure you want to delete',
        deleteWarning: 'All files, deployments, and analytics data will be permanently removed.',
        cancel: 'Cancel',
        deleteProject: 'Delete Project',
        actions: 'Actions',
        edit: 'Edit',
        duplicate: 'Duplicate',
        share: 'Share',
        archive: 'Archive',
        delete: 'Delete',
        top: 'Top',
        bottom: 'Bottom',
        left: 'Left',
        right: 'Right',
        tooltipTop: 'Tooltip on top',
        tooltipBottom: 'Tooltip on bottom',
        tooltipLeft: 'Tooltip on left',
        tooltipRight: 'Tooltip on right',
        overview: 'Overview',
        analytics: 'Analytics',
        settings: 'Settings',
        overviewContent: 'Project overview with key metrics and recent activity. Tabs support full keyboard navigation.',
        analyticsContent: 'Analytics data with charts and performance insights. Press arrow keys to navigate between tabs.',
        settingsContent: 'Configure your project settings. Use Home/End to jump to first/last tab.',
      },
      data: {
        title: 'Data Display',
        description: 'Cards, avatars, and icons for presenting content and user information.',
        cards: 'Cards',
        cardsHint: 'Content containers',
        avatars: 'Avatars',
        avatarsHint: 'User representations',
        icons: 'Icons',
        iconsHint: 'Lucide icon set — 24 included',
        stacked: 'Stacked',
        performance: 'Performance',
        performanceScore: '100/100 Lighthouse',
        performanceDesc: 'Zero JavaScript by default. Islands architecture with selective hydration for optimal speed.',
        typeSafe: 'Type-Safe',
        typeSafeScore: 'Full TypeScript',
        typeSafeDesc: 'Strict types throughout with IDE autocompletion and compile-time error checking.',
        i18nReady: 'i18n Ready',
        i18nScore: 'Multi-language',
        i18nDesc: 'Built-in translation system with SEO-friendly URLs and automatic locale detection.',
      },
      loading: {
        title: 'Loading',
        description: 'Skeleton loaders for perceived performance while content is being fetched.',
        skeletonTypes: 'Skeleton Types',
        skeletonTypesHint: 'Text, circular, rectangular',
        cardSkeleton: 'Card Skeleton',
        cardSkeletonHint: 'Composite loading state',
      },
    },
    cta: {
      title: 'Ready to build?',
      description: 'These components are just the beginning. Clone Velocity and start shipping faster.',
      cloneRepo: 'Clone Repository',
      readDocs: 'Read Documentation',
    },
  },

  // Consent Banner
  consent: {
    heading: 'Cookie Preferences',
    description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.',
    acceptAll: 'Accept All',
    declineAll: 'Decline All',
    customize: 'Customize',
    savePreferences: 'Save Preferences',
    settingsHeading: 'Privacy Settings',
    privacyPolicyLabel: 'Privacy Policy',
    alwaysOn: 'Always on',
  },
} as const;

export type TranslationKeys = typeof en;
