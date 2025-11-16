/**
 * ═══════════════════════════════════════════════════════════════════════
 * SPHERICAL SKILLS NETWORK - Main Visualization
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Three.js implementation of 3D interactive skills sphere
 * 
 * DEPENDENCIES:
 * - Three.js (loaded via CDN in index.html)
 * - skills-sphere-data.js (must load before this file)
 * 
 * INTEGRATION:
 * 1. Add <div id="skills-sphere-container"></div> to HTML
 * 2. Link Three.js, data file, then this file
 * 3. Initialize automatically on page load
 * 
 * FEATURES:
 * - 3D sphere with major + satellite nodes
 * - Mesh connections creating web appearance
 * - Drag to rotate (all directions)
 * - Hover to reveal satellite labels
 * - Click to lock details panel
 * - Auto-rotation when idle
 * - Fully responsive (desktop + mobile)
 * - Dark/light theme compatible
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';
  
  // ═══════════════════════════════════════════════════════════════════
  // NAMESPACE - Prevents conflicts with existing code
  // ═══════════════════════════════════════════════════════════════════
  
  window.SkillsSphereVisualization = {
    
    // Category color definitions (light/dark theme)
    CATEGORY_COLORS: {
      'Core Analytics': { dark: '#6d8dfa', light: '#4a6cf7' },
      'Programming': { dark: '#f472b6', light: '#ec4899' },
      'Tools': { dark: '#64748b', light: '#475569' },
      'Machine Learning': { dark: '#10b981', light: '#059669' }
    },
    
    // Satellite rotation adjustments (manually calibrated to clear node labels)
    SATELLITE_ROTATIONS: {
      'ml': { angle: Math.PI + (Math.PI / 12), distance: 1.1 },  // 195° rotation, 10% farther
      'excel': { angle: Math.PI + (Math.PI / 10), distance: 1.0 }, // 198° rotation
      'sql': { angle: Math.PI * 0.20, distance: 1.05 },           // 36° rotation, 5% farther
      'powerbi': { angle: Math.PI * 0.10, distance: 1.0 },        // 18° rotation
      'r': { angle: Math.PI * 0.30, distance: 1.0 }               // 54° rotation
    },
    
    // Camera default Z position (adjusted to fit sphere with labels/logos)
    CAMERA_DEFAULT_Z: 62,  // Increased from 55 to prevent node cutoff with larger canvas
    
    /**
     * Utility method to detect current theme
     * @returns {boolean} true if dark theme, false if light theme
     */
    isDarkTheme: function() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ||
             document.body.getAttribute('data-theme') === 'dark';
    },
    
    // Core Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    
    // Node objects
    nodes: [],
    connections: [],
    labels: [],
    
    // Interaction state
    raycaster: null,
    mouse: null,
    hoveredNode: null,
    selectedNode: null,
    highlightedCategory: null,
    isDragging: false,
    justFinishedDragging: false, // Prevents immediate hover after drag
    totalDragDistance: 0, // Track total pixel movement during drag
    dragStartTime: 0, // Track when drag started
    lastMouseX: 0,
    lastMouseY: 0,
    
    // Rotation state
    autoRotate: true,
    rotationVelocity: { x: 0, y: 0 },
    isAutoRotatingToNode: false, // Flag for smooth rotation animation
    
    // Animation frame ID (for cleanup)
    animationId: null,
    
    // Container references
    containerEl: null,
    detailsEl: null,
    
    // Logo texture cache
    logoTextures: {},
    textureLoader: null,
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * INITIALIZATION
     * ═══════════════════════════════════════════════════════════════
     */
    
    init: function() {
      console.log('Initializing Skills Sphere Visualization...');
      
      try {
        // Check for required dependencies
        if (typeof THREE === 'undefined') {
          console.error('ERROR: THREE.js is required. Load it via CDN in HTML.');
          return;
        }
        console.log('THREE.js loaded');
        
        if (typeof SKILLS_SPHERE_DATA === 'undefined') {
          console.error('ERROR: skills-sphere-data.js must be loaded first.');
          return;
        }
        console.log('Data loaded');
        
        // Get container
        this.containerEl = document.getElementById('skills-sphere-container');
        if (!this.containerEl) {
          console.error('ERROR: Container #skills-sphere-container not found in DOM.');
          return;
        }
        console.log('Container found');
        
        // Initialize texture loader for logos
        this.textureLoader = new THREE.TextureLoader();
        console.log('Texture loader initialized');
        
        // Initialize Three.js scene
        console.log('Setting up scene...');
        this.setupScene();
        console.log('Setting up camera...');
        this.setupCamera();
        console.log('Setting up renderer...');
        this.setupRenderer();
        console.log('Setting up lights...');
        this.setupLights();
        
        // Create sphere geometry
        console.log('Creating nodes...');
        this.createNodes();
        console.log('Creating connections...');
        this.createConnections();
        
        // Setup interaction
        console.log('Setting up interaction...');
        this.setupInteraction();
        console.log('Setting up details panel...');
        this.setupDetailsPanel();
        
        // Setup responsive handling
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Note: Labels now handled by Three.js sprites (billboard effect)
        // Old HTML overlay system removed for better performance
        
        // Setup theme observer
        console.log('Setting up theme observer...');
        this.initThemeObserver();
        
        // Setup mobile interactions
        console.log('Setting up mobile interactions...');
        this.setupMobileInteractions();
        
        // Start animation loop
        console.log('Starting animation...');
        this.animate();
        
        console.log('Skills Sphere initialized successfully!');
      } catch (error) {
        console.error('ERROR: Initialization error:', error);
        console.error('Stack trace:', error.stack);
      }
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * SCENE SETUP
     * ═══════════════════════════════════════════════════════════════
     */
    
    setupScene: function() {
      this.scene = new THREE.Scene();
      // Transparent background (inherits page background)
      this.scene.background = null;
    },
    
    setupCamera: function() {
      // Default dimensions (will be updated after renderer creates wrapper)
      const width = 800;
      const height = 750;
      
      this.camera = new THREE.PerspectiveCamera(
        38,                    // Narrower FOV to prevent clipping
        width / height,        // Aspect ratio
        0.1,                   // Near clipping
        1000                   // Far clipping
      );
      
      // Move camera back to fit entire sphere with labels/logos
      this.camera.position.z = this.CAMERA_DEFAULT_Z;
    },
    
    setupRenderer: function() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true      // Transparent background
      });
      
      // Initial size (will resize based on wrapper)
      this.renderer.setSize(800, 750, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Get canvas element
      const canvas = this.renderer.domElement;
      
      // Find the content area (should already exist from HTML)
      let contentArea = document.getElementById('skills-sphere-content');
      if (!contentArea) {
        console.error('Content area not found, creating it');
        contentArea = document.createElement('div');
        contentArea.id = 'skills-sphere-content';
        contentArea.className = 'skills-sphere-content';
        this.containerEl.appendChild(contentArea);
      }
      
      // Add instructions overlay (positioned over sphere)
      if (!document.querySelector('.skills-sphere-instructions')) {
        const instructions = document.createElement('div');
        instructions.className = 'skills-sphere-instructions';
        instructions.textContent = 'Drag to rotate • Hover to explore • Click to lock details';
        this.containerEl.appendChild(instructions);
      }
      
      // Add attribution under sphere
      if (!document.querySelector('.skills-sphere-attribution')) {
        const attribution = document.createElement('div');
        attribution.className = 'skills-sphere-attribution';
        attribution.textContent = 'Built with Three.js for interactive 3D visualization';
        this.containerEl.appendChild(attribution);
      }
      
      // Create canvas wrapper div with padding
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'skills-sphere-canvas-wrapper';
      canvasWrapper.appendChild(canvas);
      
      // Add canvas wrapper to content area (first column)
      contentArea.appendChild(canvasWrapper);
      
      // Store wrapper reference
      this.canvasWrapper = canvasWrapper;
      
      // Update camera and renderer size after wrapper is in DOM
      setTimeout(() => {
        const wrapperWidth = canvasWrapper.clientWidth - 8; // Subtract 4px padding on each side
        const wrapperHeight = canvasWrapper.clientHeight - 8; // Subtract 4px padding top + bottom (text overlays don't need space)
        
        console.log('Canvas wrapper size:', wrapperWidth, 'x', wrapperHeight);
        
        if (wrapperWidth > 0 && wrapperHeight > 0) {
          this.camera.aspect = wrapperWidth / wrapperHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(wrapperWidth, wrapperHeight, false);
        } else {
          console.warn('Canvas wrapper has no size, using fallback');
          // Fallback dimensions
          const fallbackWidth = 600;
          const fallbackHeight = 550;
          this.camera.aspect = fallbackWidth / fallbackHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(fallbackWidth, fallbackHeight, false);
        }
      }, 100); // Increased timeout to ensure grid layout has calculated
    },
    
    setupLights: function() {
      // Ambient light (soft overall illumination)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);
      
      // Directional light (creates depth)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight.position.set(10, 10, 10);
      this.scene.add(directionalLight);
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * NODE CREATION
     * ═══════════════════════════════════════════════════════════════
     */
    
    createNodes: function() {
      const data = SKILLS_SPHERE_DATA;
      const config = data.config;
      
      // Create major nodes
      data.majorNodes.forEach(nodeData => {
        this.createMajorNode(nodeData, config);
        this.createSatellites(nodeData, config);
      });
    },
    
    createMajorNode: function(nodeData, config) {
      // Convert spherical to Cartesian coordinates
      const pos = this.sphericalToCartesian(
        nodeData.theta,
        nodeData.phi,
        config.sphereRadius
      );
      
      // Create sphere geometry with flat, glowing appearance (like legend)
      const geometry = new THREE.SphereGeometry(config.majorNodeSize, 64, 64);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nodeData.color),
        transparent: true,
        opacity: 0.85  // 85% opaque - allows logos to show through
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      
      // Ensure uniform scale (perfect sphere)
      mesh.scale.set(1, 1, 1);
      
      // Store metadata with original values
      mesh.userData = {
        type: 'major',
        id: nodeData.id,
        label: nodeData.label,
        displayName: nodeData.displayName, // Optional display name for details panel
        category: nodeData.category,
        color: nodeData.color,
        icon: nodeData.icon,
        satellites: nodeData.satellites,
        description: nodeData.description,
        projects: nodeData.projects || [], // Add projects data
        credentials: nodeData.credentials || [], // Add credentials data
        originalColor: nodeData.color,
        originalEmissiveIntensity: 0.4 // Store original emissive
      };
      
      this.scene.add(mesh);
      this.nodes.push(mesh);
      
      // If node has icon URL, load it and apply as logo sprite on the node
      if (nodeData.icon && nodeData.icon.startsWith('http')) {
        this.loadLogoForNode(nodeData.icon, mesh);
      }
      
      // Create text sprite label (always faces camera)
      this.createTextSprite(nodeData.label, mesh);
      
      // Create satellites
      this.createSatellites(nodeData, config);
    },
    
    createTextSprite: function(text, parentNode, isDark) {
      // Auto-detect theme if not provided
      if (isDark === undefined) {
        isDark = this.isDarkTheme();
      }
      
      // Create canvas for text - readable size
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 512;
      canvas.height = 128;
      
      // Text color and shadow based on theme
      const textColor = isDark ? 'rgba(248, 249, 250, 1)' : 'rgba(0, 0, 0, 0.95)';
      const shadowColor = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      
      // Draw text
      context.fillStyle = textColor;
      context.font = 'bold 54px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      context.shadowColor = shadowColor;
      context.shadowBlur = 10;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      context.fillText(text, 256, 64);
      
      // Create sprite from canvas
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false, // Always visible on top
        depthWrite: false
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(8, 2, 1); // Increased for better readability
      
      // Store reference first (needed for positioning function)
      parentNode.userData.sprite = sprite;
      
      // Position using camera-relative method (prevents obstruction at steep angles)
      this.positionSpriteTowardCamera(sprite, parentNode, 2.5);
      
      this.scene.add(sprite);
    },
    
    loadLogoForNode: function(iconUrl, parentNode) {
      // Check cache first
      if (this.logoTextures[iconUrl]) {
        this.createLogoInsideNode(this.logoTextures[iconUrl], parentNode);
        return;
      }
      
      // Load texture
      this.textureLoader.load(
        iconUrl,
        (texture) => {
          // Cache it
          this.logoTextures[iconUrl] = texture;
          this.createLogoInsideNode(texture, parentNode);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load logo: ${iconUrl}`, error);
        }
      );
    },
    
    createLogoInsideNode: function(texture, parentNode) {
      // Create a smaller sprite positioned inside the node
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false, // Always visible
        depthWrite: true,
        alphaTest: 0.5    // Discard transparent pixels
      });
      
      const logoSprite = new THREE.Sprite(spriteMaterial);
      logoSprite.scale.set(2.5, 2.5, 1); // Sized to fit inside node (node is 1.6 radius)
      
      // Position at center of parent node
      logoSprite.position.copy(parentNode.position);
      
      // Link logo to parent node for click detection
      logoSprite.userData = {
        type: 'logo',
        parentNode: parentNode
      };
      
      // Store reference
      parentNode.userData.logoSprite = logoSprite;
      
      this.scene.add(logoSprite);
    },
    
    createSatellites: function(parentData, config) {
      const parentPos = this.sphericalToCartesian(
        parentData.theta,
        parentData.phi,
        config.sphereRadius
      );
      
      // Convert to THREE.Vector3
      const parentPosVec = new THREE.Vector3(parentPos.x, parentPos.y, parentPos.z);
      
      console.log(`Creating ${parentData.satellites.length} satellites for ${parentData.label}`);
      
    // Calculate seed bases once per parent (avoid recalculating for each satellite)
    const seedBase = parentData.id.length * 13;
    const distanceSeedBase = parentData.label.length * 17;
    
    parentData.satellites.forEach((satName, index) => {
      // Distribute satellites around parent in a ring with slight deterministic variation
      const baseAngle = (index / parentData.satellites.length) * Math.PI * 2;
      
      // Use index-based pseudo-random for consistent positioning
      const seed = (index * 7 + seedBase) % 100;
      const angleVariation = ((seed / 100) - 0.5) * 0.3; // ±0.15 radians (~8.6 degrees)
      let angle = baseAngle + angleVariation;
      
      // Apply custom rotation adjustment from config (if defined for this node)
      const rotation = this.SATELLITE_ROTATIONS[parentData.id];
      if (rotation) {
        angle += rotation.angle;
      }
      
      // Add slight deterministic variation to distance (±15%)
      const distanceSeed = (index * 11 + distanceSeedBase) % 100;
      const distanceVariation = 0.85 + (distanceSeed / 100) * 0.3; // 0.85 to 1.15
      let offset = config.satelliteDistance * config.sphereRadius * distanceVariation;
      
      // Apply distance adjustment from config (if defined for this node)
      if (rotation && rotation.distance) {
        offset *= rotation.distance;
      }        // Get parent's tangent plane (perpendicular to radius)
        const parentNormal = parentPosVec.clone().normalize();
        
        // Create two perpendicular vectors in the tangent plane
        const tangent1 = new THREE.Vector3();
        const tangent2 = new THREE.Vector3();
        
        // Choose arbitrary vector not parallel to normal
        const arbitrary = Math.abs(parentNormal.y) < 0.9 
          ? new THREE.Vector3(0, 1, 0) 
          : new THREE.Vector3(1, 0, 0);
        
        tangent1.crossVectors(parentNormal, arbitrary).normalize();
        tangent2.crossVectors(parentNormal, tangent1).normalize();
        
        // Calculate satellite position in tangent plane around parent
        const ringX = Math.cos(angle) * offset;
        const ringY = Math.sin(angle) * offset;
        
        // Position satellite in world space (offset from parent in tangent plane)
        const satPos = parentPosVec.clone()
          .add(tangent1.clone().multiplyScalar(ringX))
          .add(tangent2.clone().multiplyScalar(ringY));
        
        // Create satellite node with flat, glowing appearance (like legend)
        const geometry = new THREE.SphereGeometry(config.satelliteNodeSize, 32, 32);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(parentData.color),
          transparent: true,
          opacity: 0.7  // 70% opaque for satellites
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(satPos);
        
        // Ensure uniform scale (perfect sphere)
        mesh.scale.set(1, 1, 1);
        
        // Store metadata with original values
        mesh.userData = {
          type: 'satellite',
          label: satName,
          parentId: parentData.id,
          color: parentData.color,
          originalOpacity: 0.7,
          originalEmissiveIntensity: 0.3 // Store original emissive
        };
        
        this.scene.add(mesh);
        this.nodes.push(mesh);
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * CONNECTIONS (Web Mesh)
     * ═══════════════════════════════════════════════════════════════
     */
    
    createConnections: function() {
      const data = SKILLS_SPHERE_DATA;
      const config = data.config;
      
      // Connection material
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: config.connectionOpacity,
        linewidth: config.connectionWidth
      });
      
      // Create connections between major nodes
      data.connections.forEach(([id1, id2]) => {
        const node1 = this.nodes.find(n => n.userData.id === id1);
        const node2 = this.nodes.find(n => n.userData.id === id2);
        
        if (node1 && node2) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            node1.position,
            node2.position
          ]);
          
          const line = new THREE.Line(geometry, lineMaterial.clone());
          line.userData = {
            type: 'connection',
            nodes: [id1, id2],
            originalOpacity: config.connectionOpacity
          };
          
          this.scene.add(line);
          this.connections.push(line);
        }
      });
      
      // Create connections from major nodes to their satellites
      data.majorNodes.forEach(majorData => {
        const majorNode = this.nodes.find(n => n.userData.id === majorData.id);
        if (!majorNode) return;
        
        const satellites = this.nodes.filter(n => 
          n.userData.type === 'satellite' && n.userData.parentId === majorData.id
        );
        
        satellites.forEach(sat => {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            majorNode.position,
            sat.position
          ]);
          
          const line = new THREE.Line(geometry, lineMaterial.clone());
          line.userData = {
            type: 'satellite-connection',
            parentId: majorData.id,
            originalOpacity: config.connectionOpacity
          };
          
          this.scene.add(line);
          this.connections.push(line);
        });
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * INTERACTION SETUP
     * ═══════════════════════════════════════════════════════════════
     */
    
    setupInteraction: function() {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      
      const canvas = this.renderer.domElement;
      
      // Mouse events
      canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
      canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
      canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
      canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
      canvas.addEventListener('click', this.onClick.bind(this));
      canvas.addEventListener('contextmenu', this.onContextMenu.bind(this)); // Prevent right-click menu
      
      // Touch events (mobile)
      canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
      
      // Change cursor style
      canvas.style.cursor = 'grab';
    },
    
    setupDetailsPanel: function() {
      // Create details panel HTML if it doesn't exist
      let detailsPanel = document.getElementById('skills-sphere-details');
      
      if (!detailsPanel) {
        // Find the content area
        const contentArea = document.getElementById('skills-sphere-content');
        if (!contentArea) {
          console.error('Content area not found for sidebar');
          return;
        }
        
        const panelHTML = `
          <div class="skills-sphere-sidebar">
            <div class="skills-sphere-panel skills-sphere-legend">
              <h3>${SKILLS_SPHERE_DATA.labels.legendTitle}</h3>
              <div class="skills-sphere-legend-items" id="skills-sphere-legend-items"></div>
            </div>
            
            <div class="skills-sphere-panel skills-sphere-details" id="skills-sphere-details">
              <div class="skills-sphere-details-empty">
                ${SKILLS_SPHERE_DATA.labels.detailsPanelEmpty}
              </div>
            </div>
          </div>
        `;
        
        // Insert sidebar as second column in content area
        contentArea.insertAdjacentHTML('beforeend', panelHTML);
        
        // Populate legend
        this.populateLegend();
      }
      
      this.detailsEl = document.getElementById('skills-sphere-details');
      
      // Setup scroll activity detection for scrollbar visibility
      this.setupScrollbarVisibility();
    },
    
    setupScrollbarVisibility: function() {
      const detailsContent = document.querySelector('.skills-sphere-details-content');
      if (!detailsContent) return;
      
      let scrollTimeout;
      
      detailsContent.addEventListener('scroll', () => {
        // Show scrollbar when scrolling
        detailsContent.classList.add('scrolling');
        
        // Clear previous timeout
        clearTimeout(scrollTimeout);
        
        // Hide scrollbar after 1 second of no scroll activity
        scrollTimeout = setTimeout(() => {
          detailsContent.classList.remove('scrolling');
        }, 1000);
      });
    },
    
    populateLegend: function() {
      const legendEl = document.getElementById('skills-sphere-legend-items');
      if (!legendEl) return;
      
      // Get unique categories
      const categories = {};
      SKILLS_SPHERE_DATA.majorNodes.forEach(node => {
        if (!categories[node.category]) {
          categories[node.category] = node.color;
        }
      });
      
      // Create legend items
      Object.keys(categories).forEach(category => {
        const item = document.createElement('div');
        item.className = 'skills-sphere-legend-item';
        item.setAttribute('data-category', category);
        item.setAttribute('data-original-color', categories[category]);
        item.innerHTML = `
          <div class="skills-sphere-legend-dot" style="background: ${categories[category]}; box-shadow: 0 0 8px ${categories[category]}"></div>
          <span>${category}</span>
        `;
        
        // Make clickable
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => this.handleLegendClick(category));
        
        legendEl.appendChild(item);
      });
      
      // Store reference to update colors on theme change
      this.legendEl = legendEl;
    },
    
    handleLegendClick: function(category) {
      // OPTION 1 CONSISTENCY: Category and Node are mutually exclusive
      // Clear any active node selection BEFORE highlighting category
      if (this.selectedNode) {
        this.clearSelection();
      }
      
      // Toggle category highlight
      if (this.highlightedCategory === category) {
        // Clear highlight
        this.clearCategoryHighlight();
        this.highlightedCategory = null;
      } else {
        // Highlight this category
        this.highlightCategory(category);
        this.highlightedCategory = category;
      }
    },
    
    highlightCategory: function(category) {
      // Clear any previous highlights
      this.clearCategoryHighlight();
      
      // Dim all nodes first
      this.nodes.forEach(node => {
        if (node.userData.type === 'major') {
          node.material.opacity = 0.3;
          node.material.emissiveIntensity = 0.1;
        } else if (node.userData.type === 'satellite') {
          node.material.opacity = 0.1;
        }
      });
      
      // Dim all connections
      this.connections.forEach(conn => {
        conn.material.opacity = 0.05;
      });
      
      // Highlight nodes in this category
      this.nodes.forEach(node => {
        if (node.userData.type === 'major' && node.userData.category === category) {
          node.material.opacity = 1.0;
          node.material.emissiveIntensity = 0.7;
          node.scale.set(1.2, 1.2, 1.2);
          
          // Highlight its satellites
          this.nodes.forEach(sat => {
            if (sat.userData.type === 'satellite' && sat.userData.parentId === node.userData.id) {
              sat.material.opacity = 0.8;
              sat.material.emissiveIntensity = 0.4;
            }
          });
          
          // Highlight its connections
          this.connections.forEach(conn => {
            if (conn.userData.parentId === node.userData.id ||
                (conn.userData.nodes && 
                 (conn.userData.nodes[0] === node.userData.id || 
                  conn.userData.nodes[1] === node.userData.id))) {
              conn.material.opacity = 0.4;
            }
          });
        }
      });
      
      // Highlight legend item
      const legendItems = document.querySelectorAll('.skills-sphere-legend-item');
      legendItems.forEach(item => {
        if (item.getAttribute('data-category') === category) {
          item.classList.add('active');
        }
      });
    },
    
    clearCategoryHighlight: function() {
      // Reset all nodes to DEFAULT opacity (0.85/0.7)
      this.nodes.forEach(node => {
        if (node.userData.type === 'major') {
          node.material.opacity = 0.85; // Match createMajorNode
          node.material.emissiveIntensity = node.userData.originalEmissiveIntensity;
          node.scale.set(1, 1, 1);
        } else if (node.userData.type === 'satellite') {
          node.material.opacity = 0.7; // Match createSatellites
          node.material.emissiveIntensity = node.userData.originalEmissiveIntensity;
        }
      });
      
      // Reset all connections
      this.connections.forEach(conn => {
        conn.material.opacity = conn.userData.originalOpacity;
      });
      
      // Remove legend highlight
      const legendItems = document.querySelectorAll('.skills-sphere-legend-item');
      legendItems.forEach(item => {
        item.classList.remove('active');
      });
    },
    
    createNodeLabels: function() {
      const labelsContainer = document.getElementById('skills-sphere-node-labels');
      if (!labelsContainer) return;
      
      // Create HTML labels for each major node
      SKILLS_SPHERE_DATA.majorNodes.forEach(nodeData => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'skills-sphere-node-label';
        labelDiv.setAttribute('data-node-id', nodeData.id);
        labelDiv.innerHTML = `
          <span class="node-label-icon">${nodeData.icon}</span>
          <span class="node-label-text">${nodeData.label}</span>
        `;
        labelsContainer.appendChild(labelDiv);
        
        // Store reference
        this.labels.push({
          element: labelDiv,
          nodeId: nodeData.id
        });
      });
    },
    
    updateNodeLabels: function() {
      // Update 2D label positions based on 3D node positions
      this.labels.forEach(labelData => {
        const node = this.nodes.find(n => n.userData.id === labelData.nodeId);
        if (!node) return;
        
        // Get world position accounting for scene rotation
        const worldPos = new THREE.Vector3();
        node.getWorldPosition(worldPos);
        
        // Project to screen space
        const projected = worldPos.clone();
        projected.project(this.camera);
        
        // Convert to pixel coordinates
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const x = (projected.x * 0.5 + 0.5) * rect.width + rect.left;
        const y = (projected.y * -0.5 + 0.5) * rect.height + rect.top;
        
        // Bounds checking - hide labels outside container
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;
        if (x < rect.left || x > rect.left + canvasWidth || 
            y < rect.top || y > rect.top + canvasHeight) {
          labelData.element.style.display = 'none';
          return;
        }
        
        // Position label directly next to node (right side, vertically centered)
        labelData.element.style.left = `${x}px`;
        labelData.element.style.top = `${y}px`;
        
        // Calculate depth - how far back/forward the node is
        const toCamera = new THREE.Vector3().subVectors(
          this.camera.position,
          worldPos
        );
        const distance = toCamera.length();
        const direction = toCamera.normalize();
        const nodeDir = worldPos.clone().normalize();
        const dot = direction.dot(nodeDir);
        
        // Show labels for front-facing nodes, fade for back-facing
        if (dot > 0.1) {
          // Front-facing - full opacity based on angle
          const opacity = Math.max(0.3, Math.min(1, dot * 1.3));
          labelData.element.style.opacity = opacity;
          labelData.element.style.display = 'flex';
          labelData.element.style.zIndex = Math.floor(distance * 10); // Closer = higher z-index
        } else {
          // Back-facing - dim significantly
          labelData.element.style.opacity = 0.15;
          labelData.element.style.display = 'flex';
          labelData.element.style.zIndex = 1;
        }
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * EVENT HANDLERS
     * ═══════════════════════════════════════════════════════════════
     */
    
    onMouseDown: function(event) {
      // Only respond to left-click (button 0), ignore right-click (button 2)
      if (event.button !== 0) return;
      
      this.isDragging = true;
      this.autoRotate = false;
      this.isAutoRotatingToNode = false; // Cancel any ongoing auto-rotation
      this.totalDragDistance = 0; // Reset drag distance tracker
      this.dragStartTime = Date.now(); // Track when drag started
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      this.renderer.domElement.style.cursor = 'grabbing';
    },
    
    onMouseMove: function(event) {
      // Update mouse position for raycasting
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (this.isDragging) {
        // Calculate rotation delta
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        // Track total drag distance to distinguish from clicks
        this.totalDragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        
        this.rotationVelocity.y = deltaX * 0.005;
        this.rotationVelocity.x = deltaY * 0.005;
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
      } else if (!this.justFinishedDragging) {
        // Only check hover if not immediately after dragging
        this.checkHover();
      }
    },
    
    onMouseUp: function() {
      const mouseUpTime = Date.now();
      const totalDuration = mouseUpTime - this.dragStartTime;
      
      this.isDragging = false;
      this.renderer.domElement.style.cursor = 'grab';
      
      // Prevent immediate hover detection after drag ends
      this.justFinishedDragging = true;
      setTimeout(() => {
        this.justFinishedDragging = false;
      }, 150); // 150ms delay before hover re-enables
      
      // CONSISTENT BEHAVIOR: Resume auto-rotate after manual drag (regardless of selection)
      // Selection only locks details panel, doesn't prevent rotation
      setTimeout(() => {
        if (!this.isDragging && !this.isAutoRotatingToNode) {
          this.autoRotate = true;
        }
        // Auto-rotate resumes for all states: no selection, category, or node selected
      }, 2000);
    },
    
    onMouseLeave: function() {
      this.isDragging = false;
      this.renderer.domElement.style.cursor = 'grab';
      this.clearHover();
    },
    
    onContextMenu: function(event) {
      // Prevent right-click context menu on canvas
      event.preventDefault();
      return false;
    },
    
    onClick: function(event) {
      const clickTime = Date.now();
      const dragDuration = clickTime - (this.dragStartTime || 0);
      const wasDragging = this.totalDragDistance > 5; // 5px distance threshold only
      
      if (wasDragging) {
        this.totalDragDistance = 0;
        return;
      }
      
      // Check for clicks on logos, satellites, and major nodes
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Collect all clickable objects: major nodes, satellites, and logo sprites
      const clickableObjects = [];
      this.nodes.forEach(n => {
        if (n.userData.type === 'major' || n.userData.type === 'satellite') {
          clickableObjects.push(n);
        }
        if (n.userData.logoSprite) {
          clickableObjects.push(n.userData.logoSprite);
        }
      });
      
      const intersects = this.raycaster.intersectObjects(clickableObjects, false);
      
      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        let targetNode = null;
        
        // Determine which node to select based on what was clicked
        if (clicked.userData.type === 'logo') {
          // Logo was clicked - select its parent node
          targetNode = clicked.userData.parentNode;
        } else if (clicked.userData.type === 'satellite') {
          // Satellite was clicked - find and select its parent
          targetNode = this.nodes.find(n => 
            n.userData.type === 'major' && n.userData.id === clicked.userData.parentId
          );
        } else if (clicked.userData.type === 'major') {
          // Major node was clicked directly
          targetNode = clicked;
        }
        
        if (targetNode) {
          // OPTION 1: Category and Node selection are MUTUALLY EXCLUSIVE
          // ANY node selection ALWAYS clears category highlight
          if (this.highlightedCategory) {
            this.clearCategoryHighlight();
            this.highlightedCategory = null;
          }
          
          // Toggle selection
          if (this.selectedNode === targetNode) {
            // Deselect current node
            this.clearSelection();
          } else {
            // Clear previous selection and select new node
            this.clearSelection(true); // Skip opacity restore to prevent flash
            this.selectNode(targetNode);
            
            // ALWAYS rotate ALL nodes to dead center (no threshold)
            // Ensures consistent, predictable behavior for every node
            this.rotateToNode(targetNode);
          }
        }
      } else {
        // Click on empty space - clear BOTH category and selection
        this.clearSelection();
        if (this.highlightedCategory) {
          this.clearCategoryHighlight();
          this.highlightedCategory = null;
        }
      }
    },
    
    // Touch events (mobile)
    onTouchStart: function(event) {
      event.preventDefault();
      if (event.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.lastMouseX = event.touches[0].clientX;
        this.lastMouseY = event.touches[0].clientY;
      }
    },
    
    onTouchMove: function(event) {
      event.preventDefault();
      if (this.isDragging && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.lastMouseX;
        const deltaY = touch.clientY - this.lastMouseY;
        
        this.rotationVelocity.y = deltaX * 0.005;
        this.rotationVelocity.x = -deltaY * 0.005; // Restore vertical rotation
        
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
      }
    },    onTouchEnd: function() {
      this.isDragging = false;
      setTimeout(() => {
        if (!this.isDragging) {
          this.autoRotate = true;
        }
      }, 2000);
    },
    
    onWindowResize: function() {
      if (!this.canvasWrapper) return;
      
      const width = this.canvasWrapper.clientWidth;
      const height = this.canvasWrapper.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height, false);
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * INTERACTION LOGIC
     * ═══════════════════════════════════════════════════════════════
     */
    
    checkHover: function() {
      // Update raycaster with current mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Check both major nodes and satellites for hover
      const hoverableNodes = this.nodes.filter(n => n.userData.type === 'major' || n.userData.type === 'satellite');
      const intersects = this.raycaster.intersectObjects(hoverableNodes, false);
      
      if (intersects.length > 0) {
        let node = intersects[0].object;
        
        // If satellite is hovered, find its parent node
        if (node.userData.type === 'satellite') {
          const parentNode = this.nodes.find(n => 
            n.userData.type === 'major' && n.userData.id === node.userData.parentId
          );
          if (parentNode) {
            node = parentNode; // Hover the parent instead
          }
        }
        
        // NEW: Allow hover on all visible nodes (foreground & background)
        // Only check minimum visibility threshold to prevent accidental triggers
        const worldScale = new THREE.Vector3();
        node.getWorldScale(worldScale);
        
        // Minimum visibility threshold - only hover reasonably visible nodes
        if (worldScale.x > 0.3) {  // Node must be at least 30% of full scale
          if (this.hoveredNode !== node) {
            this.setHoveredNode(node);
            this.renderer.domElement.style.cursor = 'pointer';
          }
        } else {
          this.clearHover();
          this.renderer.domElement.style.cursor = 'grab';
        }
      } else {
        this.clearHover();
        if (!this.isDragging) {
          this.renderer.domElement.style.cursor = 'grab';
        }
      }
    },
    
    setHoveredNode: function(node) {
      // Don't apply hover animation if this node is already selected
      if (this.selectedNode === node) {
        return;
      }
      
      // Clear previous hover
      this.clearHover();
      
      this.hoveredNode = node;
      
      // ALWAYS apply FULL hover animation (brighten color, opacity, scale)
      // This works consistently in ALL states: no selection, node selection, category selection
      // Use theme-adjusted color if available
      const baseColor = node.userData.currentThemeColor || node.userData.color;
      const brightColor = new THREE.Color(baseColor).multiplyScalar(1.5);
      node.material.color.copy(brightColor);
      node.material.opacity = 0.85; // FULL opacity (same as unselected state)
      node.scale.set(1.3, 1.3, 1.3);
      
      // Enlarge the sprite label (logo stays inside node and scales with it)
      if (node.userData.sprite) {
        node.userData.sprite.scale.set(10.4, 2.6, 1); // 30% larger when hovered
      }
      // Logo sprite stays at same scale since it's inside the node and scales with node
      
      // Show and brighten satellites
      this.nodes.forEach(n => {
        if (n.userData.type === 'satellite' && n.userData.parentId === node.userData.id) {
          n.material.opacity = 1.0; // FULL opacity
          n.scale.set(1.3, 1.3, 1.3);
          // Brighten satellite color - use theme-adjusted
          const satBaseColor = n.userData.currentThemeColor || n.userData.color;
          const brightSatColor = new THREE.Color(satBaseColor).multiplyScalar(1.5);
          n.material.color.copy(brightSatColor);
        }
      });
      
      // Highlight and enlarge connections with color
      this.connections.forEach(conn => {
        if (conn.userData.type === 'satellite-connection' && 
            conn.userData.parentId === node.userData.id) {
          conn.material.opacity = 0.9; // Much brighter
          conn.material.linewidth = 3; // Enlarge connection lines
          // Color the connection to match the node (use theme-adjusted)
          const connColor = node.userData.currentThemeColor || node.userData.color;
          conn.material.color.setHex(parseInt(connColor.replace('#', '0x')));
        }
        // Also highlight major node connections
        if (conn.userData.nodes && 
            (conn.userData.nodes[0] === node.userData.id || 
             conn.userData.nodes[1] === node.userData.id)) {
          conn.material.opacity = 0.9; // Much brighter
          conn.material.linewidth = 3;
          // Color the connection to match the node (use theme-adjusted)
          const connColor = node.userData.currentThemeColor || node.userData.color;
          conn.material.color.setHex(parseInt(connColor.replace('#', '0x')));
        }
      });
      
      // UPDATE DETAILS PANEL ONLY IF NO SELECTION (locked when selected)
      if (!this.selectedNode) {
        this.updateDetailsPanel(node);
      }
      // If there IS a selection, details stay locked to selected node
    },
    
    clearHover: function() {
      if (!this.hoveredNode) return;
      
      // Don't clear hover visuals if this node is the SELECTED node
      if (this.selectedNode === this.hoveredNode) {
        this.hoveredNode = null;
        return;
      }
      
      // CHECK ALL ACTIVE STATES - selection OR category highlight
      const hasActiveSelection = this.selectedNode !== null;
      const hasActiveCategoryHighlight = this.highlightedCategory !== null;
      
      // Reset node appearance - use theme-adjusted color if available
      const colorToUse = this.hoveredNode.userData.currentThemeColor || this.hoveredNode.userData.originalColor;
      this.hoveredNode.material.color.copy(new THREE.Color(colorToUse));
      this.hoveredNode.scale.set(1, 1, 1);
      
      // Reset node opacity based on ANY active state
      if (hasActiveSelection) {
        // Node selection active - restore to dimmed state
        if (this.hoveredNode.userData.type === 'major') {
          this.hoveredNode.material.opacity = 0.3;
        }
      } else if (hasActiveCategoryHighlight) {
        // Category highlight active - check if this node belongs to highlighted category
        if (this.hoveredNode.userData.type === 'major') {
          if (this.hoveredNode.userData.category === this.highlightedCategory) {
            this.hoveredNode.material.opacity = 1.0; // Highlighted category
          } else {
            this.hoveredNode.material.opacity = 0.3; // Other categories (dimmed)
          }
        }
      } else {
        // No active state - restore to normal opacity
        if (this.hoveredNode.userData.type === 'major') {
          this.hoveredNode.material.opacity = 0.85;
        }
      }
      
      // Reset sprite label size
      if (this.hoveredNode.userData.sprite) {
        this.hoveredNode.userData.sprite.scale.set(8, 2, 1); // Normal size
      }
      
      // Reset satellites based on ANY active state
      this.nodes.forEach(n => {
        if (n.userData.type === 'satellite' && n.userData.parentId === this.hoveredNode.userData.id) {
          n.scale.set(1, 1, 1);
          const satColor = n.userData.currentThemeColor || n.userData.color;
          n.material.color.copy(new THREE.Color(satColor));
          
          // Restore opacity based on state priority: selection > category > normal
          if (hasActiveSelection) {
            // Node selection active - restore to dimmed state
            if (n.userData.parentId === this.selectedNode.userData.id) {
              n.material.opacity = 0.8; // Selected node's satellites
            } else {
              n.material.opacity = 0.1; // Other satellites (dimmed)
            }
          } else if (hasActiveCategoryHighlight) {
            // Category highlight active - check if parent belongs to highlighted category
            const parentNode = this.nodes.find(parent => 
              parent.userData.type === 'major' && parent.userData.id === n.userData.parentId
            );
            if (parentNode && parentNode.userData.category === this.highlightedCategory) {
              n.material.opacity = 0.8; // Highlighted category satellites
            } else {
              n.material.opacity = 0.1; // Other satellites (dimmed)
            }
          } else {
            // No active state - restore to original opacity
            n.material.opacity = n.userData.originalOpacity;
          }
        }
      });
      
      // Reset connections based on ANY active state
      this.connections.forEach(conn => {
        if (conn.userData.parentId === this.hoveredNode.userData.id ||
            (conn.userData.nodes && 
             (conn.userData.nodes[0] === this.hoveredNode.userData.id || 
              conn.userData.nodes[1] === this.hoveredNode.userData.id))) {
          conn.material.linewidth = SKILLS_SPHERE_DATA.config.connectionWidth;
          
          // Restore opacity based on state priority: selection > category > normal
          if (hasActiveSelection) {
            // Node selection active - restore to dimmed state
            if (conn.userData.parentId === this.selectedNode.userData.id ||
                (conn.userData.nodes && 
                 (conn.userData.nodes[0] === this.selectedNode.userData.id || 
                  conn.userData.nodes[1] === this.selectedNode.userData.id))) {
              conn.material.opacity = 0.4; // Selected connections
            } else {
              conn.material.opacity = 0.05; // Other connections (dimmed)
            }
          } else if (hasActiveCategoryHighlight) {
            // Category highlight active - check if connection belongs to highlighted category
            let belongsToHighlightedCategory = false;
            if (conn.userData.parentId) {
              const parentNode = this.nodes.find(n => 
                n.userData.type === 'major' && n.userData.id === conn.userData.parentId
              );
              belongsToHighlightedCategory = parentNode && parentNode.userData.category === this.highlightedCategory;
            } else if (conn.userData.nodes) {
              const node1 = this.nodes.find(n => n.userData.id === conn.userData.nodes[0]);
              const node2 = this.nodes.find(n => n.userData.id === conn.userData.nodes[1]);
              belongsToHighlightedCategory = (node1 && node1.userData.category === this.highlightedCategory) ||
                                             (node2 && node2.userData.category === this.highlightedCategory);
            }
            
            if (belongsToHighlightedCategory) {
              conn.material.opacity = 0.4; // Highlighted category connections
            } else {
              conn.material.opacity = 0.05; // Other connections (dimmed)
            }
          } else {
            // No active state - restore to original opacity
            conn.material.opacity = conn.userData.originalOpacity;
          }
        }
      });
      
      this.hoveredNode = null;
      
      // CRITICAL FIX: If a node is selected, re-apply dimming to ALL nodes
      // This fixes the bug where hovering during selection breaks the dim state
      if (this.selectedNode) {
        this.dimOtherNodes(this.selectedNode);
      }
      
      // CLEAR DETAILS ONLY IF NO SELECTION (locked when selected)
      if (!this.selectedNode) {
        this.clearDetailsPanel();
      }
      // If there IS a selection, details stay locked
    },
    
    selectNode: function(node) {
      this.selectedNode = node;
      
      // Apply selection visuals (color, scale, sprites) - use theme-adjusted color
      const baseColor = node.userData.currentThemeColor || node.userData.color;
      const brightColor = new THREE.Color(baseColor).multiplyScalar(1.5);
      node.material.color.copy(brightColor);
      node.material.opacity = 0.85; // Explicitly set opacity for selected node
      node.scale.set(1.15, 1.15, 1.15); // REDUCED from 1.3 to prevent covering labels
      
      if (node.userData.sprite) {
        node.userData.sprite.scale.set(9, 2.25, 1); // REDUCED proportionally
        // Position label using camera-relative method (adapts to steep angles like ML node)
        // This prevents label obstruction when camera looks down at node
        this.positionSpriteTowardCamera(node.userData.sprite, node, 2.95);
      }
      
      // Brighten satellites
      this.nodes.forEach(n => {
        if (n.userData.type === 'satellite' && n.userData.parentId === node.userData.id) {
          n.material.opacity = 1.0;
          n.scale.set(1.15, 1.15, 1.15); // REDUCED to match
          const satBaseColor = n.userData.currentThemeColor || n.userData.color;
          const brightSatColor = new THREE.Color(satBaseColor).multiplyScalar(1.5);
          n.material.color.copy(brightSatColor);
        }
      });
      
      // Brighten connections
      this.connections.forEach(conn => {
        if (conn.userData.type === 'satellite-connection' && 
            conn.userData.parentId === node.userData.id) {
          conn.material.opacity = 0.9;
          conn.material.linewidth = 3;
          const connColor = node.userData.currentThemeColor || node.userData.color;
          conn.material.color.setHex(parseInt(connColor.replace('#', '0x')));
        }
        if (conn.userData.nodes && 
            (conn.userData.nodes[0] === node.userData.id || 
             conn.userData.nodes[1] === node.userData.id)) {
          conn.material.opacity = 0.9;
          conn.material.linewidth = 3;
          const connColor = node.userData.currentThemeColor || node.userData.color;
          conn.material.color.setHex(parseInt(connColor.replace('#', '0x')));
        }
      });
      
      // APPLY DIMMING IMMEDIATELY (regardless of front/back position)
      this.dimOtherNodes(node);
      
      this.updateDetailsPanel(node);
    },
    
    dimOtherNodes: function(selectedNode) {
      // Dim all nodes except selected (EXACT category selection values)
      this.nodes.forEach(n => {
        if (n === selectedNode) {
          // Selected node stays at current opacity (already bright)
          // Don't change - keep selection brightness
        } else if (n.userData.type === 'major') {
          // Other major nodes dim (MATCH category: 0.3)
          n.material.opacity = 0.3;
        } else if (n.userData.type === 'satellite') {
          // Check if satellite belongs to selected node
          if (n.userData.parentId === selectedNode.userData.id) {
            n.material.opacity = 0.8; // Selected satellites (MATCH category: 0.8)
          } else {
            n.material.opacity = 0.1; // Other satellites (MATCH category: 0.1)
          }
        }
      });
      
      // Dim connections (MATCH category values)
      this.connections.forEach(conn => {
        if (conn.userData.parentId === selectedNode.userData.id ||
            (conn.userData.nodes && 
             (conn.userData.nodes[0] === selectedNode.userData.id || 
              conn.userData.nodes[1] === selectedNode.userData.id))) {
          conn.material.opacity = 0.4; // Selected connections (MATCH category)
        } else {
          conn.material.opacity = 0.05; // Other connections (MATCH category)
        }
      });
      
      // LOGOS: NOT dimmed (matching category behavior - no logo opacity changes)
    },
    
    clearSelection: function(skipOpacityRestore) {
      if (!this.selectedNode) return;
      
      const node = this.selectedNode;
      this.selectedNode = null;
      
      // Reset node appearance - use theme-adjusted color if available
      const colorToUse = node.userData.currentThemeColor || node.userData.originalColor;
      node.material.color.copy(new THREE.Color(colorToUse));
      node.scale.set(1, 1, 1);
      
      // Reset sprites (including position)
      if (node.userData.sprite) {
        node.userData.sprite.scale.set(8, 2, 1);
        // Reset label to default position using camera-relative method
        this.positionSpriteTowardCamera(node.userData.sprite, node, 2.5);
      }
      // Logo sprite stays at same scale (inside node)
      
      // Reset satellites
      this.nodes.forEach(n => {
        if (n.userData.type === 'satellite' && n.userData.parentId === node.userData.id) {
          n.material.opacity = n.userData.originalOpacity;
          n.scale.set(1, 1, 1);
          // Reset color - use theme-adjusted if available
          const satColor = n.userData.currentThemeColor || n.userData.color;
          n.material.color.copy(new THREE.Color(satColor));
        }
      });
      
      // Reset connections
      this.connections.forEach(conn => {
        if (conn.userData.type === 'satellite-connection' && 
            conn.userData.parentId === node.userData.id) {
          conn.material.opacity = conn.userData.originalOpacity || SKILLS_SPHERE_DATA.config.connectionOpacity;
          conn.material.linewidth = SKILLS_SPHERE_DATA.config.connectionWidth;
          const connColor = node.userData.currentThemeColor || node.userData.color;
          conn.material.color.setHex(parseInt(connColor.replace('#', '0x')));
        }
        if (conn.userData.nodes && 
            (conn.userData.nodes[0] === node.userData.id || 
             conn.userData.nodes[1] === node.userData.id)) {
          conn.material.opacity = conn.userData.originalOpacity || SKILLS_SPHERE_DATA.config.connectionOpacity;
          conn.material.linewidth = SKILLS_SPHERE_DATA.config.connectionWidth;
        }
      });
      
      // RESTORE all nodes opacity (un-dim everything) - only if not switching to another node
      if (!skipOpacityRestore) {
        this.restoreAllNodesOpacity();
      }
      
      this.clearDetailsPanel();
      
      // RESUME ROTATION after delay (deselection = exploration mode)
      setTimeout(() => {
        if (!this.isDragging && !this.isAutoRotatingToNode && !this.selectedNode) {
          this.autoRotate = true;
          console.log('Rotation resumed - exploration mode');
        }
      }, 2000);
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * AUTO-ROTATE TO NODE (Smooth Animation)
     * ═══════════════════════════════════════════════════════════════
     */
    
    rotateToNode: function(node) {
      // PRE-MAPPED SOLUTION: Use original spherical coordinates from data
      // No dependency on worldPos (which changes with scene rotation)
      
      // Find node's ORIGINAL coordinates (theta, phi) from data
      const nodeData = SKILLS_SPHERE_DATA.majorNodes.find(n => n.id === node.userData.id);
      if (!nodeData) {
        console.warn('Node data not found for rotation:', node.userData.id);
        return;
      }
      
      const config = SKILLS_SPHERE_DATA.config;
      
      // ═══════════════════════════════════════════════════════════════
      // HARDCODED ROTATION LOOKUP TABLE
      // Pre-calculated rotation values that bring each node to (0, 0, 16)
      // Based on empirical testing from diagnostic console output
      // ═══════════════════════════════════════════════════════════════
      
      const ROTATION_LOOKUP = {
        // PROVEN PERFECT (from your diagnostics):
        'git': {
          rotY: 2.3562,   // 135.0 deg Result: (0.00, 0.00, 16.00)
          rotX: -0.4712   // -27.0 deg
        },
        'excel': {
          rotY: 5.4978,   // 315.0 deg Result: (0.00, 0.00, 16.00)
          rotX: -0.4712   // -27.0 deg
        },
        
        // CALIBRATED VALUES - Reverse-engineered from working Git/Excel pattern
        // Pattern analysis:
        //   Git:   theta=225° (3.927) rotY=135° (2.3562) = -(225° - 360°) = -225° + 360° = 135°
        //   Excel: theta=45° (0.785)  rotY=315° (5.4978) = -45° + 360° = 315°
        //   Both:  phi=117° (2.042)   rotX=-27° (-0.4712) = -(117° - 90°) = -27°
        
        // SQL: theta=0°, phi=90° 
        // Was at z=-16 (back of sphere), need to flip 180° on Y axis
        // 90° + 180° = 270° (4.7124)
        'sql': {
          rotY: 4.7124,   // 270° (was 90° - adding 180° to flip to front)
          rotX: 0         // 0°
        },
        
        // Power BI: theta=180°, phi=90°
        // Was at z=-16 (back of sphere), need to flip 180° on Y axis
        // 270° + 180° = 90° (1.5708)
        'powerbi': {
          rotY: 1.5708,   // 90° (was 270° - adding 180° to flip to front)
          rotX: 0         // 0°
        },
        
        // Python: theta=90°, phi=60°
        // rotY = -90° + 360° = 270° (4.7124) BUT add 90° offset = 0° or 360° (0)
        // rotX = -(60° - 90°) = 30° (0.5236)
        'python': {
          rotY: 0,        // 0° (360°)
          rotX: 0.5236    // 30°
        },
        
        // R: theta=270°, phi=60°
        // rotY = -270° + 360° = 90° BUT add 90° offset = 180° (3.1416)
        // rotX = -(60° - 90°) = 30° (0.5236)
        'r': {
          rotY: 3.1416,   // 180°
          rotX: 0.5236    // 30°
        },
        
        // ML: theta=135°, phi=126°
        // rotY=45° rotX=-45° gave (0, 2.50, 15.80) - ALMOST PERFECT!
        // rotY=45° rotX=-48° gave (0, 3.33, 15.65) - worse, Y increased
        // rotY=45° rotX=-40° gave (0, 1.12, 15.96) - much better! Almost there
        // rotY=45° rotX=-37° gave (0, 0.28, 16.00) - Z PERFECT! Tiny Y offset remains
        // rotY=45° rotX=-36.5° gave (0, 0.14, 16.00) - SO CLOSE! Just 0.14 Y
        // rotY=45° rotX=-36.25° gave (0, 0.07, 16.00) - ALMOST PERFECT! 0.07 Y
        // rotY=45° rotX=-36.125° gave (0, 0.03, 16.00) - 0.03 Y remaining
        // rotY=45° rotX=-36.0625° gave (0, 0.02, 16.00) - 0.02 Y - SO CLOSE!
        // rotY=45° rotX=-36.03° gave (0, 0.01, 16.00) - 0.01 Y - ALMOST PERFECT!
        'ml': {
          rotY: 0.7854,   // 45° (perfect for X)
          rotX: -0.6285   // -36.015° (final hair adjustment)
        }
      };
      
      // Get pre-calculated rotation for this node
      const targetRotation = ROTATION_LOOKUP[nodeData.id];
      
      if (!targetRotation) {
        console.warn('No rotation mapping found for node:', nodeData.id);
        return;
      }
      
      // Normalize Y rotation to shortest path (avoid 270° when 90° works)
      const currentRotY = this.scene.rotation.y;
      let normalizedRotY = targetRotation.rotY;
      
      // Find shortest rotation path (within -π to +π range)
      while (normalizedRotY - currentRotY > Math.PI) {
        normalizedRotY -= Math.PI * 2;
      }
      while (normalizedRotY - currentRotY < -Math.PI) {
        normalizedRotY += Math.PI * 2;
      }
      
      // NO CLAMPING - Allow full rotation range to reach any node position
      
      // Start smooth animation (1000ms = moderate speed)
      this.animateRotation(normalizedRotY, targetRotation.rotX, 1000);
    },
    
    animateRotation: function(targetY, targetX, duration) {
      const startY = this.scene.rotation.y;
      const startX = this.scene.rotation.x;
      const startTime = Date.now();
      
      // Set animation flag and disable auto-rotate
      this.isAutoRotatingToNode = true;
      this.autoRotate = false;
      
      // DIM all nodes except selected (EXACT category selection values)
      const selectedNode = this.selectedNode;
      
      this.nodes.forEach(n => {
        if (n === selectedNode) {
          // Selected node stays at current opacity (already scaled in selectNode)
          // Don't change opacity - keep selection brightness
        } else if (n.userData.type === 'major') {
          // Other major nodes dim (MATCH category: 0.3)
          n.material.opacity = 0.3;
        } else if (n.userData.type === 'satellite') {
          // Check if satellite belongs to selected node
          if (n.userData.parentId === selectedNode.userData.id) {
            n.material.opacity = 0.8; // Selected satellites (MATCH category: 0.8)
          } else {
            n.material.opacity = 0.1; // Other satellites (MATCH category: 0.1)
          }
        }
      });
      
      // DIM connections (MATCH category values)
      this.connections.forEach(conn => {
        if (conn.userData.parentId === selectedNode.userData.id ||
            (conn.userData.nodes && 
             (conn.userData.nodes[0] === selectedNode.userData.id || 
              conn.userData.nodes[1] === selectedNode.userData.id))) {
          conn.material.opacity = 0.4; // Selected connections (MATCH category)
        } else {
          conn.material.opacity = 0.05; // Other connections (MATCH category)
        }
      });
      
      // LOGOS: NOT dimmed (matching category behavior - no logo opacity changes)
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate rotation
        this.scene.rotation.y = startY + (targetY - startY) * eased;
        this.scene.rotation.x = startX + (targetX - startX) * eased;
        
        // User interrupted by dragging - cancel animation and restore
        if (this.isDragging) {
          this.isAutoRotatingToNode = false;
          // FIX: If node is still selected, reapply dimming instead of restoring all
          if (this.selectedNode) {
            this.dimOtherNodes(this.selectedNode);
          } else {
            this.restoreAllNodesOpacity();
          }
          this.autoRotate = true; // Resume rotation if user interrupts
          return;
        }
        
        // Continue animation or finish
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAutoRotatingToNode = false;
          
          // autoRotate stays false until clearSelection() is called
        }
      };
      
      animate();
    },
    
    restoreAllNodesOpacity: function() {
      this.nodes.forEach(n => {
        if (n.userData.type === 'major') {
          n.material.opacity = 0.85;
        } else if (n.userData.type === 'satellite') {
          n.material.opacity = n.userData.originalOpacity || 0.7;
        }
      });
      
      this.connections.forEach(conn => {
        conn.material.opacity = conn.userData.originalOpacity || SKILLS_SPHERE_DATA.config.connectionOpacity;
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * DETAILS PANEL
     * ═══════════════════════════════════════════════════════════════
     */
    
    updateDetailsPanel: function(node) {
      if (!this.detailsEl) return;
      
      const data = node.userData;
      
      // Build icon HTML - check if it's a URL or emoji
      let iconHtml = '';
      if (data.icon && data.icon.startsWith('http')) {
        iconHtml = `<img src="${data.icon}" alt="${data.label}" style="width: 40px; height: 40px; object-fit: contain;">`;
      } else if (data.icon) {
        iconHtml = data.icon; // Emoji fallback
      }
      
      // Build credentials HTML if they exist
      let credentialsHtml = '';
      if (data.credentials && data.credentials.length > 0) {
        credentialsHtml = `
          <div class="skills-sphere-details-section">
            <h5 class="skills-sphere-details-section-title">Credentials</h5>
            <div class="skills-sphere-credentials-list">
              ${data.credentials.map(cred => `
                <div class="skills-sphere-credential-item">
                  <div class="skills-sphere-credential-name">${cred.name}</div>
                  <div class="skills-sphere-credential-desc">${cred.description} (${cred.year})</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      // Build projects HTML if projects exist
      let projectsHtml = '';
      if (data.projects && data.projects.length > 0) {
        projectsHtml = `
          <div class="skills-sphere-details-section">
            <h5 class="skills-sphere-details-section-title">Related Projects</h5>
            <div class="skills-sphere-projects-list">
              ${data.projects.map(project => {
                // Build project credentials HTML
                let projectCredHtml = '';
                if (project.credentials && project.credentials.length > 0) {
                  projectCredHtml = `
                    <div class="skills-sphere-project-credentials">
                      ${project.credentials.map(cred => 
                        `<span class="skills-sphere-project-credential-badge">${cred.name} - ${cred.description} (${cred.year})</span>`
                      ).join('')}
                    </div>
                  `;
                }
                
                return `
                  <div class="skills-sphere-project-item" data-project='${JSON.stringify(project)}'>
                    <div class="skills-sphere-project-name">${project.name}</div>
                    <div class="skills-sphere-project-desc">${project.description}</div>
                    ${projectCredHtml}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
      
      const html = `
        <div class="skills-sphere-details-content">
          <div class="skills-sphere-details-header">
            <div class="skills-sphere-details-icon">${iconHtml}</div>
            <div class="skills-sphere-details-title">
              <h4>${data.displayName || data.label}</h4>
              <div class="skills-sphere-details-subtitle">${data.description}</div>
            </div>
          </div>
          <div class="skills-sphere-details-list">
            ${data.satellites.map(sat => `<div class="skills-sphere-detail-chip">${sat}</div>`).join('')}
          </div>
          ${credentialsHtml}
          ${projectsHtml}
        </div>
      `;
      
      this.detailsEl.innerHTML = html;
      
      // Setup scrollbar visibility detection for the newly created content
      this.setupScrollbarVisibility();
      
      // Add click handlers to project items
      if (data.projects && data.projects.length > 0) {
        const projectItems = this.detailsEl.querySelectorAll('.skills-sphere-project-item');
        projectItems.forEach(item => {
          item.addEventListener('click', () => {
            const projectData = JSON.parse(item.getAttribute('data-project'));
            this.handleProjectClick(projectData);
          });
        });
      }
    },
    
    handleProjectClick: function(project) {
      console.log('Project clicked:', project);
      
      // Handle external links (like GitHub)
      if (project.isExternal && project.externalUrl) {
        window.open(project.externalUrl, '_blank');
        return;
      }
      
      // Internal project - call global handler (defined in script.js)
      if (typeof window.handleSkillsSphereProjectClick === 'function') {
        window.handleSkillsSphereProjectClick(project);
      } else {
        console.warn('handleSkillsSphereProjectClick not found. Make sure script.js is loaded.');
      }
    },
    
    clearDetailsPanel: function() {
      if (!this.detailsEl) return;
      
      this.detailsEl.innerHTML = `
        <div class="skills-sphere-details-empty">
          ${SKILLS_SPHERE_DATA.labels.detailsPanelEmpty}
        </div>
      `;
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * ANIMATION LOOP
     * ═══════════════════════════════════════════════════════════════
     */
    
    animate: function() {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
      
      // Apply rotation velocity (full 360 rotation restored)
      if (this.isDragging || Math.abs(this.rotationVelocity.x) > 0.0001 || Math.abs(this.rotationVelocity.y) > 0.0001) {
        this.scene.rotation.y += this.rotationVelocity.y;
        this.scene.rotation.x += this.rotationVelocity.x;
        
        // NO CLAMPING - Full freedom in all directions (horizontal AND vertical)
        // Removed: this.scene.rotation.x = Math.max(-Math.PI / 5.5, Math.min(Math.PI / 5.5, this.scene.rotation.x));
        
        // Apply damping
        if (!this.isDragging) {
          this.rotationVelocity.y *= SKILLS_SPHERE_DATA.config.rotationDamping;
          this.rotationVelocity.x *= SKILLS_SPHERE_DATA.config.rotationDamping;
        }
      }
      
      // Auto-rotate (only if not manually rotating or auto-rotating to node)
      if (this.autoRotate && !this.isDragging && !this.isAutoRotatingToNode) {
        this.scene.rotation.y += SKILLS_SPHERE_DATA.config.autoRotateSpeed * 0.01;
      }
      
      // Depth fading disabled - all nodes maintain consistent opacity
      // if (SKILLS_SPHERE_DATA.config.depthFading) {
      //   this.updateDepthFading();
      // }
      
      // Update sprite labels to always face camera (billboard effect)
      this.nodes.forEach(node => {
        if (node.userData.type === 'major' && node.userData.sprite) {
          node.userData.sprite.quaternion.copy(this.camera.quaternion);
        }
        if (node.userData.logoSprite) {
          node.userData.logoSprite.quaternion.copy(this.camera.quaternion);
        }
      });
      
      // Render
      this.renderer.render(this.scene, this.camera);
    },
    
    updateDepthFading: function() {
      this.nodes.forEach(node => {
        const toCamera = new THREE.Vector3().subVectors(
          this.camera.position,
          node.position
        ).normalize();
        const nodeDirection = node.position.clone().normalize();
        const dot = toCamera.dot(nodeDirection);
        
        // Fade back-facing nodes
        if (dot < 0) {
          node.material.opacity = SKILLS_SPHERE_DATA.config.backNodeOpacity;
        } else {
          // Front-facing nodes: satellites use original opacity, major nodes use 0.85
          node.material.opacity = node.userData.type === 'satellite' 
            ? node.userData.originalOpacity 
            : 0.85;  // Match the transparency set in createMajorNode
        }
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * THEME DETECTION & ADAPTATION
     * ═══════════════════════════════════════════════════════════════
     */
    
    initThemeObserver: function() {
      // Detect current theme on init
      this.updateThemeColors();
      
      // Watch for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            this.updateThemeColors();
          }
        });
      });
      
      // Observe theme attribute changes on both html and body
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    },
    
    updateThemeColors: function() {
      const isDark = this.isDarkTheme();
      
      console.log('🎨 Theme detected:', isDark ? 'dark' : 'light');
      
      // Update connection line colors
      const connectionColor = isDark ? 0x64748b : 0x94a3b8;
      this.connections.forEach(conn => {
        if (!conn.userData.isHighlighted) {
          conn.material.color.setHex(connectionColor);
        }
      });
      
      // Update node colors for light/dark mode
      this.nodes.forEach(node => {
        if (node.userData.type === 'major' || node.userData.type === 'satellite') {
          const originalColor = new THREE.Color(node.userData.originalColor || node.userData.color);
          let themeColor;
          
          // Determine category (satellites inherit from parent)
          let nodeCategory = node.userData.category;
          if (node.userData.type === 'satellite' && node.userData.parentId) {
            const parentNode = this.nodes.find(n => 
              n.userData.type === 'major' && n.userData.id === node.userData.parentId
            );
            if (parentNode) {
              nodeCategory = parentNode.userData.category;
            }
          }
          
          // Get color from category map
          const colorScheme = this.CATEGORY_COLORS[nodeCategory];
          if (colorScheme) {
            themeColor = new THREE.Color(isDark ? colorScheme.dark : colorScheme.light);
          } else {
            // Fallback for undefined categories
            themeColor = originalColor.clone();
          }
          
          // Apply color to material AND store in userData for hover/selection to use
          node.material.color.copy(themeColor);
          node.userData.currentThemeColor = '#' + themeColor.getHexString();
        }
        
        // Update text sprites
        if (node.userData.sprite) {
          const oldSprite = node.userData.sprite;
          const label = node.userData.label;
          this.scene.remove(oldSprite);
          this.createTextSprite(label, node, isDark);
        }
      });
      
      // Update legend colors to match theme
      if (this.legendEl) {
        const legendItems = this.legendEl.querySelectorAll('.skills-sphere-legend-item');
        legendItems.forEach(item => {
          const category = item.getAttribute('data-category');
          const originalColor = item.getAttribute('data-original-color');
          const dot = item.querySelector('.skills-sphere-legend-dot');
          
          if (dot && originalColor) {
            // Get color from category map
            const colorScheme = this.CATEGORY_COLORS[category];
            const legendColor = colorScheme
              ? (isDark ? colorScheme.dark : colorScheme.light)
              : originalColor;
            
            dot.style.background = legendColor;
            dot.style.boxShadow = `0 0 8px ${legendColor}`;
          }
        });
      }
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * MOBILE INTERACTIONS
     * ═══════════════════════════════════════════════════════════════
     */
    
    setupMobileInteractions: function() {
      // Only apply mobile interactions on smaller screens
      if (window.innerWidth > 768) {
        return;
      }
      
      const panels = document.querySelectorAll('.skills-sphere-panel');
      
      panels.forEach(panel => {
        const header = panel.querySelector('h3');
        if (header) {
          // Make header clickable
          header.style.cursor = 'pointer';
          
          header.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
          });
          
          // Start with legend collapsed on mobile
          if (panel.classList.contains('skills-sphere-legend')) {
            panel.classList.add('collapsed');
          }
        }
      });
      
      // Override selectNode to auto-expand details panel on mobile
      const originalSelectNode = this.selectNode.bind(this);
      this.selectNode = function(node) {
        originalSelectNode(node);
        
        // On mobile, expand details panel when node is selected
        if (window.innerWidth <= 768) {
          const detailsPanel = document.querySelector('.skills-sphere-details');
          if (detailsPanel) {
            detailsPanel.classList.remove('collapsed');
          }
        }
      };
      
      // Re-check on resize
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          // Remove collapsed class on desktop
          panels.forEach(panel => {
            panel.classList.remove('collapsed');
          });
        } else {
          // Re-collapse legend on mobile
          const legendPanel = document.querySelector('.skills-sphere-legend');
          if (legendPanel && !legendPanel.classList.contains('collapsed')) {
            legendPanel.classList.add('collapsed');
          }
        }
      });
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * UTILITIES
     * ═══════════════════════════════════════════════════════════════
     */
    
    /**
     * Position sprite label toward camera to prevent obstruction at steep angles
     * @param {THREE.Sprite} sprite - The text label sprite
     * @param {THREE.Mesh} node - The parent node
     * @param {number} baseOffset - Base Y-offset for label positioning
     */
    positionSpriteTowardCamera: function(sprite, node, baseOffset) {
      // Get direction from node to camera
      const toCamera = new THREE.Vector3().subVectors(
        this.camera.position,
        node.position
      ).normalize();
      
      // Calculate how "steep" the camera angle is (0 = level, 1 = looking straight down/up)
      const steepness = Math.abs(toCamera.y);
      
      // Adaptive Y-offset: More upward offset when camera is steep (prevents obstruction)
      // Extra clearance for ML node (steepness ~0.6) to prevent node from covering label
      const adaptiveYOffset = baseOffset + (steepness * 1.2);
      
      // Position label with adaptive upward offset (centered above node)
      sprite.position.copy(node.position);
      sprite.position.y += adaptiveYOffset;
    },
    
    sphericalToCartesian: function(theta, phi, radius) {
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
      };
    },
    
    /**
     * ═══════════════════════════════════════════════════════════════
     * CLEANUP (for SPA frameworks or dynamic page updates)
     * ═══════════════════════════════════════════════════════════════
     */
    
    destroy: function() {
      // Cancel animation
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      
      // Remove event listeners
      window.removeEventListener('resize', this.onWindowResize.bind(this));
      
      // Dispose Three.js objects
      this.nodes.forEach(node => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
      
      this.connections.forEach(conn => {
        if (conn.geometry) conn.geometry.dispose();
        if (conn.material) conn.material.dispose();
      });
      
      if (this.renderer) {
        this.renderer.dispose();
      }
      
      // Clear container
      if (this.containerEl) {
        this.containerEl.innerHTML = '';
      }
      
      console.log('Skills Sphere destroyed and cleaned up');
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // AUTO-INITIALIZE ON DOM READY
  // ═══════════════════════════════════════════════════════════════════
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.SkillsSphereVisualization.init();
    });
  } else {
    window.SkillsSphereVisualization.init();
  }
  
})();
