import * as THREE from 'three';
import { CharacterModel } from '../entities/CharacterModel.js';

/**
 * LobbyPreviewScene class.
 * Manages the mini 3D rendering pipeline for the rotating character model preview.
 * Styled as a warm, industrial military hangar.
 */
export class LobbyPreviewScene {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas to render onto
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.isRunning = false;
    this.clock = new THREE.Clock();

    // Default configuration (Desert Tan)
    this.activeColorHex = 0xc5a880;
    this.activeWeaponId = 'pulse_rifle';

    this.initEngine();
    this.initLights();
    this.initEnvironment();
    this.initCharacter();

    // Start render loop
    this.start();
  }

  /**
   * Setup Three.js scene, camera, and renderer.
   */
  initEngine() {
    this.scene = new THREE.Scene();
    
    // Transparent background so the HTML CSS gradient shines through
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    const width = this.canvas.clientWidth || window.innerWidth * 0.55;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      100
    );
    this.camera.position.set(0, 1.5, 3.2);
    this.camera.lookAt(0, 0.9, 0);

    // Watch resize
    this.resizeHandler = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Setup tactical military hangar lighting (warm key light, soft white fills).
   */
  initLights() {
    // Ambient filling
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    // Direct sun key light (Warm amber daylight)
    this.keyLight = new THREE.DirectionalLight(0xfff3e0, 1.1);
    this.keyLight.position.set(3, 4, 4);
    this.scene.add(this.keyLight);

    // Back-left rim lighting (Cool steel blue highlight)
    this.rimLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    this.rimLight.position.set(-3, 2, -3);
    this.scene.add(this.rimLight);
  }

  /**
   * Builds a concrete/steel military turntable platform.
   */
  initEnvironment() {
    this.turntableGroup = new THREE.Group();
    this.scene.add(this.turntableGroup);

    // 1. Pedestal/Platform (Solid concrete platter, no glowing decals)
    const pedestalGeo = new THREE.CylinderGeometry(0.9, 0.96, 0.12, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Steel slate gray
      roughness: 0.85,
      metalness: 0.2
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.06;
    this.turntableGroup.add(pedestal);

    // Pedestal dark iron rim trim
    const ringGeo = new THREE.RingGeometry(0.86, 0.9, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.4
    });
    const pedestalRing = new THREE.Mesh(ringGeo, ringMat);
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.y = 0.121;
    this.turntableGroup.add(pedestalRing);
  }

  /**
   * Instantiates the humanoid CharacterModel and places it on the turntable.
   */
  initCharacter() {
    this.character = new CharacterModel({
      decalColor: this.activeColorHex,
      weaponId: this.activeWeaponId,
      isEnemy: false
    });
    this.character.position.y = 0.12; // Stand on pedestal
    this.turntableGroup.add(this.character);
  }

  /**
   * Updates character outfit colors dynamically.
   * Map HTML data color attributes to realistic tactical color values.
   * @param {string} colorId - Color scheme string ('cyan', 'orange', 'green')
   */
  setOutfitColor(colorId) {
    let hex = 0xc5a880; // Desert Tan
    
    if (colorId === 'orange') {
      hex = 0x3e5634; // Jungle Green
    } else if (colorId === 'green') {
      hex = 0x1a1c1e; // Urban Black
    }

    this.activeColorHex = hex;

    // Apply color modifications to CharacterModel
    if (this.character) {
      this.character.setOutfitColor(hex);
    }
  }

  /**
   * Equips weapon model onto character.
   * @param {string} weaponId - The weapon identifier
   */
  equipWeapon(weaponId) {
    this.activeWeaponId = weaponId;
    if (this.character) {
      this.character.equipWeapon(weaponId);
    }
  }

  /**
   * Handles resizing of the lobby preview canvas container.
   */
  onResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /**
   * Start rendering loops.
   */
  start() {
    this.isRunning = true;
    this.clock.getDelta(); // Reset clock delta
    this.animate();
  }

  /**
   * Tick animation updates.
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // 1. Rotate platform
    if (this.turntableGroup) {
      this.turntableGroup.rotation.y += 0.006;
    }

    // 2. Play idle breathing animation on CharacterModel
    if (this.character) {
      this.character.updateAnimation(elapsedTime, false);
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Releases GPU meshes, materials, geometries, and canvas events.
   */
  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this.resizeHandler);

    // Recursively clean up Three.js objects
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

    this.renderer.dispose();
    console.log("Lobby Preview Scene successfully disposed.");
  }

  /**
   * Adjusts light intensities on the character turntable preview.
   * @param {number} val - Brightness value from 10 to 2000
   */
  setBrightness(val) {
    const mult = val / 1000;
    if (this.ambientLight) this.ambientLight.intensity = 0.45 * mult;
    if (this.keyLight) this.keyLight.intensity = 1.1 * mult;
    if (this.rimLight) this.rimLight.intensity = 0.65 * mult;
  }
}
