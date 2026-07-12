import * as THREE from 'three';
import { CharacterModel } from '../entities/CharacterModel.js';

/**
 * MatchScene class.
 * Manages the main 3D arena gameplay loop, player movement, weapons,
 * firing AI enemies, procedurally generated wind-swaying 2D billboards,
 * and HUD overlays.
 */
export class MatchScene {
  /**
   * @param {Object} setupParams - Customizations from the lobby: playerName, selectedOutfit, selectedWeapon
   */
  constructor(setupParams) {
    this.playerName = setupParams.playerName;
    this.selectedOutfit = setupParams.selectedOutfit;
    this.selectedWeapon = setupParams.selectedWeapon;

    console.log(`Loading match for pilot: ${this.playerName}`);

    this.canvas = document.getElementById('game-canvas');
    this.isRunning = false;
    this.clock = new THREE.Clock();

    // Game stats
    this.playerHealth = 100;
    this.playerKills = 0;
    this.playerPos = new THREE.Vector3(0, 0, 0);
    this.playerVelocity = new THREE.Vector3(0, 0, 0);
    this.playerSpeed = 7.0;

    // Camera settings
    this.cameraYaw = 0;
    this.cameraPitch = -0.2;
    this.cameraDistance = 5.0;
    this.cameraHeight = 1.6;
    this.cameraMode = (setupParams.settings && setupParams.settings.perspective) ? setupParams.settings.perspective : 'third_person_behind';
    this.sensitivityMultiplier = (setupParams.settings && setupParams.settings.sensitivity !== undefined) ? setupParams.settings.sensitivity : 1.0;
    this.brightnessVal = (setupParams.settings && setupParams.settings.brightness !== undefined) ? setupParams.settings.brightness : 1000;

    // Mobile & Touch controls state
    this.isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth < 1024;
    this.joystickActive = false;
    this.joystickVector = new THREE.Vector2(0, 0); // (x: left/right, y: forward/backward)

    // Input state
    this.keys = { w: false, a: false, s: false, d: false };
    this.isPointerLocked = false;
    
    // Weapon cooldown tracking
    this.lastFireTime = 0;
    this.weaponConfigs = {
      pulse_rifle: { name: 'Tactical Rifle', damage: 15, fireRate: 0.15, range: 60, color: 0x06b6d4, spread: 0.02 },
      plasma_pistol: { name: 'Combat Pistol', damage: 25, fireRate: 0.4, range: 40, color: 0xfabb3c, spread: 0.01 },
      void_shotgun: { name: 'Combat Shotgun', damage: 10, fireRate: 0.9, range: 20, color: 0xef4444, spread: 0.08, pellets: 6 }
    };

    // Arrays to hold entities and scenery
    this.enemies = [];
    this.scenery = [];
    this.tracers = [];
    this.particles = [];

    // Bind UI elements
    this.blocker = document.getElementById('blocker');
    this.hudHealthFill = document.getElementById('hud-health-fill');
    this.hudHealthText = document.getElementById('hud-health-text');
    this.hudWeaponName = document.getElementById('hud-weapon-name');
    this.hudKills = document.getElementById('hud-score-kills');
    this.hudLogs = document.getElementById('hud-logs-container');
    this.damageFlash = document.getElementById('damage-flash');

    this.initEngine();
    this.initLights();
    this.initEnvironment();
    this.spawnEntities();
    this.initControls();
    
    // Set initial camera mode
    this.setCameraMode(this.cameraMode);

    // Initialize HUD display
    this.updateHUD();

    // Start render loop
    this.start();
  }

  /**
   * Setup WebGL Renderer, Scene, Camera, and Fog.
   */
  initEngine() {
    this.scene = new THREE.Scene();
    
    // Soft sky-blue fog and background
    this.scene.background = new THREE.Color(0x7dd3fc); 
    this.scene.fog = new THREE.FogExp2(0xa5f3fc, 0.004); 

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  initLights() {
    const mult = this.brightnessVal / 1000;

    this.ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.8 * mult);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 3.0 * mult);
    this.sunLight.position.set(40, 80, 40);
    this.sunLight.castShadow = true;
    
