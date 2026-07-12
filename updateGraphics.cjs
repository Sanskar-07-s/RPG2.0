const fs = require('fs');
let code = fs.readFileSync('src/scenes/MatchScene.js', 'utf8');

// 1. Add Sky import
if (!code.includes("import { Sky }")) {
  code = code.replace("import { CharacterModel }", "import { CharacterModel } from '../entities/CharacterModel.js';\nimport { Sky } from 'three/addons/objects/Sky.js';");
}

// 2. Add graphics config parsing in constructor & helper function getTerrainHeight
const graphicsConfig = `
    this.brightnessVal = (setupParams.settings && setupParams.settings.brightness !== undefined) ? setupParams.settings.brightness : 1000;
    
    // Graphics Scalability Engine
    this.isMobile = window.innerWidth < 1024;
    let quality = (setupParams.settings && setupParams.settings.graphics) ? setupParams.settings.graphics : 'auto';
    if (quality === 'auto') quality = this.isMobile ? 'low' : 'high';
    this.graphicsQuality = quality;

    if (quality === 'low') {
      this.pixelRatio = 1.0;
      this.shadowMapRes = 1024;
      this.terrainSegments = 20;
      this.sceneryCount = 80;
    } else if (quality === 'medium') {
      this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      this.shadowMapRes = 2048;
      this.terrainSegments = 50;
      this.sceneryCount = 180;
    } else {
      this.pixelRatio = Math.min(window.devicePixelRatio, 2.0);
      this.shadowMapRes = 4096;
      this.terrainSegments = 80;
      this.sceneryCount = 300;
    }
`;
code = code.replace(/this\.brightnessVal = .*?;[\s\S]*?this\.isMobile = window\.innerWidth < 1024;/, graphicsConfig);

if (!code.includes("getTerrainHeight(x, z)")) {
  const getTerrainHeightFn = `
  getTerrainHeight(x, z) {
    let height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.0;
    height += Math.sin(x * 0.02) * Math.cos(z * 0.025) * 4.0;
    const distFromCenter = Math.sqrt(x*x + z*z);
    if (distFromCenter < 20) {
      height *= (distFromCenter / 20); // ease into hills from spawn
    }
    return height;
  }

  /**
   * Setup WebGL Renderer`;
  code = code.replace(/\/\*\*\s*\*\s*Setup WebGL Renderer/, getTerrainHeightFn);
}

// 3. Update initEngine()
const initEngineTarget = /this\.renderer\.setPixelRatio\(.*?\);/;
code = code.replace(initEngineTarget, `this.renderer.setPixelRatio(this.pixelRatio);`);

const fogTarget = /this\.scene\.background = new THREE\.Color\(0x7dd3fc\);\s*this\.scene\.fog = new THREE\.FogExp2\(0xa5f3fc, 0\.004\);/;
if (code.match(fogTarget)) {
    const skyCode = `
    // Realistic Sky
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);
    
    this.sunPosition = new THREE.Vector3();
    
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    this.scene.fog = new THREE.FogExp2(0xa5f3fc, 0.0035);
`;
    code = code.replace(fogTarget, skyCode);
}

// 4. Update initLights()
const shadowResTarget = /this\.sunLight\.shadow\.mapSize\.width = 2048;\s*this\.sunLight\.shadow\.mapSize\.height = 2048;/;
code = code.replace(shadowResTarget, `this.sunLight.shadow.mapSize.width = this.shadowMapRes;\n    this.sunLight.shadow.mapSize.height = this.shadowMapRes;`);

const sunUpdateTarget = /this\.scene\.add\(this\.sunLight\);/;
if (code.match(sunUpdateTarget) && !code.includes("this.sunPosition.setFromSphericalCoords")) {
    const sunUpdateCode = `this.scene.add(this.sunLight);
    
    // Sync Sky with Sun position based on brightness
    const elevation = 2 + (this.brightnessVal / 2000) * 88; // 2 to 90 degrees
    const azimuth = 180;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sunPosition.setFromSphericalCoords(1, phi, theta);
    
    this.sky.material.uniforms['sunPosition'].value.copy(this.sunPosition);
    this.sunLight.position.copy(this.sunPosition).multiplyScalar(100);
`;
    code = code.replace(sunUpdateTarget, sunUpdateCode);
}

// 5. Update initEnvironment for Rolling Terrain and Scenery Count
const terrainTarget = /const groundGeo = new THREE\.PlaneGeometry\(220, 220, 40, 40\);[\s\S]*?const colors = \[\];/;
if (code.match(terrainTarget)) {
    const terrainCode = `
    const groundGeo = new THREE.PlaneGeometry(250, 250, this.terrainSegments, this.terrainSegments);
    const count = groundGeo.attributes.position.count;
    const colors = [];
    
    // Displace vertices to create rolling hills
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      pos.setZ(i, this.getTerrainHeight(vx, vy));
    }
    groundGeo.computeVertexNormals();
`;
    code = code.replace(terrainTarget, terrainCode + '\n    const color = new THREE.Color();');
}

const sceneryCountTarget = /const billboardCount = 240;/;
code = code.replace(sceneryCountTarget, `const billboardCount = this.sceneryCount;`);

// Place scenery accurately on the terrain
const meshPosTarget = /mesh\.position\.set\(x, 0, z\);/;
code = code.replace(meshPosTarget, `mesh.position.set(x, this.getTerrainHeight(x, z), z);`);

// 6. Update updatePlayerPhysics and enemies
const playerPosUpdate = /this\.playerCharacter\.position\.copy\(this\.playerPos\);/;
code = code.replace(playerPosUpdate, `
    this.playerPos.y = this.getTerrainHeight(this.playerPos.x, this.playerPos.z);
    this.playerCharacter.position.copy(this.playerPos);`);

// Update enemy height in updateEnemies loop
const enemyMoveRegex = /enemy\.mesh\.position\.add\(moveDir\);/;
code = code.replace(enemyMoveRegex, `
          enemy.mesh.position.add(moveDir);
          enemy.mesh.position.y = this.getTerrainHeight(enemy.mesh.position.x, enemy.mesh.position.z);`);

fs.writeFileSync('src/scenes/MatchScene.js', code);
console.log('Update complete');
