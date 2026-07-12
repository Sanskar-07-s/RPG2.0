import * as THREE from 'three';

/**
 * CharacterModel class.
 * Represents a solid humanoid soldier (Free Fire / PUBG Mobile style)
 * constructed out of textured/matte standard geometries (helmet, vest, pockets, cargo pants, combat boots).
 * Includes procedural animations for walk cycles and idle breathing.
 */
export class CharacterModel extends THREE.Group {
  /**
   * @param {Object} config - Configuration options
   * @param {number} config.decalColor - Selected outfit pants/helmet color (hex)
   * @param {string} config.weaponId - Selected weapon key
   * @param {boolean} config.isEnemy - If true, spawns as a hostile soldier (red gear)
   */
  constructor(config = {}) {
    super();

    this.decalColor = config.decalColor !== undefined ? config.decalColor : 0xc5a880; // Desert Tan default
    this.weaponId = config.weaponId || 'pulse_rifle';
    this.isEnemy = config.isEnemy || false;

    // 1. Set up tactical color palettes
    this.initMaterials();

    // 2. Build the soldier model hierarchy
    this.buildSoldier();

    // 3. Setup weapon meshes
    this.initWeaponTemplates();
    this.equipWeapon(this.weaponId);
  }

  /**
   * Initialize realistic matte materials with proper roughness/metalness (no emissive neon).
   */
  initMaterials() {
    // Skin tone
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xe6b0aa, // Natural peachy-tan skin
      roughness: 0.65,
      metalness: 0.05
    });

    // Joints & dark straps (Black tactical straps/gloves)
    this.tacticalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2421, // Charcoal tactical black
      roughness: 0.9,
      metalness: 0.1
    });

    // Boots (Rugged dark brown/black leather)
    this.bootMat = new THREE.MeshStandardMaterial({
      color: 0x18100c, // Dark brown
      roughness: 0.85,
      metalness: 0.05
    });

    // Set colors depending on whether this is an enemy or customized player
    if (this.isEnemy) {
      // Enemy: Hostile rebel uniform (Rebel Red and Urban Black pants)
      this.shirtMat = new THREE.MeshStandardMaterial({
        color: 0x8b0000, // Crimson red
        roughness: 0.8,
        metalness: 0.1
      });
      this.pantsMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, // Pitch black pants
        roughness: 0.85,
        metalness: 0.05
      });
      this.vestMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2b, // Dark steel grey tactical vest
        roughness: 0.9,
        metalness: 0.15
      });
      this.helmetMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2b,
        roughness: 0.7,
        metalness: 0.3
      });
    } else {
      // Player: Outfit-swappable soldier (Shirt/Vest remains static, Pants/Helmet swap based on color choice)
      // Shirt: Under shirt is basic olive green or tan
      this.shirtMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Slate tactical blue shirt
        roughness: 0.85,
        metalness: 0.05
      });
      
      // Vest: Plate carrier is tactical khaki/tan
      this.vestMat = new THREE.MeshStandardMaterial({
        color: 0x5c4f3c, // Dark khaki vest
        roughness: 0.9,
        metalness: 0.1
      });

      // Helmet and Pants change dynamically (Tan/Green/Black)
      this.pantsMat = new THREE.MeshStandardMaterial({
        color: this.decalColor,
        roughness: 0.85,
        metalness: 0.05
      });

      this.helmetMat = new THREE.MeshStandardMaterial({
        color: this.decalColor,
        roughness: 0.7,
        metalness: 0.25
      });
    }
  }

  /**
   * Assembles a proportioned human soldier silhouette out of smooth primitives.
   */
  buildSoldier() {
    this.root = new THREE.Group();
    this.add(this.root);

    // 1. Hips (Belt)
    this.hip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.24), this.tacticalMat);
    this.hip.position.y = 0.52;
    this.root.add(this.hip);

    // 2. Torso (Shirt + Tactical Vest)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.58, 0);
    this.root.add(this.torsoGroup);

    // Shirt base torso
    this.shirtMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.26), this.shirtMat);
    this.shirtMesh.position.y = 0.28;
    this.torsoGroup.add(this.shirtMesh);

    // Outer Tactical Plate Vest
    this.vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.3), this.vestMat);
    this.vestMesh.position.set(0, 0.28, 0);
    this.torsoGroup.add(this.vestMesh);

    // Vest Details: Ammo Pouches/Pockets
    const pocketGeo = new THREE.BoxGeometry(0.12, 0.14, 0.04);
    const pouchL = new THREE.Mesh(pocketGeo, this.tacticalMat);
    pouchL.position.set(-0.11, 0.2, 0.16);
    this.torsoGroup.add(pouchL);

    const pouchR = new THREE.Mesh(pocketGeo, this.tacticalMat);
    pouchR.position.set(0.11, 0.2, 0.16);
    this.torsoGroup.add(pouchR);

    // 3. Head & Helmet (Posed on neck)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.56, 0);
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 8), this.skinMat);
    neck.position.y = 0.04;
    this.headGroup.add(neck);

    // Face / Head
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), this.skinMat);
    face.position.y = 0.18;
    face.scale.set(1, 1.15, 1); // Oval face
    this.headGroup.add(face);

    // Helmet (Dome + strap details)
    const helmetGeo = new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
    this.helmetMesh = new THREE.Mesh(helmetGeo, this.helmetMat);
    this.helmetMesh.position.set(0, 0.2, 0);
    this.helmetMesh.rotation.x = -0.1; // Tilted slightly forward
    this.headGroup.add(this.helmetMesh);

    // Helmet visor rim
    const visorRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.32), this.helmetMat);
    visorRim.position.set(0, 0.22, 0.02);
    this.headGroup.add(visorRim);

    // 4. Left Arm (Shoulder joint -> upper arm -> glove hand)
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.28, 0.5, 0);
    this.torsoGroup.add(this.leftShoulder);

    const jointL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.tacticalMat);
    this.leftShoulder.add(jointL);

    const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), this.shirtMat);
    upperArmL.position.y = -0.18;
    this.leftShoulder.add(upperArmL);

    // Arm glove sleeve
    const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), this.skinMat);
    forearmL.position.y = -0.4;
    this.leftShoulder.add(forearmL);

    // Hand/Glove
    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), this.tacticalMat);
    handL.position.y = -0.5;
    this.leftShoulder.add(handL);

    // 5. Right Arm (Weapon holding posed)
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.28, 0.5, 0);
    this.torsoGroup.add(this.rightShoulder);

    const jointR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.tacticalMat);
    this.rightShoulder.add(jointR);

    const upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), this.shirtMat);
    upperArmR.position.y = -0.18;
    this.rightShoulder.add(upperArmR);

    // Forearm
    const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), this.skinMat);
    forearmR.position.y = -0.4;
    this.rightShoulder.add(forearmR);

    // Weapon hand mount
    this.weaponMount = new THREE.Group();
    this.weaponMount.position.set(0, -0.5, 0.06);
    this.rightShoulder.add(this.weaponMount);

    // Pose right arm forward to grip weapons
    this.rightShoulder.rotation.x = -Math.PI / 4.5;
    this.rightShoulder.rotation.y = -Math.PI / 20;

    // 6. Left Leg (Thigh -> Cargo pocket -> lower leg -> boots)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.44, 0);
    this.root.add(this.leftLeg);

    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.34, 0.15), this.pantsMat);
    thighL.position.y = -0.17;
    this.leftLeg.add(thighL);

    // Cargo pocket detail
    const cargoPocketL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.11), this.pantsMat);
    cargoPocketL.position.set(-0.07, -0.18, 0);
    this.leftLeg.add(cargoPocketL);

    const lowerLegL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.13), this.pantsMat);
    lowerLegL.position.y = -0.45;
    this.leftLeg.add(lowerLegL);

    // Boot
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.22), this.bootMat);
    bootL.position.set(0, -0.62, 0.03);
    this.leftLeg.add(bootL);

    // 7. Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.44, 0);
    this.root.add(this.rightLeg);

    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.34, 0.15), this.pantsMat);
    thighR.position.y = -0.17;
    this.rightLeg.add(thighR);

    // Holster detail on right thigh (tactical leather side pocket)
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.1), this.tacticalMat);
    holster.position.set(0.07, -0.18, 0.02);
    this.rightLeg.add(holster);

    const lowerLegR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.3, 0.13), this.pantsMat);
    lowerLegR.position.y = -0.45;
    this.rightLeg.add(lowerLegR);

    // Boot
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.22), this.bootMat);
    bootR.position.set(0, -0.62, 0.03);
    this.rightLeg.add(bootR);
  }

  /**
   * Pre-builds tactical weapon templates in standard materials.
   */
  initWeaponTemplates() {
    this.weaponTemplates = {};

    // 1. Tactical Rifle (Black with wood stocks / steel highlights)
    const rifle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.85 }));
    rifle.add(body);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x482d1c, roughness: 0.9 })); // Wood stock
    stock.position.set(0, -0.04, -0.3);
    rifle.add(stock);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, 0.4);
    rifle.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.08), new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.9 }));
    mag.position.set(0, -0.1, 0.08);
    mag.rotation.x = -0.2;
    rifle.add(mag);
    this.weaponTemplates['pulse_rifle'] = rifle;

    // 2. Tactical Pistol (Matte black pistol)
    const pistol = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.24), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
    pistol.add(pBody);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    grip.position.set(0, -0.07, -0.06);
    grip.rotation.x = -0.3;
    pistol.add(grip);
    this.weaponTemplates['plasma_pistol'] = pistol;

    // 3. Combat Shotgun (Heavy pump shotgun)
    const shotgun = new THREE.Group();
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }));
    shotgun.add(sBody);
    const barrelS = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
    barrelS.rotation.x = Math.PI / 2;
    barrelS.position.set(0, 0.02, 0.38);
    shotgun.add(barrelS);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }));
    slide.position.set(0, -0.02, 0.2);
    shotgun.add(slide);
    this.weaponTemplates['void_shotgun'] = shotgun;
  }

  /**
   * Swaps the pants and helmet color schemes.
   * @param {number} hexColor - The Hex color to set pants and helmet
   */
  setOutfitColor(hexColor) {
    this.decalColor = hexColor;
    
    // Update mesh material colors
    if (this.pantsMat) {
      this.pantsMat.color.setHex(hexColor);
    }
    if (this.helmetMat) {
      this.helmetMat.color.setHex(hexColor);
    }
  }

  /**
   * Toggles visibility of head meshes (head, helmet, visor) for FPV camera clipping.
   * @param {boolean} visible - Whether the head should render
   */
  setHeadVisibility(visible) {
    if (this.headGroup) {
      this.headGroup.visible = visible;
    }
  }

  /**
   * Equips weapon model onto hand mount point.
   * @param {string} weaponId - The weapon identifier
   */
  equipWeapon(weaponId) {
    this.weaponId = weaponId;

    // Clear previous weapon
    while (this.weaponMount.children.length > 0) {
      this.weaponMount.remove(this.weaponMount.children[0]);
    }

    // Attach cloned template instance
    const template = this.weaponTemplates[weaponId];
    if (template) {
      const activeWeapon = template.clone();
      this.weaponMount.add(activeWeapon);
    }
  }

  /**
   * Animation update method called inside render loops.
   * Runs walking limb swing and idle breathing adjustments.
   * @param {number} time - Elapsed time in seconds
   * @param {boolean} isMoving - Whether walking swings should animate
   */
  updateAnimation(time, isMoving = false) {
    // 1. Idle Breathing/Bobbing Animation (gentle bob, head breathing look)
    const breatheSpeed = 1.8;
    const breatheBob = Math.sin(time * breatheSpeed) * 0.015;
    this.torsoGroup.position.y = 0.58 + breatheBob;
    this.headGroup.rotation.x = Math.sin(time * breatheSpeed * 0.5) * 0.02;

    if (isMoving) {
      // 2. Walking Cycle (Limbs swinging in opposition)
      const walkSpeed = 7.5;
      const swingAngle = Math.sin(time * walkSpeed) * 0.52; // swing amplitude

      // Left leg swings forward/back
      this.leftLeg.rotation.x = swingAngle;
      // Right leg swings opposite
      this.rightLeg.rotation.x = -swingAngle;

      // Left arm swings opposite to left leg (swings with right leg)
      this.leftShoulder.rotation.x = -swingAngle * 0.65;
      
      // Right arm holds weapon, so we swing it gently
      this.rightShoulder.rotation.x = -Math.PI / 4.5 + Math.sin(time * walkSpeed) * 0.08;

      // Dynamic hips bobbing (drops a bit as legs cross)
      const crossingBob = Math.abs(Math.sin(time * walkSpeed)) * 0.04;
      this.root.position.y = -crossingBob;

      // Hips rotate slightly with legs
      this.hip.rotation.y = swingAngle * 0.12;
    } else {
      // Return limbs to idle poses slowly (damping/lerp)
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftShoulder.rotation.x = 0;
      this.rightShoulder.rotation.x = -Math.PI / 4.5;
      this.root.position.y = 0;
      this.hip.rotation.y = 0;
    }
  }
}