    // Setup clean shadows for large map
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  /**
   * Create procedural canvas textures for wind-swaying 2D billboards.
   */
  createSceneryTextures() {
    // 1. Broadleaf tree texture
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = 256;
    leafCanvas.height = 512;
    let ctx = leafCanvas.getContext('2d');
    
    // Trunk
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(110, 512);
    ctx.quadraticCurveTo(120, 320, 115, 220);
    ctx.lineTo(141, 220);
    ctx.quadraticCurveTo(136, 320, 146, 512);
    ctx.closePath();
    ctx.fill();

    // Dark foliage background
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.arc(128, 180, 100, 0, Math.PI * 2);
    ctx.fill();

    // Main foliage
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(100, 160, 75, 0, Math.PI * 2);
    ctx.arc(156, 160, 75, 0, Math.PI * 2);
    ctx.arc(128, 120, 85, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(90, 130, 55, 0, Math.PI * 2);
    ctx.arc(166, 130, 55, 0, Math.PI * 2);
    ctx.arc(128, 90, 65, 0, Math.PI * 2);
    ctx.fill();

    // Extra bright highlights
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.arc(120, 70, 40, 0, Math.PI * 2);
    ctx.fill();

    const leafyTreeTex = new THREE.CanvasTexture(leafCanvas);

    // 2. Conifer Pine tree texture
    const pineCanvas = document.createElement('canvas');
    pineCanvas.width = 256;
    pineCanvas.height = 512;
    ctx = pineCanvas.getContext('2d');
    
    // Trunk
    ctx.fillStyle = '#2d1a10';
    ctx.fillRect(116, 360, 24, 152);

    // Pine tiers (Triangles)
    ctx.fillStyle = '#0f3817'; // Bottom tier
    ctx.beginPath();
    ctx.moveTo(20, 365);
    ctx.lineTo(236, 365);
    ctx.lineTo(128, 230);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#165022'; // Middle tier
    ctx.beginPath();
    ctx.moveTo(40, 260);
    ctx.lineTo(216, 260);
    ctx.lineTo(128, 130);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1b742b'; // Top tier
    ctx.beginPath();
    ctx.moveTo(60, 155);
    ctx.lineTo(196, 155);
    ctx.lineTo(128, 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2cb849'; // Highlights
    ctx.beginPath();
    ctx.moveTo(110, 110);
    ctx.lineTo(146, 110);
    ctx.lineTo(128, 30);
    ctx.closePath();
    ctx.fill();

    const pineTreeTex = new THREE.CanvasTexture(pineCanvas);

    // 3. Mossy Stone texture
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 256;
    stoneCanvas.height = 256;
    ctx = stoneCanvas.getContext('2d');

    // Stone base
    ctx.fillStyle = '#334155'; // Slate dark gray
    ctx.beginPath();
    ctx.moveTo(30, 220);
    ctx.lineTo(226, 220);
    ctx.lineTo(200, 90);
    ctx.lineTo(135, 40);
    ctx.lineTo(65, 50);
    ctx.lineTo(30, 110);
    ctx.closePath();
    ctx.fill();

    // Facet shade 1
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(135, 40);
    ctx.lineTo(200, 90);
    ctx.lineTo(226, 220);
    ctx.lineTo(130, 220);
    ctx.lineTo(95, 120);
    ctx.closePath();
    ctx.fill();

    // Facet highlight
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(65, 50);
    ctx.lineTo(135, 40);
    ctx.lineTo(95, 120);
    ctx.lineTo(30, 110);
    ctx.closePath();
    ctx.fill();

    // Moss overlay on top
    ctx.fillStyle = '#3f6212';
    ctx.beginPath();
    ctx.ellipse(115, 52, 45, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.ellipse(105, 50, 30, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    const stoneTex = new THREE.CanvasTexture(stoneCanvas);

    return { leafyTreeTex, pineTreeTex, stoneTex };
  }

  /**
   * Build large grassy arena and populate with 2D wind-swaying billboards.
   */
  initEnvironment() {
    // 1. Terrain Ground plane scaled to 200x200
    const groundGeo = new THREE.PlaneGeometry(220, 220, 40, 40);
    const count = groundGeo.attributes.position.count;
    const colors = [];
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Dark army tactical ground: dark greens and charcoal earth tones
      const mix = Math.random();
      color.setHex(0x1e251c); // Dark olive drab
      color.lerp(new THREE.Color(0x13171f), mix * 0.55); // Mix with dark slate grey
      colors.push(color.r, color.g, color.b);
    }
    
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.05
    });
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Build Billboard Scenery
    const textures = this.createSceneryTextures();

    // Define 2D Billboard Materials
    const leafyMat = new THREE.MeshStandardMaterial({
      map: textures.leafyTreeTex,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.9
    });

    const pineMat = new THREE.MeshStandardMaterial({
      map: textures.pineTreeTex,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.9
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      map: textures.stoneTex,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.8
    });

    // Populate scenery points procedurally across the 200x200 map
    // Keep spawn zone at (0, 0) clean (within 12 units)
    const billboardCount = 240;
    for (let i = 0; i < billboardCount; i++) {
      let x = (Math.random() - 0.5) * 190;
      let z = (Math.random() - 0.5) * 190;
      
      // Prevent spawning near player start center
      const distToCenter = Math.sqrt(x * x + z * z);
      if (distToCenter < 12) {
        // Push outwards
        x += (x >= 0 ? 12 : -12);
        z += (z >= 0 ? 12 : -12);
      }

      const randType = Math.random();
      let mesh, width, height, radius, isTree = false;

      if (randType < 0.4) {
        // Leafy Broadleaf tree
        width = 4.5 + Math.random() * 2.0;
        height = 9.0 + Math.random() * 4.0;
        radius = 0.6;
        isTree = true;
        
        // Pivot from bottom
        const geo = new THREE.PlaneGeometry(width, height);
        geo.translate(0, height / 2, 0);
        mesh = new THREE.Mesh(geo, leafyMat);
      } else if (randType < 0.75) {
        // Pine Conifer tree
        width = 3.5 + Math.random() * 1.5;
        height = 8.0 + Math.random() * 3.0;
        radius = 0.5;
        isTree = true;

        const geo = new THREE.PlaneGeometry(width, height);
        geo.translate(0, height / 2, 0);
        mesh = new THREE.Mesh(geo, pineMat);
      } else {
        // Stone
        width = 2.4 + Math.random() * 1.6;
        height = 2.4 + Math.random() * 1.6;
        radius = 0.9;
        isTree = false;

        const geo = new THREE.PlaneGeometry(width, height);
        geo.translate(0, height / 2, 0);
        mesh = new THREE.Mesh(geo, stoneMat);
      }

      mesh.position.set(x, 0, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.scene.add(mesh);
      this.scenery.push({
        mesh: mesh,
        x: x,
        z: z,
        radius: radius,
        height: height,
        isTree: isTree,
        swayPhase: Math.random() * Math.PI * 2
      });
    }

    // Add boundaries (invisible walls or stones at border)
    // Red marker light on sun for arena feel
    const boundaryGeo = new THREE.BoxGeometry(220, 8, 220);
    const boundaryWire = new THREE.BoxHelper(new THREE.Mesh(boundaryGeo), 0xf97316);
    boundaryWire.position.y = 4;
    this.scene.add(boundaryWire);
  }

  /**
   * Spawn player and patrol enemies.
   */
  spawnEntities() {
    // 1. Spawning Player
    let outfitColor = 0xc5a880; 
    if (this.selectedOutfit === 'orange') {
      outfitColor = 0x3e5634; // Green
    } else if (this.selectedOutfit === 'green') {
      outfitColor = 0x1a1c1e; // Black
    }

    this.playerCharacter = new CharacterModel({
      decalColor: outfitColor,
      weaponId: this.selectedWeapon,
      isEnemy: false
    });
    this.playerCharacter.position.set(0, 0, 0);
    
    this.playerCharacter.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(this.playerCharacter);

    // 2. Spawning Hostile Patrol Soldiers (spread across 200x200 map)
    const enemySpawns = [
      { x: -25, z: -15, patrolRadius: 8, speed: 1.0 },
      { x: 30, z: -35, patrolRadius: 10, speed: 1.2 },
      { x: -45, z: 25, patrolRadius: 12, speed: 0.9 },
      { x: 40, z: 45, patrolRadius: 9, speed: 1.1 },
      { x: 10, z: -60, patrolRadius: 14, speed: 1.3 },
      { x: -70, z: -40, patrolRadius: 15, speed: 0.8 },
      { x: -60, z: 60, patrolRadius: 10, speed: 1.1 },
      { x: 80, z: -20, patrolRadius: 11, speed: 1.2 },
      { x: 75, z: 75, patrolRadius: 13, speed: 0.9 }
    ];

    enemySpawns.forEach((spawn, idx) => {
      const enemyMesh = new CharacterModel({
        isEnemy: true,
        weaponId: 'plasma_pistol'
      });

      enemyMesh.position.set(spawn.x, 0, spawn.z);
      enemyMesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(enemyMesh);
      this.enemies.push({
        id: idx,
        mesh: enemyMesh,
        health: 50,
        maxHealth: 50,
        patrolCenter: new THREE.Vector2(spawn.x, spawn.z),
        patrolRadius: spawn.patrolRadius,
        patrolSpeed: spawn.speed,
        phase: Math.random() * Math.PI * 2,
        lastFireTime: 0,
        fireInterval: 1.6 + Math.random() * 0.8,
        state: 'patrol' // 'patrol' or 'combat'
      });
    });
  }

  /**
   * Initialize keyboard/mouse controls and Pointer Lock API.
   */
  initControls() {
    // Show blocker initially to prompt user click (unless on mobile)
    if (this.isMobile) {
      const touchHud = document.getElementById('mobile-touch-hud');
      if (touchHud) touchHud.style.display = 'block';
      if (this.blocker) this.blocker.style.display = 'none';
    } else {
      if (this.blocker) {
        this.blocker.style.display = 'flex';
      }
    }

    // Key listeners (WASD + Arrows)
    const onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': this.keys.w = true; break;
        case 'KeyA':
        case 'ArrowLeft': this.keys.a = true; break;
        case 'KeyS':
        case 'ArrowDown': this.keys.s = true; break;
        case 'KeyD':
        case 'ArrowRight': this.keys.d = true; break;
        case 'KeyV': this.cycleCameraMode(); break; // Key V cycles POV modes
        case 'Digit1': this.switchWeapon('pulse_rifle'); break;
        case 'Digit2': this.switchWeapon('plasma_pistol'); break;
        case 'Digit3': this.switchWeapon('void_shotgun'); break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp': this.keys.w = false; break;
        case 'KeyA':
        case 'ArrowLeft': this.keys.a = false; break;
        case 'KeyS':
        case 'ArrowDown': this.keys.s = false; break;
        case 'KeyD':
        case 'ArrowRight': this.keys.d = false; break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Get Settings Modal reference
    const settingsModal = document.getElementById('settings-modal');

    // Pointer lock binding (bind to both blocker and canvas to catch click events)
    const requestLock = () => {
      if (this.isMobile) return;
      // Avoid locking cursor if settings menu overlay is displayed
      const isSettingsOpen = settingsModal && settingsModal.style.display === 'flex';
      if (!this.isPointerLocked && !isSettingsOpen) {
        this.canvas.requestPointerLock();
      }
    };

    this.canvas.addEventListener('click', requestLock);
    if (this.blocker) {
      this.blocker.addEventListener('click', requestLock);
    }

    document.addEventListener('pointerlockchange', () => {
      if (this.isMobile) return;
      if (document.pointerLockElement === this.canvas) {
        this.isPointerLocked = true;
        this.blocker.style.display = 'none';
      } else {
        this.isPointerLocked = false;
        // Only show pause blocker if settings modal is NOT open
        const isSettingsOpen = settingsModal && settingsModal.style.display === 'flex';
        if (!isSettingsOpen) {
          this.blocker.style.display = 'flex';
        } else {
          this.blocker.style.display = 'none';
        }
        // Reset key states
        this.keys.w = this.keys.a = this.keys.s = this.keys.d = false;
      }
    });

    // Mouse movement -> Camera angles (respect sensitivity setting)
    document.addEventListener('mousemove', (e) => {
      if (this.isMobile || !this.isPointerLocked) return;

      const sensitivity = 0.0022 * this.sensitivityMultiplier;
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch -= e.movementY * sensitivity;

      // Lock vertical look angle to prevent flipping
      this.cameraPitch = Math.max(-1.1, Math.min(0.35, this.cameraPitch));
    });

    // Mouse click -> Firing
    document.addEventListener('mousedown', (e) => {
      if (this.isMobile || !this.isPointerLocked) return;
      if (e.button === 0) {
        this.fireActiveWeapon();
      }
    });

    // HUD POV Button click listener
    const povBtn = document.getElementById('hud-pov-btn');
    if (povBtn) {
      povBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleCameraMode();
      });
    }

    // HUD Settings Gear Button click listener
    const settingsBtn = document.getElementById('hud-settings-btn');
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal.style.display = 'flex';
        this.blocker.style.display = 'none'; // hide general pause menu
        document.exitPointerLock();
      });
    }

    // Connect in-game settings modal controls
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    if (settingsCloseBtn && settingsModal) {
      settingsCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal.style.display = 'none';
        // Request pointer lock back on closing settings in-match
        this.canvas.requestPointerLock();
      });
    }

    const sensitivityInput = document.getElementById('setting-sensitivity');
    const sensitivityVal = document.getElementById('setting-sensitivity-val');
    if (sensitivityInput && sensitivityVal) {
      // Initialize slider visual matching the setting
      sensitivityInput.value = this.sensitivityMultiplier;
      sensitivityVal.innerText = this.sensitivityMultiplier.toFixed(1);

      sensitivityInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(1);
        sensitivityVal.innerText = val;
        this.sensitivityMultiplier = parseFloat(val);
      });
    }

    const brightnessInput = document.getElementById('setting-brightness');
    const brightnessValText = document.getElementById('setting-brightness-val');
    if (brightnessInput && brightnessValText) {
      brightnessInput.value = this.brightnessVal;
      brightnessValText.innerText = this.brightnessVal;

      brightnessInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        brightnessValText.innerText = val;
        this.brightnessVal = val;
        
        // Dynamically scale light intensities in real-time
        const mult = val / 1000;
        if (this.ambientLight) this.ambientLight.intensity = 1.8 * mult;
        if (this.sunLight) this.sunLight.intensity = 3.0 * mult;
      });
    }

    const perspectiveOptions = document.querySelectorAll('.perspective-option');
    perspectiveOptions.forEach((option) => {
      option.addEventListener('click', () => {
        perspectiveOptions.forEach((opt) => opt.classList.remove('active'));
        option.classList.add('active');

        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          this.setCameraMode(radio.value);
        }
      });
    });

    // Mobile touch control listeners
    if (this.isMobile) {
      const joystickContainer = document.getElementById('touch-joystick-container');
      const joystickThumb = document.getElementById('joystick-thumb');

      if (joystickContainer && joystickThumb) {
        let joystickTouchId = null;
        let startX = 0;
        let startY = 0;
        const maxDist = 50; // Max drag radius in pixels

        joystickContainer.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (joystickTouchId !== null) return;

          const touch = e.changedTouches[0];
          joystickTouchId = touch.identifier;
          this.joystickActive = true;

          const rect = joystickContainer.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        });

        joystickContainer.addEventListener('touchmove', (e) => {
          e.preventDefault();
          if (joystickTouchId === null) return;

          let activeTouch = null;
          for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
              activeTouch = e.touches[i];
              break;
            }
          }

          if (!activeTouch) return;

          const dx = activeTouch.clientX - startX;
          const dy = activeTouch.clientY - startY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let finalX = dx;
          let finalY = dy;
          if (dist > maxDist) {
            finalX = (dx / dist) * maxDist;
            finalY = (dy / dist) * maxDist;
          }

          joystickThumb.style.transform = `translate(${finalX}px, ${finalY}px)`;

          this.joystickVector.x = finalX / maxDist;
          this.joystickVector.y = finalY / maxDist; // Positive goes down/backwards, negative goes up/forwards
        });

        const resetJoystick = (e) => {
          if (joystickTouchId === null) return;

          let touchEnded = false;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
              touchEnded = true;
              break;
            }
          }

          if (touchEnded) {
            joystickTouchId = null;
            this.joystickActive = false;
            this.joystickVector.set(0, 0);
            joystickThumb.style.transform = 'translate(0px, 0px)';
          }
        };

        joystickContainer.addEventListener('touchend', resetJoystick);
        joystickContainer.addEventListener('touchcancel', resetJoystick);
      }

      const lookZone = document.getElementById('touch-look-zone');
      if (lookZone) {
        let lookTouchId = null;
        let lastTouchX = 0;
        let lastTouchY = 0;

        lookZone.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (lookTouchId !== null) return;

          const touch = e.changedTouches[0];
          lookTouchId = touch.identifier;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
        });

        lookZone.addEventListener('touchmove', (e) => {
          e.preventDefault();
          if (lookTouchId === null) return;

          let activeTouch = null;
          for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === lookTouchId) {
              activeTouch = e.touches[i];
              break;
            }
          }

          if (!activeTouch) return;

          const dx = activeTouch.clientX - lastTouchX;
          const dy = activeTouch.clientY - lastTouchY;

          const touchSensitivity = 0.0035 * this.sensitivityMultiplier;
          this.cameraYaw -= dx * touchSensitivity;
          this.cameraPitch -= dy * touchSensitivity;
          this.cameraPitch = Math.max(-1.1, Math.min(0.35, this.cameraPitch));

          lastTouchX = activeTouch.clientX;
          lastTouchY = activeTouch.clientY;
        });

        const resetLook = (e) => {
          if (lookTouchId === null) return;

          let touchEnded = false;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchId) {
              touchEnded = true;
              break;
            }
          }

          if (touchEnded) {
            lookTouchId = null;
          }
        };

        lookZone.addEventListener('touchend', resetLook);
        lookZone.addEventListener('touchcancel', resetLook);
      }
    }
  }

  /**
   * Switch equipped weapon dynamically.
   */
  switchWeapon(weaponId) {
    if (!this.weaponConfigs[weaponId]) return;
    this.selectedWeapon = weaponId;
    
    // Equip on 3D CharacterModel
    if (this.playerCharacter) {
      this.playerCharacter.equipWeapon(weaponId);
    }
    
    this.updateHUD();
    this.addKillLog(`Switched to: ${this.weaponConfigs[weaponId].name}`);
  }

  /**
   * Trigger firing sequence. Raycasts from screen center.
   */
  fireActiveWeapon() {
    const time = this.clock.getElapsedTime();
    const config = this.weaponConfigs[this.selectedWeapon];

    if (time - this.lastFireTime < config.fireRate) return;
    this.lastFireTime = time;

    // Estimate muzzle world position
    const muzzle = new THREE.Vector3(0.25, 0.8, 0.6)
      .applyQuaternion(this.playerCharacter.quaternion)
      .add(this.playerPos);

    // Shooting Direction: from camera pointing forward
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // Spawn pellets for shotgun, single tracer otherwise
    const pelletCount = config.pellets || 1;
    for (let p = 0; p < pelletCount; p++) {
      const finalDir = camDir.clone();
      if (pelletCount > 1 || config.spread > 0) {
        // Apply random bullet spread
        finalDir.x += (Math.random() - 0.5) * config.spread;
        finalDir.y += (Math.random() - 0.5) * config.spread;
        finalDir.z += (Math.random() - 0.5) * config.spread;
        finalDir.normalize();
      }

      // Perform Raycast
      const ray = new THREE.Raycaster(this.camera.position, finalDir, 0.1, config.range);
      const intersects = ray.intersectObjects(this.scene.children, true);

      let hitPoint = this.camera.position.clone().add(finalDir.clone().multiplyScalar(config.range));
      let hitObj = null;

      // Filter intersects to ignore player character meshes
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        let isPlayerMesh = false;
        
        // Traverse upwards to verify it's not the player character
        obj.traverseAncestors((ancestor) => {
          if (ancestor === this.playerCharacter) isPlayerMesh = true;
        });

        if (!isPlayerMesh) {
          hitPoint = intersects[i].point;
          hitObj = obj;
          break;
        }
      }

      // 1. Spawn Tracer Line
      this.createTracer(muzzle, hitPoint, config.color);

      // 2. Hit registration
      if (hitObj) {
        this.spawnSparks(hitPoint, config.color);

        // Check if hit an enemy character
        let hitEnemy = null;
        this.enemies.forEach((enemy) => {
          hitObj.traverseAncestors((ancestor) => {
            if (ancestor === enemy.mesh) {
              hitEnemy = enemy;
            }
          });
        });

        if (hitEnemy) {
          this.damageEnemy(hitEnemy, config.damage);
          // Only show hit impact for first pellet
          if (p === 0) break;
        }
      }
    }

    // 3. Spawn Muzzle Flash
    this.createMuzzleFlash(muzzle);
  }

  /**
   * Create neon tracer beam mesh.
   */
  createTracer(start, end, colorHex) {
    const distance = start.distanceTo(end);
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, distance, 5);
    // Align cylinder direction
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0, distance / 2);

    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start);
    mesh.lookAt(end);

    this.scene.add(mesh);
    this.tracers.push({
      mesh: mesh,
      spawnTime: this.clock.getElapsedTime(),
      duration: 0.1
    });
  }

  /**
   * Create temporary glowing muzzle flash light sphere.
   */
  createMuzzleFlash(position) {
    const flashGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(flashGeo, flashMat);
    mesh.position.copy(position);
    this.scene.add(mesh);

    // Muzzle light
    const light = new THREE.PointLight(0xffaa44, 4, 6);
    light.position.copy(position);
    this.scene.add(light);

    this.tracers.push({
      mesh: mesh,
      light: light,
      spawnTime: this.clock.getElapsedTime(),
      duration: 0.05
    });
  }

  /**
   * Spawn spark particles on impact.
   */
  spawnSparks(position, colorHex) {
    const particleCount = 6 + Math.floor(Math.random() * 6);
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 6
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: velocity,
        spawnTime: this.clock.getElapsedTime(),
        duration: 0.35 + Math.random() * 0.15
      });
    }
  }

  /**
   * Apply damage to hostile NPC droids.
   */
  damageEnemy(enemy, amount) {
    enemy.health -= amount;
    
    // Spawn damage sparks
    this.spawnSparks(enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff7700);

    // Trigger combat state for this enemy
    enemy.state = 'combat';

    if (enemy.health <= 0) {
      this.eliminateEnemy(enemy);
    }
  }

  /**
   * Enemy death, respawn, and points registration.
   */
  eliminateEnemy(enemy) {
    // 1. Explosion effect
    this.spawnSparks(enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xff2200);
    this.spawnSparks(enemy.mesh.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffaa00);

    // 2. Score increment
    this.playerKills++;
    this.updateHUD();

    // Kill log notification
    this.addKillLog(`ELIMINATED Rebel Soldier #${enemy.id + 101}`);

    // 3. Respawn far away
    const rx = (Math.random() - 0.5) * 180;
    const rz = (Math.random() - 0.5) * 180;
    enemy.mesh.position.set(rx, 0, rz);
    enemy.patrolCenter.set(rx, rz);
    enemy.health = enemy.maxHealth;
    enemy.state = 'patrol';
  }

  /**
   * Apply damage to Player, flash red screen.
   */
  damagePlayer(amount) {
    if (this.playerHealth <= 0) return;

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.updateHUD();

    // Trigger red screen vignette flash
    if (this.damageFlash) {
      this.damageFlash.classList.add('flash');
      setTimeout(() => this.damageFlash.classList.remove('flash'), 150);
    }

    if (this.playerHealth <= 0) {
      this.handlePlayerDeath();
    }
  }

  /**
   * Reset game on player death.
   */
  handlePlayerDeath() {
    this.addKillLog(`CRITICAL DAMAGE: YOU ELIMINATED!`);
    
    // Lock movements
    this.keys.w = this.keys.a = this.keys.s = this.keys.d = false;

    // Show Died overlay text on pause screen
    const instructionsDiv = document.getElementById('instructions');
    if (instructionsDiv) {
      instructionsDiv.innerHTML = `
        <h2 style="color: #ef4444;">MISSION FAILED</h2>
        <p>Your armor integrity was compromised.</p>
        <p>Restarting combat operations in 3 seconds...</p>
      `;
    }

    document.exitPointerLock();

    setTimeout(() => {
      // Restore defaults
      this.playerHealth = 100;
      this.playerKills = 0;
      this.playerPos.set(0, 0, 0);
      this.playerCharacter.position.set(0, 0, 0);
      this.updateHUD();

      // Restore instructions box HTML
      if (instructionsDiv) {
        instructionsDiv.innerHTML = `
          <h2>GAME PAUSED</h2>
          <p>Click screen to resume combat operations.</p>
          <p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> — Move</p>
          <p><kbd>MOUSE</kbd> — Aim & Look around</p>
          <p><kbd>LEFT CLICK</kbd> — Fire Primary Weapon</p>
          <p><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> — Switch Weapon Loadout</p>
        `;
      }
    }, 3000);
  }

  /**
   * Synchronize HUD text variables.
   */
  updateHUD() {
    // 1. Health
    if (this.hudHealthFill) {
      this.hudHealthFill.style.width = `${this.playerHealth}%`;
    }
    if (this.hudHealthText) {
      this.hudHealthText.innerText = `${this.playerHealth} / 100`;
    }

    // 2. Active Weapon
    if (this.hudWeaponName) {
      const config = this.weaponConfigs[this.selectedWeapon];
      this.hudWeaponName.innerText = config ? config.name : 'Unknown';
    }

    // 3. Kills
    if (this.hudKills) {
      this.hudKills.innerText = this.playerKills < 10 ? `0${this.playerKills}` : `${this.playerKills}`;
    }
  }

  /**
   * Add text notification to the kill logs panel.
   */
  addKillLog(message) {
    if (!this.hudLogs) return;

    const log = document.createElement('div');
    log.className = 'kill-log';
    log.innerText = message;
    this.hudLogs.appendChild(log);

    // Limit log stack length
    if (this.hudLogs.children.length > 4) {
      this.hudLogs.removeChild(this.hudLogs.firstChild);
    }

    // Fade out log after 4s
    setTimeout(() => {
      if (this.hudLogs.contains(log)) {
        log.style.opacity = '0';
        log.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          if (this.hudLogs.contains(log)) this.hudLogs.removeChild(log);
        }, 500);
      }
    }, 3500);
  }

  /**
   * Window resize viewport calculations.
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Start main rendering frames.
   */
  start() {
    this.isRunning = true;
    this.clock.getDelta(); // Reset clock delta
    this.animate();
  }

  /**
   * Physics updates: move player and check collisions with boundaries/obstacles.
   */
  updatePlayerPhysics(delta) {
    if ((!this.isPointerLocked && !this.isMobile) || this.playerHealth <= 0) return;

    // Movement Vectors relative to camera direction
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    
    const moveDir = new THREE.Vector3();
    let moveSpeedFactor = 1.0;

    if (this.isMobile && this.joystickActive) {
      moveDir.addScaledVector(forward, -this.joystickVector.y);
      moveDir.addScaledVector(right, this.joystickVector.x);
      
      const magnitude = this.joystickVector.length();
      moveSpeedFactor = Math.min(magnitude, 1.0);
    } else {
      if (this.keys.w) moveDir.add(forward);
      if (this.keys.s) moveDir.add(forward.clone().negate());
      if (this.keys.d) moveDir.add(right);
      if (this.keys.a) moveDir.add(right.clone().negate());
    }

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      
      // Update target player velocities
      this.playerVelocity.copy(moveDir.multiplyScalar(this.playerSpeed * moveSpeedFactor));
      this.playerPos.addScaledVector(this.playerVelocity, delta);
      
      // Face movement direction ONLY when in front-facing camera POV
      if (this.cameraMode === 'third_person_front') {
        const targetAngle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
        this.playerCharacter.rotation.y = targetAngle;
      }
    } else {
      this.playerVelocity.set(0, 0, 0);
    }

    // Limit position inside arena bounds [-100, 100]
    const arenaBoundary = 98.0;
    this.playerPos.x = Math.max(-arenaBoundary, Math.min(arenaBoundary, this.playerPos.x));
    this.playerPos.z = Math.max(-arenaBoundary, Math.min(arenaBoundary, this.playerPos.z));

    // Collision check: player vs scenery cylinder boundaries
    const playerRadius = 0.45;
    this.scenery.forEach((item) => {
      const dx = this.playerPos.x - item.mesh.position.x;
      const dz = this.playerPos.z - item.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = item.radius + playerRadius;
      
      if (dist < minDist) {
        // Push player outside scenery cylinder
        const overlap = minDist - dist;
        const nx = dx / (dist || 1);
        const nz = dz / (dist || 1);
        this.playerPos.x += nx * overlap;
        this.playerPos.z += nz * overlap;
      }
    });

    // Update 3D player mesh coordinates
    this.playerCharacter.position.copy(this.playerPos);
    
    // Log player position to console each frame temporarily
    console.log("Player Position - X:", this.playerPos.x.toFixed(2), "Z:", this.playerPos.z.toFixed(2));
    
    // Play leg swings if moving
    this.playerCharacter.updateAnimation(this.clock.getElapsedTime(), isMoving);
  }

  /**
   * Cycle camera perspectives (TPV Behind -> FPV -> TPV Front)
   */
  cycleCameraMode() {
    if (this.cameraMode === 'third_person_behind') {
      this.setCameraMode('first_person');
    } else if (this.cameraMode === 'first_person') {
      this.setCameraMode('third_person_front');
    } else {
      this.setCameraMode('third_person_behind');
    }
  }

  /**
   * Sets camera POV mode and triggers layout / visibility settings updates.
   * @param {string} mode - 'first_person', 'third_person_behind', or 'third_person_front'
   */
  setCameraMode(mode) {
    this.cameraMode = mode;
    
    // Update HUD POV toggle button label
    const povBtn = document.getElementById('hud-pov-btn');
    if (povBtn) {
      let label = '3RD OTS';
      if (mode === 'first_person') label = '1ST PERSON';
      if (mode === 'third_person_front') label = '3RD FRONT';
      povBtn.innerText = `🎥 ${label}`;
    }

    // Sync radio choices in settings modal
    const radios = document.querySelectorAll('input[name="perspective-select"]');
    radios.forEach((r) => {
      const parentLabel = r.closest('.perspective-option');
      if (r.value === mode) {
        r.checked = true;
        if (parentLabel) parentLabel.classList.add('active');
      } else {
        r.checked = false;
        if (parentLabel) parentLabel.classList.remove('active');
      }
    });

    this.addKillLog(`VIEW MODE: ${mode.replace(/_/g, ' ').toUpperCase()}`);
  }

  /**
   * Align Camera relative to Player depending on POV mode.
   */
  updateCamera() {
    if (this.playerHealth <= 0) return;

    // Toggle player character head group rendering to avoid FPV camera clipping
    if (this.cameraMode === 'first_person') {
      this.playerCharacter.setHeadVisibility(false);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';
    } else if (this.cameraMode === 'third_person_behind') {
      this.playerCharacter.setHeadVisibility(true);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'block';
    } else if (this.cameraMode === 'third_person_front') {
      this.playerCharacter.setHeadVisibility(true);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = 'none'; // Hide crosshair in front selfie mode
    }

    if (this.cameraMode === 'first_person') {
      // 1. FIRST-PERSON PERSPECTIVE: Camera placed at head level, slightly forward
      const headPos = this.playerPos.clone().add(new THREE.Vector3(0, 1.45, 0.08));
      this.camera.position.copy(headPos);

      // Rotate camera to match mouse Yaw & Pitch
      const targetLook = new THREE.Vector3(
        -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch),
        -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
      );
      this.camera.lookAt(headPos.clone().add(targetLook));
      
      // Keep player body aligned to look Yaw direction
      this.playerCharacter.rotation.y = this.cameraYaw;
      
    } else if (this.cameraMode === 'third_person_behind') {
      // 2. THIRD-PERSON BEHIND (Over-The-Shoulder OTS)
      const targetOffset = new THREE.Vector3(
        Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        Math.sin(-this.cameraPitch) + 0.3, // elevated slightly
        Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
      ).multiplyScalar(this.cameraDistance);

      const cameraTargetPos = this.playerPos.clone()
        .add(new THREE.Vector3(0, this.cameraHeight, 0))
        .add(targetOffset);

      // Apply standard over-the-shoulder right offset
      const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      cameraTargetPos.addScaledVector(rightVec, 0.6);

      // Smooth camera follow lerp
      this.camera.position.lerp(cameraTargetPos, 0.15);

      // Look at player chest/head point + aim target
      const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
      this.camera.lookAt(lookTarget);

      // Keep player body aligned to aim direction Y-Yaw
      this.playerCharacter.rotation.y = this.cameraYaw;

    } else if (this.cameraMode === 'third_person_front') {
      // 3. THIRD-PERSON FRONT (Selfie view looking back at the pilot face)
      const targetOffset = new THREE.Vector3(
        Math.sin(this.cameraYaw + Math.PI) * Math.cos(this.cameraPitch),
        Math.sin(-this.cameraPitch) + 0.2, // slightly elevated
        Math.cos(this.cameraYaw + Math.PI) * Math.cos(this.cameraPitch)
      ).multiplyScalar(this.cameraDistance * 0.7); // closer zoom

      const cameraTargetPos = this.playerPos.clone()
        .add(new THREE.Vector3(0, this.cameraHeight, 0))
        .add(targetOffset);

      // Smooth camera tracking
      this.camera.position.lerp(cameraTargetPos, 0.15);

      // Look back at the player face level
      const lookTarget = this.playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
      this.camera.lookAt(lookTarget);
    }
  }



  /**
   * AI patrol navigation + firing at player.
   */
  updateEnemies(time, delta) {
    this.enemies.forEach((enemy) => {
      const { mesh, patrolCenter, patrolRadius, patrolSpeed, phase } = enemy;

      const distToPlayer = mesh.position.distanceTo(this.playerPos);

      if (this.playerHealth > 0 && distToPlayer < 24) {
        // COMBAT MODE: turn to face player, fire lasers
        enemy.state = 'combat';

        // Rotate towards player
        const dx = this.playerPos.x - mesh.position.x;
        const dz = this.playerPos.z - mesh.position.z;
        const facingAngle = Math.atan2(dx, dz);
        
        // Lerp rotation towards player
        mesh.rotation.y = facingAngle;

        // Animate idle breathing
        mesh.updateAnimation(time, false);

        // Firing rate trigger
        if (time - enemy.lastFireTime > enemy.fireInterval) {
          enemy.lastFireTime = time;

          // Enemy gun muzzle location
          const enemyMuzzle = new THREE.Vector3(0.25, 0.8, 0.6)
            .applyQuaternion(mesh.quaternion)
            .add(mesh.position);

          // Raycast / line of sight check
          const ray = new THREE.Raycaster(enemyMuzzle, new THREE.Vector3(dx, 0, dz).normalize(), 0.1, 26);
          const intersects = ray.intersectObjects(this.scene.children, true);
          let blocked = false;

          for (let i = 0; i < intersects.length; i++) {
            const obj = intersects[i].object;
            // Ignore enemy's own mesh
            let isOwnMesh = false;
            obj.traverseAncestors((anc) => {
              if (anc === mesh) isOwnMesh = true;
            });

            if (!isOwnMesh) {
              // If it hits obstacle before player, it's blocked
              let isPlayer = false;
              obj.traverseAncestors((anc) => {
                if (anc === this.playerCharacter) isPlayer = true;
              });

              if (!isPlayer) {
                blocked = true;
              }
              break;
            }
          }

          if (!blocked) {
            // Shoot red tracer laser towards player
            const targetPoint = this.playerPos.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.4,
              0.6 + (Math.random() - 0.5) * 0.5, // aim for torso
              (Math.random() - 0.5) * 0.4
            ));

            this.createTracer(enemyMuzzle, targetPoint, 0xef4444); // red laser
            this.spawnSparks(targetPoint, 0xef4444);
            
            // Damage player
            this.damagePlayer(8);
          }
        }
      } else {
        // PATROL MODE: circle navigation
        enemy.state = 'patrol';

        const angle = time * patrolSpeed + phase;
        const nextX = patrolCenter.x + Math.sin(angle) * patrolRadius;
        const nextZ = patrolCenter.y + Math.cos(angle) * patrolRadius;

        const dx = nextX - mesh.position.x;
        const dz = nextZ - mesh.position.z;

        mesh.position.set(nextX, 0, nextZ);

        const facingAngle = Math.atan2(dx, dz);
        mesh.rotation.y = facingAngle;

        // Run walk limb animations
        mesh.updateAnimation(time, true);
      }
    });
  }

  /**
   * Animate active tracers, spark particles, and sway 2D trees.
   */
  animateVFX(time, delta) {
    // 1. Tracers fading
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      const elapsed = time - tracer.spawnTime;
      if (elapsed > tracer.duration) {
        this.scene.remove(tracer.mesh);
        if (tracer.mesh.geometry) tracer.mesh.geometry.dispose();
        if (tracer.mesh.material) tracer.mesh.material.dispose();
        
        if (tracer.light) this.scene.remove(tracer.light);
        this.tracers.splice(i, 1);
      } else {
        // Fade opacity
        if (tracer.mesh.material) {
          tracer.mesh.material.opacity = 1.0 - (elapsed / tracer.duration);
        }
      }
    }

    // 2. Sparks update (velocity, gravity, fade)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const elapsed = time - p.spawnTime;
      if (elapsed > p.duration) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        // Apply physics
        p.velocity.y -= 9.8 * delta; // gravity
        p.mesh.position.addScaledVector(p.velocity, delta);
        // Scale down
        const scale = 1.0 - (elapsed / p.duration);
        p.mesh.scale.set(scale, scale, scale);
      }
    }

    // 3. 2D Billboards wind sway + facing camera Y axis
    this.scenery.forEach((item) => {
      const { mesh, isTree, swayPhase } = item;

      // Face the camera around Y axis so they are billboards
      mesh.lookAt(this.camera.position.x, mesh.position.y, this.camera.position.z);

      if (isTree) {
        // Wind-swaying skew/rotation around local Z axis
        const windSpeed = 2.4;
        const windSway = Math.sin(time * windSpeed + swayPhase) * 0.045; // 0.045 rad sway
        mesh.rotation.z = windSway;
      }
    });
  }

  /**
   * Main render frame step.
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1); // cap delta to avoid physics explosions
    const time = this.clock.getElapsedTime();

    this.updatePlayerPhysics(delta);
    this.updateCamera();
    this.updateEnemies(time, delta);
    this.animateVFX(time, delta);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Release contexts, keys, and events.
   */
  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this.resizeHandler);
    
    // Dispose resources
    this.scene.traverse((object) => {
      if (!object.isMesh) return;
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }
    console.log("MatchScene successfully cleaned.");
  }
}
