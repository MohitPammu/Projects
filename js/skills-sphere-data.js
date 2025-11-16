/**
 * ═══════════════════════════════════════════════════════════════════════
 * SKILLS SPHERE DATA CONFIGURATION - COMPLETE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 7 Major Nodes with Full Project Integration
 * - Smooth scroll to project cards
 * - Auto-filter application
 * - Highlight animation
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

const SKILLS_SPHERE_DATA = {
  
  // ═══════════════════════════════════════════════════════════════════
  // MAJOR NODES (7 Core Tools)
  // ═══════════════════════════════════════════════════════════════════
  
  majorNodes: [
    
    // ─────────────────────────────────────────────────────────────────
    // 1. SQL
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'sql',
      label: 'SQL',
      category: 'Core Analytics',
      color: '#6d8dfa', // website theme blue
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuresqldatabase/azuresqldatabase-original.svg',
      
      theta: 0,
      phi: Math.PI / 2,
      
      satellites: [
        'PostgreSQL',
        'BigQuery',
        'pgAdmin',
        'DBeaver',
        'JOINS & Subqueries',
        'Aggregate Functions'
      ],
      
      description: 'Database querying and data manipulation',
      
      projects: []  // Coming soon
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 2. PYTHON
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'python',
      label: 'Python',
      category: 'Programming',
      color: '#f472b6', // Softer pink (desaturated)
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      
      theta: Math.PI / 2,
      phi: Math.PI / 3,
      
      satellites: [
        'Pandas',
        'NumPy',
        'Matplotlib',
        'Seaborn',
        'Jupyter',
        'Google Colab',
        'VS Code'
      ],
      
      description: 'Data analysis, visualization, and machine learning',
      
      projects: [
        {
          name: 'Foodhub Order Analysis',
          description: 'Restaurant order patterns & insights',
          tags: ['Python', 'Pandas', 'EDA'],
          scrollTarget: 'project-foodhub',
          filterCategory: 'python-r',
          credentials: [
            {
              name: 'MIT Professional Education',
              description: 'Applied Data Science Program',
              year: '2025'
            }
          ]
        },
        {
          name: 'SVHN Digit Recognition',
          description: '90% accuracy on street view digits',
          tags: ['Python', 'TensorFlow', 'Computer Vision'],
          scrollTarget: 'project-svhn',
          filterCategory: 'machine-learning',
          credentials: [
            {
              name: 'MIT Professional Education',
              description: 'Applied Data Science Program',
              year: '2025'
            }
          ]
        },
        {
          name: 'Facial Emotion Detection',
          description: '82% accuracy across 7 emotions',
          tags: ['Python', 'TensorFlow', 'CNNs'],
          scrollTarget: 'project-emotion',
          filterCategory: 'machine-learning',
          credentials: [
            {
              name: 'MIT Professional Education',
              description: 'Applied Data Science Program',
              year: '2025'
            }
          ]
        }
      ]
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 3. POWER BI
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'powerbi',
      label: 'Power BI',
      category: 'Core Analytics',
      color: '#6d8dfa', // website theme blue
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/New_Power_BI_Logo.svg',
      
      theta: Math.PI,
      phi: Math.PI / 2,
      
      satellites: [
        'DAX',
        'Power Query',
        'Data Modeling',
        'Row-Level Security',
        'Custom Visuals',
        'Incremental Refresh'
      ],
      
      description: 'Interactive dashboards and business intelligence',
      
      projects: [
        {
          name: 'HR Workforce Analytics',
          description: 'Employee metrics and workforce insights',
          tags: ['Power BI', 'DAX', 'HR Analytics'],
          scrollTarget: 'project-hr-analytics',
          filterCategory: 'power-bi',
          credentials: [
            {
              name: 'Edureka',
              description: 'Business Analyst using Power BI',
              year: '2024'
            }
          ]
        },
        {
          name: 'Global Sales Performance',
          description: 'International sales KPI dashboard',
          tags: ['Power BI', 'Data Modeling', 'Sales'],
          scrollTarget: 'project-global-sales',
          filterCategory: 'power-bi',
          credentials: [
            {
              name: 'Edureka',
              description: 'Business Analyst using Power BI',
              year: '2024'
            }
          ]
        },
        {
          name: 'Sales & Customer Analytics',
          description: 'Customer behavior and sales trends',
          tags: ['Power BI', 'DAX', 'Customer Insights'],
          scrollTarget: 'project-sales-customer',
          filterCategory: 'power-bi',
          credentials: [
            {
              name: 'Edureka',
              description: 'Business Analyst using Power BI',
              year: '2024'
            }
          ]
        },
        {
          name: 'Netflix Content Analysis',
          description: 'Content library trends and insights',
          tags: ['Power BI', 'Power Query', 'Entertainment'],
          scrollTarget: 'project-netflix',
          filterCategory: 'power-bi',
          credentials: [
            {
              name: 'Edureka',
              description: 'Business Analyst using Power BI',
              year: '2024'
            }
          ]
        }
      ]
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 4. R
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'r',
      label: 'R',
      category: 'Programming',
      color: '#f472b6', // Softer pink (desaturated)
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg',
      
      theta: Math.PI * 1.5,
      phi: Math.PI / 3,
      
      satellites: [
        'tidyverse',
        'ggplot2',
        'dplyr',
        'RStudio'
      ],
      
      description: 'Statistical computing and graphics',
      
      projects: [
        {
          name: 'Cyclistic Bikeshare Analysis',
          description: 'Bike sharing usage patterns and trends',
          tags: ['R', 'ggplot2', 'dplyr'],
          scrollTarget: 'project-cyclistic',
          filterCategory: 'python-r',
          credentials: [
            {
              name: 'Google',
              description: 'Data Analytics Professional',
              year: '2024'
            }
          ]
        }
      ]
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 5. EXCEL
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'excel',
      label: 'Excel',
      category: 'Core Analytics',
      color: '#6d8dfa', // website theme blue
      icon: 'https://img.icons8.com/color/480/microsoft-excel-2019--v1.png', // Excel icon from icons8
      
      theta: Math.PI / 4,
      phi: Math.PI * 0.65,
      
      satellites: [
        'Pivot Tables',
        'VLOOKUP',
        'Power Query',
        'Macros',
        'Data Analysis'
      ],
      
      description: 'Data analysis, reporting, and business modeling',
      
      projects: []  // Used in daily analytics work
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 6. GIT
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'git',
      label: 'Git',
      category: 'Tools',
      color: '#64748b', // gray
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
      
      theta: Math.PI * 1.25,
      phi: Math.PI * 0.65,
      
      satellites: [
        'GitHub',
        'Branching',
        'Pull Requests',
        'Version Control',
        'Collaborative Workflows'
      ],
      
      description: 'Version control and collaboration',
      
      projects: [
        {
          name: 'GitHub Portfolio',
          description: 'View all repositories and contributions',
          externalUrl: 'https://github.com/MohitPammu/Projects',
          isExternal: true
        }
      ]
    },
    
    // ─────────────────────────────────────────────────────────────────
    // 7. MACHINE LEARNING
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'ml',
      label: 'Machine Learning',
      displayName: 'Machine Learning (Emerging)', // Display name for details panel
      category: 'Machine Learning',
      color: '#10b981', // Softer green (desaturated)
      icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Tensorflow_logo.svg',
      
      theta: Math.PI * 0.75,
      phi: Math.PI * 0.7,
      
      satellites: [
        'TensorFlow',
        'Keras',
        'Scikit-learn',
        'Neural Networks',
        'CNNs',
        'Computer Vision',
        'Image Classification'
      ],
      
      description: 'Deep learning and computer vision',
      
      projects: [
        {
          name: 'SVHN Digit Recognition',
          description: '90% accuracy on street view digits',
          tags: ['TensorFlow', 'CNNs', 'Computer Vision'],
          scrollTarget: 'project-svhn',
          filterCategory: 'machine-learning',
          credentials: [
            {
              name: 'MIT Professional Education',
              description: 'Applied Data Science Program',
              year: '2025'
            }
          ]
        },
        {
          name: 'Facial Emotion Detection',
          description: '82% accuracy across 7 emotions',
          tags: ['Keras', 'CNNs', 'Image Classification'],
          scrollTarget: 'project-emotion',
          filterCategory: 'machine-learning',
          credentials: [
            {
              name: 'MIT Professional Education',
              description: 'Applied Data Science Program',
              year: '2025'
            }
          ]
        }
      ],
      
    }
    
  ],
  
  // ═══════════════════════════════════════════════════════════════════
  // CONNECTIONS (Web mesh between major nodes)
  // ═══════════════════════════════════════════════════════════════════
  
  connections: [
    // Core data pipeline
  ['python', 'sql'],      // Python queries databases
  ['r', 'sql'],           // R queries databases
  ['sql', 'powerbi'],     // Power BI uses SQL sources
  ['sql', 'excel'],       // Excel queries databases
  
  // Programming + ML
  ['python', 'ml'],       // Python is the ML language
  ['ml', 'sql'],          // ML needs data from databases
  
  // BI tools integration
  ['powerbi', 'excel'],   // Microsoft ecosystem
  ['powerbi', 'python'],  // Power BI can run Python (if you've used this)
  
  // Analysis tools
  ['r', 'python'],        // Both used for analysis
  
  // Version control
  ['python', 'git'],      // Python code versioned
  ['r', 'git']            // R code versioned
  ],
  
  // ═══════════════════════════════════════════════════════════════════
  // VISUAL CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  
  config: {
    // Node sizing
    majorNodeSize: 2.0,
    satelliteNodeSize: 0.65,
    
    // Connection styling
    connectionOpacity: 0.4,          // Increased from 0.25
    connectionOpacityHover: 1.00,    // Increased from 0.7
    connectionWidth: 2.5,             // Increased from 1.5
    
    // Rotation behavior
    autoRotateSpeed: 0.05,           // Increased for more noticeable rotation
    rotationDamping: 0.95,
    
    // Animation timing
    hoverTransitionSpeed: 0.3,
    
    // Sphere dimensions
    sphereRadius: 16.5,                // Increased for better visibility
    
    // Satellite distribution
    satelliteDistance: 0.255, // Reduced from 0.4 to bring satellites closer
    
    // Visual effects
    nodeGlowIntensity: 0.5,
    depthFading: true,
    backNodeOpacity: 0.4
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // UI TEXT LABELS
  // ═══════════════════════════════════════════════════════════════════
  
  labels: {
    centerTitle: 'Core Skills Network',
    centerSubtitle: '7 Core Competencies',
    instructionsDesktop: 'Drag to rotate • Hover to explore • Click projects to view',
    instructionsMobile: 'Swipe to rotate • Tap to explore • Tap projects to view',
    detailsPanelEmpty: 'Hover over a skill node to see related tools and projects',
    legendTitle: 'CATEGORIES'
  }
  
};

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.SKILLS_SPHERE_DATA = SKILLS_SPHERE_DATA;
}
