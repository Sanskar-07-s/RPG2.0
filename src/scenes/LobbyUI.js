import { LobbyPreviewScene } from './LobbyPreviewScene.js';

/**
 * LobbyUI controller.
 * Manages the HTML forms, selection button menus, input validation,
 * sub-page navigation, and handles the life-cycle of the 3D turntable LobbyPreviewScene.
 * Integrates the tactical Settings Modal for Sensitivity and Perspective.
 */
export class LobbyUI {
  /**
   * @param {Function} onStartMatchCallback - Event handler called when starting the match
   */
  constructor(onStartMatchCallback) {
    this.onStartMatch = onStartMatchCallback;

    // Default Lobby Selection State
    this.state = {
      playerName: 'Recruit_07',
      selectedOutfit: 'cyan',
      selectedWeapon: 'pulse_rifle',
      settings: {
        sensitivity: 1.0,
        perspective: 'third_person_behind',
        brightness: 1000,
        graphics: 'auto'
      }
    };

    // Bind UI element references
    this.lobbyScreen = document.getElementById('lobby-screen');
    this.usernameInput = document.getElementById('username-input');
    this.startBtn = document.getElementById('start-match-btn');
    this.previewCanvas = document.getElementById('lobby-preview-canvas');

    // Sub-page panels
    this.mainMenuPanel = document.getElementById('main-menu-panel');
    this.clothPanel = document.getElementById('cloth-customization-panel');
    this.weaponsPanel = document.getElementById('weapons-customization-panel');

    // Navigation buttons
    this.gotoClothBtn = document.getElementById('btn-goto-cloth');
    this.gotoGunsBtn = document.getElementById('btn-goto-guns');
    this.backClothBtn = document.getElementById('btn-back-cloth');
    this.backGunsBtn = document.getElementById('btn-back-guns');

    // Settings Modal references
    this.settingsModal = document.getElementById('settings-modal');
    this.lobbySettingsBtn = document.getElementById('lobby-settings-btn');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');
    this.sensitivityInput = document.getElementById('setting-sensitivity');
    this.sensitivityVal = document.getElementById('setting-sensitivity-val');
    this.perspectiveOptions = document.querySelectorAll('.perspective-option');
    this.graphicsOptions = document.querySelectorAll('.graphics-option');

    // 1. Initialize the 3D turntable scene
    this.previewScene = new LobbyPreviewScene(this.previewCanvas);

    // 2. Bind DOM Listeners
    this.initListeners();

    // 3. Initial validation run
    this.validateForm();
  }

  /**
   * Bind event listeners to color switches, loadout buttons, sub-page navigation, settings, and the name input.
   */
  initListeners() {
    // Sub-page navigation triggers
    if (this.gotoClothBtn && this.clothPanel && this.mainMenuPanel) {
      this.gotoClothBtn.addEventListener('click', () => {
        this.mainMenuPanel.classList.add('hidden');
        this.clothPanel.classList.remove('hidden');
      });
    }

    if (this.gotoGunsBtn && this.weaponsPanel && this.mainMenuPanel) {
      this.gotoGunsBtn.addEventListener('click', () => {
        this.mainMenuPanel.classList.add('hidden');
        this.weaponsPanel.classList.remove('hidden');
      });
    }

    if (this.backClothBtn && this.clothPanel && this.mainMenuPanel) {
      this.backClothBtn.addEventListener('click', () => {
        this.clothPanel.classList.add('hidden');
        this.mainMenuPanel.classList.remove('hidden');
      });
    }

    if (this.backGunsBtn && this.weaponsPanel && this.mainMenuPanel) {
      this.backGunsBtn.addEventListener('click', () => {
        this.weaponsPanel.classList.add('hidden');
        this.mainMenuPanel.classList.remove('hidden');
      });
    }

    // Lobby Settings Modal trigger
    if (this.lobbySettingsBtn && this.settingsModal) {
      this.lobbySettingsBtn.addEventListener('click', () => {
        this.settingsModal.style.display = 'flex';
      });
    }

    if (this.settingsCloseBtn && this.settingsModal) {
      this.settingsCloseBtn.addEventListener('click', () => {
        this.settingsModal.style.display = 'none';
      });
    }

    // Settings: Mouse sensitivity slider listener
    if (this.sensitivityInput && this.sensitivityVal) {
      this.sensitivityInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(1);
        this.sensitivityVal.innerText = val;
        this.state.settings.sensitivity = parseFloat(val);
      });
    }

    // Settings: Perspective toggle buttons
    this.perspectiveOptions.forEach((option) => {
      option.addEventListener('click', () => {
        this.perspectiveOptions.forEach((opt) => opt.classList.remove('active'));
        option.classList.add('active');

        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          this.state.settings.perspective = radio.value;
        }
      });
    });

    // Settings: Brightness slider listener
    const brightnessInput = document.getElementById('setting-brightness');
    const brightnessVal = document.getElementById('setting-brightness-val');
    if (brightnessInput && brightnessVal) {
      brightnessInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        brightnessVal.innerText = val;
        this.state.settings.brightness = val;
        // Apply brightness to rotating operator turntable live
        if (this.previewScene) {
          this.previewScene.setBrightness(val);
        }
      });
    }

    // Settings: Graphics Quality toggle buttons
    if (this.graphicsOptions) {
      this.graphicsOptions.forEach((option) => {
        option.addEventListener('click', () => {
          this.graphicsOptions.forEach((opt) => opt.classList.remove('active'));
          option.classList.add('active');

          const radio = option.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            this.state.settings.graphics = radio.value;
          }
        });
      });
    }

    // Player Name Input validation
    this.usernameInput.addEventListener('input', (e) => {
      this.state.playerName = e.target.value.trim();
      this.validateForm();
    });

    // Weapon Loadout Selection
    const weaponItems = document.querySelectorAll('[data-weapon]');
    weaponItems.forEach((item) => {
      item.addEventListener('click', () => {
        weaponItems.forEach((w) => w.classList.remove('active'));
        item.classList.add('active');

        const weaponId = item.getAttribute('data-weapon');
        this.state.selectedWeapon = weaponId;
        this.previewScene.equipWeapon(weaponId);
      });
    });

    // Armor Color Customization Selection (matches the cloth-card items)
    const colorSwatches = document.querySelectorAll('[data-color]');
    colorSwatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');

        const colorId = swatch.getAttribute('data-color');
        this.state.selectedOutfit = colorId;
        this.previewScene.setOutfitColor(colorId);
      });
    });

    // Start button trigger
    this.startBtn.addEventListener('click', () => this.handleStart());
  }

  /**
   * Enables the start match button only if the pilot signature field has content.
   */
  validateForm() {
    const isValid = this.state.playerName.length > 0;
    this.startBtn.disabled = !isValid;
  }

  /**
   * Fades out UI overlays, disposes rendering loops, and passes state onto main.js.
   */
  handleStart() {
    // Lock inputs
    this.usernameInput.disabled = true;
    this.startBtn.disabled = true;
    this.startBtn.innerHTML = 'DEPLOYING...';

    // Begin fade transition animation
    this.lobbyScreen.classList.add('fade-out');

    // Wait for the css animation timer before starting the game
    setTimeout(() => {
      // Hide completely
      this.lobbyScreen.style.display = 'none';

      // Release preview WebGL rendering contexts
      if (this.previewScene) {
        this.previewScene.destroy();
        this.previewScene = null;
      }

      // Fire callback containing choices (now including settings)
      if (this.onStartMatch) {
        this.onStartMatch(this.state);
      }
    }, 800);
  }
}
