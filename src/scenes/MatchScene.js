import * as THREE from 'three';
import { CharacterModel } from '../entities/CharacterModel.js';

// --- Procedural Terrain & Scenery Helpers ---

function getTerrainHeight(x, z) {
  const h1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5; // Large hills
  const h2 = Math.sin(x * 0.15 + 1.0) * Math.sin(z * 0.12) * 0.8; // Medium bumps
  const h3 = Math.cos(x * 0.3) * Math.cos(z * 0.3) * 0.2; // Fine detail
  
  // Flatten spawn area (radius 15)
  const dist = Math.sqrt(x * x + z * z);
  if (dist < 15) {
    const t = dist / 15;
    return (h1 + h2 + h3) * (t * t * (3 - 2 * t));
  }
  return h1 + h2 + h3;
}

function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base soil color
  ctx.fillStyle = '#1b2416';
  ctx.fillRect(0, 0, 512, 512);

  // Draw noise patches
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 2 + Math.random() * 8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    
    const type = Math.random();
    if (type < 0.4) {
      grad.addColorStop(0, 'rgba(43, 62, 33, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type < 0.8) {
      grad.addColorStop(0, 'rgba(27, 36, 22, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      grad.addColorStop(0, 'rgba(67, 94, 52, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw fine grass blades
  ctx.strokeStyle = 'rgba(74, 107, 57, 0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 3 + Math.random() * 6;
    const angle = (Math.random() - 0.5) * 0.4 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Highlight grass blades
  ctx.strokeStyle = 'rgba(101, 142, 79, 0.35)';
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 2 + Math.random() * 4;
    const angle = (Math.random() - 0.5) * 0.3 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

function create3DBroadleafTree(width, height, radius) {
  const group = new THREE.Group();
  
  const trunkHeight = height * 0.35;
  const trunkGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 1.0, trunkHeight, 8);
  trunkGeo.translate(0, trunkHeight / 2, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1e5631,
    roughness: 0.95,
    flatShading: true
  });
  
  const f1Geo = new THREE.DodecahedronGeometry(radius * 3.5, 1);
  const f1 = new THREE.Mesh(f1Geo, foliageMat);
  f1.position.set(0, trunkHeight + radius * 1.5, 0);
  f1.castShadow = true;
  f1.receiveShadow = true;
  group.add(f1);

  const f2Geo = new THREE.DodecahedronGeometry(radius * 2.6, 1);
  const f2 = new THREE.Mesh(f2Geo, foliageMat);
  f2.position.set(radius * 1.2, trunkHeight + radius * 1.0, radius * 0.5);
  f2.castShadow = true;
  f2.receiveShadow = true;
  group.add(f2);

  const f3Geo = new THREE.DodecahedronGeometry(radius * 2.6, 1);
  const f3 = new THREE.Mesh(f3Geo, foliageMat);
  f3.position.set(-radius * 1.2, trunkHeight + radius * 1.0, -radius * 0.5);
  f3.castShadow = true;
  f3.receiveShadow = true;
  group.add(f3);
  
  return group;
}

function create3DPineTree(width, height, radius) {
  const group = new THREE.Group();
  
  const trunkHeight = height * 0.25;
  const trunkGeo = new THREE.CylinderGeometry(radius * 0.5, radius * 0.8, trunkHeight, 8);
  trunkGeo.translate(0, trunkHeight / 2, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2f22,
    roughness: 0.9,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x0f3817,
    roughness: 0.95,
    flatShading: true
  });
  
  const cone1Geo = new THREE.ConeGeometry(radius * 3.6, height * 0.45, 6);
  const cone1 = new THREE.Mesh(cone1Geo, foliageMat);
  cone1.position.set(0, trunkHeight + height * 0.2, 0);
  cone1.castShadow = true;
  cone1.receiveShadow = true;
  group.add(cone1);
  
  const cone2Geo = new THREE.ConeGeometry(radius * 2.8, height * 0.36, 6);
  const cone2 = new THREE.Mesh(cone2Geo, foliageMat);
  cone2.position.set(0, trunkHeight + height * 0.42, 0);
  cone2.castShadow = true;
  cone2.receiveShadow = true;
  group.add(cone2);
  
  const cone3Geo = new THREE.ConeGeometry(radius * 2.0, height * 0.28, 6);
  const cone3 = new THREE.Mesh(cone3Geo, foliageMat);
  cone3.position.set(0, trunkHeight + height * 0.6, 0);
  cone3.castShadow = true;
  cone3.receiveShadow = true;
  group.add(cone3);
  
  return group;
}

function create3DStone(width, height, radius) {
  const stoneGeo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = stoneGeo.attributes.position;
  
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    
    pos.setX(i, vx + (Math.sin(vx * 10) * 0.08) * radius);
    pos.setY(i, vy + (Math.cos(vy * 10) * 0.08) * radius);
    pos.setZ(i, vz + (Math.sin(vz * 10) * 0.08) * radius);
  }
  
  stoneGeo.translate(0, radius * 0.8, 0);
  stoneGeo.computeVertexNormals();
  
  const stoneColors = [];
  const tempNormal = new THREE.Vector3();
  const normalAttr = stoneGeo.attributes.normal;
  
  for (let i = 0; i < pos.count; i++) {
    tempNormal.fromBufferAttribute(normalAttr, i);
    const color = new THREE.Color(0x334155);
    if (tempNormal.y > 0.4) {
      color.lerp(new THREE.Color(0x3f6212), (tempNormal.y - 0.4) * 1.2);
    }
    stoneColors.push(color.r, color.g, color.b);
  }
  stoneGeo.setAttribute('color', new THREE.Float32BufferAttribute(stoneColors, 3));
  
  const stoneMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true
  });
  
  const mesh = new THREE.Mesh(stoneGeo, stoneMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  const sx = 0.9 + Math.random() * 0.4;
  const sy = 0.7 + Math.random() * 0.5;
  const sz = 0.9 + Math.random() * 0.4;
  mesh.scale.set(sx, sy, sz);
  
  return mesh;
}

function create3DGrassClump() {
  const group = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c0f,
    side: THREE.DoubleSide,
    roughness: 0.9,
    flatShading: true
  });
  
  const geo = new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.4 + Math.random() * 0.4);
  geo.translate(0, geo.parameters.height / 2, 0);
  
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(geo, grassMat);
    mesh.rotation.y = (i * Math.PI) / 3 + (Math.random() - 0.5) * 0.2;
    mesh.rotation.x = (Math.random() - 0.5) * 0.15;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}


// ─────────────────────────────────────────────
//  PROCEDURAL BUILDING GENERATORS
// ─────────────────────────────────────────────

/** Shared helper – weathered material */
function _mat(hex, rough = 0.92, metal = 0.0, flat = true) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, flatShading: flat });
}

/** Small thatch-roofed hut */
function createHut() {
  const g = new THREE.Group();
  const wallGeo = new THREE.BoxGeometry(5, 3.5, 5);
  const wall = new THREE.Mesh(wallGeo, _mat(0x8b7355));
  wall.position.y = 1.75;
  wall.castShadow = true; wall.receiveShadow = true;
  g.add(wall);
  const roofGeo = new THREE.ConeGeometry(4.5, 2.5, 4);
  const roof = new THREE.Mesh(roofGeo, _mat(0x4a3728));
  roof.position.y = 3.5 + 1.25;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.15);
  const door = new THREE.Mesh(doorGeo, _mat(0x1a0f07));
  door.position.set(0, 1.1, 2.57);
  g.add(door);
  const winGeo = new THREE.BoxGeometry(0.9, 0.8, 0.12);
  const winMat = _mat(0x0e1a2a, 0.6, 0.3);
  const win1 = new THREE.Mesh(winGeo, winMat);
  win1.position.set(-1.6, 1.8, 2.57);
  g.add(win1);
  const win2 = new THREE.Mesh(winGeo, winMat);
  win2.position.set(1.6, 1.8, 2.57);
  g.add(win2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), _mat(0x5a5247));
    stone.position.set(Math.cos(a) * 3.1, 0.25, Math.sin(a) * 3.1);
    stone.rotation.y = a;
    g.add(stone);
  }
  return g;
}

/** Ruined abandoned house */
function createAbandonedHouse() {
  const g = new THREE.Group();
  const wallMat = _mat(0x6e6050);
  const roofMat = _mat(0x3b2d22);
  const crackedMat = _mat(0x594f43, 0.98);
  const body = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 8), wallMat);
  body.position.y = 2.5;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const stub = new THREE.Mesh(new THREE.BoxGeometry(4, 2.8, 6), crackedMat);
  stub.position.set(-7, 1.4, -1);
  stub.castShadow = true; stub.receiveShadow = true;
  g.add(stub);
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 9), roofMat);
  roofL.position.set(-2.5, 5.7, 0);
  roofL.rotation.z = 0.5;
  roofL.castShadow = true;
  g.add(roofL);
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 9), roofMat);
  roofR.position.set(2.5, 5.7, 0);
  roofR.rotation.z = -0.5;
  roofR.castShadow = true;
  g.add(roofR);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), _mat(0x4a3f35));
  chimney.position.set(3.5, 6.5, -2);
  g.add(chimney);
  const wm = _mat(0x0a0f14, 0.5, 0.2);
  [[0, 3.2, 4.05], [-2.8, 3.2, 4.05], [2.8, 2.0, 4.05]].forEach(([x, y, z]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), wm);
    win.position.set(x, y, z);
    g.add(win);
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.15), _mat(0x160c06));
  door.position.set(0, 1.5, 4.07);
  g.add(door);
  for (let i = 0; i < 10; i++) {
    const s = 0.4 + Math.random() * 0.8;
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.6, s), _mat(0x5c5449));
    chunk.position.set(-7 + (Math.random() - 0.5) * 5, 0.2, (Math.random() - 0.5) * 6);
    chunk.rotation.y = Math.random() * Math.PI;
    g.add(chunk);
  }
  return g;
}

/** Abandoned multi-room school building */
function createAbandonedSchool() {
  const g = new THREE.Group();
  const wallMat = _mat(0x7a7a60, 0.95);
  const roofMat = _mat(0x3e3a32, 0.97);
  const wm = _mat(0x0d151e, 0.5, 0.15);
  const main = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 10), wallMat);
  main.position.y = 3;
  main.castShadow = true; main.receiveShadow = true;
  g.add(main);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(24.5, 0.5, 10.5), roofMat);
  roof.position.y = 6.25;
  roof.castShadow = true;
  g.add(roof);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 10), wallMat);
  wing.position.set(16, 2.5, 0);
  wing.castShadow = true; wing.receiveShadow = true;
  g.add(wing);
  const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 10.5), roofMat);
  wingRoof.position.set(16, 5.2, 0);
  g.add(wingRoof);
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 2; row++) {
      const wx = -9 + col * 4;
      const wy = 1.4 + row * 2.8;
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.15), wm);
      win.position.set(wx, wy, 5.08);
      g.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 1.7, 0.08), _mat(0x4f4a3d));
      frame.position.set(wx, wy, 5.05);
      g.add(frame);
    }
  }
  const door1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 0.15), _mat(0x1a1208));
  door1.position.set(-0.8, 1.75, 5.09);
  g.add(door1);
  const door2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 0.15), _mat(0x1a1208));
  door2.position.set(0.8, 1.75, 5.09);
  door2.rotation.y = 0.35;
  g.add(door2);
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 0.7), _mat(0x5e5a50));
    step.position.set(0, s * 0.25, 5.5 + s * 0.35);
    g.add(step);
  }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.1), _mat(0x2a2620));
  sign.position.set(0, 7.0, 5.1);
  sign.rotation.z = 0.08;
  g.add(sign);
  for (let i = 0; i < 14; i++) {
    const s = 0.3 + Math.random() * 0.9;
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.5, s), _mat(0x6a6458));
    chunk.position.set((Math.random() - 0.5) * 28, 0.2, (Math.random() - 0.5) * 12);
    chunk.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
    g.add(chunk);
  }
  return g;
}

/** Abandoned hospital – brutalist concrete, red cross */
function createAbandonedHospital() {
  const g = new THREE.Group();
  const concreteMat = _mat(0x8a8880, 0.96);
  const darkMat = _mat(0x3e3c38, 0.98);
  const wm = _mat(0x0b121a, 0.4, 0.2);
  const redMat = _mat(0x6b0f0f, 0.85);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(14, 18, 12), concreteMat);
  tower.position.y = 9;
  tower.castShadow = true; tower.receiveShadow = true;
  g.add(tower);
  const annex = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 12), concreteMat);
  annex.position.set(-12, 3.5, 0);
  annex.castShadow = true; annex.receiveShadow = true;
  g.add(annex);
  const roofMain = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.5, 12.5), darkMat);
  roofMain.position.y = 18.25;
  g.add(roofMain);
  const roofAnnex = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.5, 12.5), darkMat);
  roofAnnex.position.set(-12, 7.25, 0);
  g.add(roofAnnex);
  for (let fl = 1; fl < 4; fl++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.25, 12.2), darkMat);
    strip.position.y = fl * 4.5;
    g.add(strip);
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.15), wm);
      win.position.set(-4.5 + col * 3, 2.0 + row * 4.5, 6.08);
      g.add(win);
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.15), wm);
      win.position.set(-14.5 + col * 2.8, 1.8 + row * 3.0, 6.08);
      g.add(win);
    }
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 3), _mat(0x2a2826));
  canopy.position.set(0, 4, 7.7);
  canopy.castShadow = true;
  g.add(canopy);
  [[- 2.5], [2.5]].forEach(([px]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 8), darkMat);
    pillar.position.set(px, 2, 7.8);
    g.add(pillar);
  });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 0.15), redMat);
  crossV.position.set(5.5, 12, 6.1);
  g.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.15), redMat);
  crossH.position.set(5.5, 12, 6.1);
  g.add(crossH);
  for (let i = 0; i < 16; i++) {
    const s = 0.4 + Math.random() * 1.1;
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.45, s), _mat(0x787570));
    chunk.position.set((Math.random() - 0.5) * 18, 0.2, -8 + Math.random() * 5);
    chunk.rotation.y = Math.random() * Math.PI;
    g.add(chunk);
  }
  return g;
}

/** Cell phone / radio tower – lattice steel structure */
function createCellPhoneTower() {
  const g = new THREE.Group();
  const steelMat = _mat(0x9ca3a8, 0.6, 0.55, false);
  const towerH = 28;
  const levels = 10;

  // Vertical leg segments (tapered)
  for (let leg = 0; leg < 4; leg++) {
    const a = (leg / 4) * Math.PI * 2 + Math.PI / 4;
    for (let lv = 0; lv < levels; lv++) {
      const yBot = (lv / levels) * towerH;
      const yTop = ((lv + 1) / levels) * towerH;
      const rBot = 1.8 * (1 - (lv / levels) * 0.6);
      const rTop = 1.8 * (1 - ((lv + 1) / levels) * 0.6);
      const xBot = Math.cos(a) * rBot; const zBot = Math.sin(a) * rBot;
      const xTop = Math.cos(a) * rTop; const zTop = Math.sin(a) * rTop;
      const dx = xTop - xBot; const dy = yTop - yBot; const dz = zTop - zBot;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, len, 6), steelMat);
      seg.position.set((xBot + xTop) / 2, (yBot + yTop) / 2, (zBot + zTop) / 2);
      seg.lookAt(new THREE.Vector3(xTop, yTop + seg.position.y, zTop));
      seg.rotateX(Math.PI / 2);
      seg.castShadow = true;
      g.add(seg);
    }
  }

  // Horizontal ring braces
  for (let lv = 0; lv <= levels; lv += 2) {
    const y = (lv / levels) * towerH;
    const r = 1.8 * (1 - (lv / levels) * 0.6);
    for (let leg = 0; leg < 4; leg++) {
      const a1 = (leg / 4) * Math.PI * 2 + Math.PI / 4;
      const a2 = ((leg + 1) / 4) * Math.PI * 2 + Math.PI / 4;
      const x1 = Math.cos(a1) * r; const z1 = Math.sin(a1) * r;
      const x2 = Math.cos(a2) * r; const z2 = Math.sin(a2) * r;
      const dx = x2 - x1; const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), steelMat);
      brace.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      brace.rotation.y = Math.atan2(dx, dz);
      brace.rotation.z = Math.PI / 2;
      g.add(brace);
    }
  }

  // Panel antennas
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.08), _mat(0x8890a0, 0.5, 0.3));
    panel.position.set(Math.cos(a) * 0.6, towerH - 2, Math.sin(a) * 0.6);
    g.add(panel);
  }

  // Warning beacons
  const beaconGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const beaconMat = _mat(0xff3300, 0.3);
  [towerH + 0.3, towerH * 0.55].forEach(y => {
    const b = new THREE.Mesh(beaconGeo, beaconMat);
    b.position.y = y;
    g.add(b);
  });

  // Ground concrete pad
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 5), _mat(0x7a7870));
  base.position.y = 0.15;
  g.add(base);

  // Equipment shed
  const shed = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), _mat(0x5a6068, 0.9, 0.2));
  shed.position.set(3.5, 1, 0);
  shed.castShadow = true;
  g.add(shed);
  const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 2.4), _mat(0x3d4448));
  shedRoof.position.set(3.5, 2.1, 0);
  g.add(shedRoof);

  return g;
}





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

    // Weather & Sky settings
    this.weatherSetting = setupParams.settings ? setupParams.settings.weather || 'dynamic' : 'dynamic';
    this.currentWeather = 'sunny';
    this.weatherTimer = 0;
    this.weatherDuration = 30.0; // seconds per weather cycle state
    this.targetSkyColor = new THREE.Color(0x0a0c10);
    this.targetFogColor = new THREE.Color(0x0e1117);
    this.targetFogDensity = 0.012;
    this.targetSunIntensity = 1.3;
    this.targetSunColor = new THREE.Color(0xffedd5);
    this.lightningFlash = 0.0;
    this.lastLightningStrikeTime = 0;
    this.lightningBoltMesh = null;
    this.lightningLight = null;

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
    this.scene.background = new THREE.Color(0x0a0c10); 
    this.scene.fog = new THREE.FogExp2(0x0e1117, 0.012); 

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

  /**
   * Outdoor lighting: Sun + Ambient fill.
   */
  initLights() {
    const ambientLight = new THREE.AmbientLight(0x38475e, 1.4);
    this.scene.add(ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
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
    // 1. Terrain Ground plane scaled to 200x200 with 100x100 segments
    const groundGeo = new THREE.PlaneGeometry(220, 220, 100, 100);
    const count = groundGeo.attributes.position.count;
    
    // Apply displacement height map to vertices
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const height = getTerrainHeight(vx, -vy);
      posAttr.setZ(i, height); // set local z coordinate (becomes global y after rotation)
    }
    groundGeo.computeVertexNormals();

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
    
    const grassTex = createGrassTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05
    });
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Build 3D Scenery
    const sceneryCount = 200;
    for (let i = 0; i < sceneryCount; i++) {
      let x = (Math.random() - 0.5) * 190;
      let z = (Math.random() - 0.5) * 190;
      
      // Prevent spawning near player start center
      const distToCenter = Math.sqrt(x * x + z * z);
      if (distToCenter < 12) {
        x += (x >= 0 ? 12 : -12);
        z += (z >= 0 ? 12 : -12);
      }

      const randType = Math.random();
      let mesh, width, height, radius, isTree = false;
      const y = getTerrainHeight(x, z);

      if (randType < 0.45) {
        // 3D Broadleaf tree
        width = 4.5 + Math.random() * 2.0;
        height = 9.0 + Math.random() * 4.0;
        radius = 0.6;
        isTree = true;
        mesh = create3DBroadleafTree(width, height, radius);
      } else if (randType < 0.78) {
        // 3D Pine Conifer tree
        width = 3.5 + Math.random() * 1.5;
        height = 8.0 + Math.random() * 3.0;
        radius = 0.5;
        isTree = true;
        mesh = create3DPineTree(width, height, radius);
      } else {
        // 3D Stone
        width = 2.4 + Math.random() * 1.6;
        height = 2.4 + Math.random() * 1.6;
        radius = 0.9;
        isTree = false;
        mesh = create3DStone(width, height, radius);
      }

      mesh.position.set(x, y, z);
      // Give random rotation around Y for natural look
      mesh.rotation.y = Math.random() * Math.PI * 2;
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

    // 2b. Add grass clumps
    const grassCount = 400;
    for (let i = 0; i < grassCount; i++) {
      const x = (Math.random() - 0.5) * 190;
      const z = (Math.random() - 0.5) * 190;
      if (Math.sqrt(x * x + z * z) < 8) continue;
      
      const grass = create3DGrassClump();
      const y = getTerrainHeight(x, z);
      grass.position.set(x, y, z);
      
      const s = 0.75 + Math.random() * 0.5;
      grass.scale.set(s, s, s);
      grass.rotation.y = Math.random() * Math.PI * 2;
      
      this.scene.add(grass);
      this.scenery.push({
        mesh: grass,
        x: x,
        z: z,
        radius: 0,
        height: 0,
        isTree: true,
        swayPhase: Math.random() * Math.PI * 2
      });
    }
    // 2c. Place landmark buildings at fixed positions around the map
    const buildingDefs = [
      // Huts scattered throughout
      { fn: createHut,             x:  22,  z:  18 },
      { fn: createHut,             x: -35,  z:  12 },
      { fn: createHut,             x:  55,  z: -30 },
      { fn: createHut,             x: -60,  z: -50 },
      { fn: createHut,             x:  15,  z:  70 },
      { fn: createHut,             x: -20,  z: -80 },
      // Abandoned houses
      { fn: createAbandonedHouse,  x: -50,  z:  40 },
      { fn: createAbandonedHouse,  x:  65,  z:  20 },
      { fn: createAbandonedHouse,  x:  30,  z: -55 },
      { fn: createAbandonedHouse,  x: -75,  z: -20 },
      // Abandoned school – only 1 (big)
      { fn: createAbandonedSchool, x:  -5,  z:  60 },
      // Abandoned hospital – only 1 (tallest)
      { fn: createAbandonedHospital, x: 80,  z: -60 },
      // Cell phone towers at corners/edges
      { fn: createCellPhoneTower,  x:  85,  z:  85 },
      { fn: createCellPhoneTower,  x: -85,  z:  75 },
      { fn: createCellPhoneTower,  x:  70,  z: -85 },
    ];

    buildingDefs.forEach(({ fn, x, z }) => {
      const bldg = fn();
      const y = getTerrainHeight(x, z);
      bldg.position.set(x, y, z);
      bldg.rotation.y = Math.random() * Math.PI * 2;
      bldg.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(bldg);
      // Buildings act as solid obstacles (no sway, isTree=false)
      this.scenery.push({
        mesh: bldg,
        x, z,
        radius: 8,  // wide collision radius
        height: 10,
        isTree: false,
        swayPhase: 0
      });
    });


    // Add boundaries (invisible walls or stones at border)
    // Red marker light on sun for arena feel
    const boundaryGeo = new THREE.BoxGeometry(220, 8, 220);
    const boundaryWire = new THREE.BoxHelper(new THREE.Mesh(boundaryGeo), 0xf97316);
    boundaryWire.position.y = 4;
    this.scene.add(boundaryWire);


    // 3. Rain Particle System Setup
    const rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    
    // Distribute rain randomly within a 40x20x40 box
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 40;     // x
      rainPositions[i + 1] = Math.random() * 20;         // y
      rainPositions[i + 2] = (Math.random() - 0.5) * 40; // z
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd, // translucent blue-white
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false; // start hidden
    this.scene.add(this.rainParticles);
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
    const playerSpawnY = getTerrainHeight(0, 0);
    this.playerCharacter.position.set(0, playerSpawnY, 0);
    this.playerPos.set(0, playerSpawnY, 0);
    
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

      const enemySpawnY = getTerrainHeight(spawn.x, spawn.z);
      enemyMesh.position.set(spawn.x, enemySpawnY, spawn.z);
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
    // Show blocker initially to prompt user click
    if (this.blocker) {
      this.blocker.style.display = 'flex';
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
      if (!this.isPointerLocked) return;

      const sensitivity = 0.0022 * this.sensitivityMultiplier;
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch -= e.movementY * sensitivity;

      // Lock vertical look angle to prevent flipping
      this.cameraPitch = Math.max(-1.1, Math.min(0.35, this.cameraPitch));
    });

    // Mouse click -> Firing
    document.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked && e.button === 0) {
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

    const weatherInput = document.getElementById('setting-weather');
    if (weatherInput) {
      weatherInput.value = this.weatherSetting;
      weatherInput.addEventListener('change', (e) => {
        this.weatherSetting = e.target.value;
        this.weatherTimer = 0; // reset transition timers
        this.addKillLog(`WEATHER CONFIG: ${e.target.value.toUpperCase()}`);
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
    if (!this.isPointerLocked || this.playerHealth <= 0) return;

    // Movement Vectors relative to camera direction
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    
    const moveDir = new THREE.Vector3();
    if (this.keys.w) moveDir.add(forward);
    if (this.keys.s) moveDir.add(forward.clone().negate());
    if (this.keys.d) moveDir.add(right);
    if (this.keys.a) moveDir.add(right.clone().negate());

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      
      // Update target player velocities
      this.playerVelocity.copy(moveDir.multiplyScalar(this.playerSpeed));
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
    this.playerPos.y = getTerrainHeight(this.playerPos.x, this.playerPos.z);
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
   * Updates dynamic weather cycles, sky colors, fog densities, and lighting states.
   */
  updateWeatherSystem(time, delta) {
    // 1. Cycle weather dynamically if configured to dynamic
    if (this.weatherSetting === 'dynamic') {
      this.weatherTimer += delta;
      if (this.weatherTimer > this.weatherDuration) {
        this.weatherTimer = 0;
        
        // Cycle states: sunny -> cloudy -> stormy -> sunny
        if (this.currentWeather === 'sunny') {
          this.currentWeather = 'cloudy';
        } else if (this.currentWeather === 'cloudy') {
          this.currentWeather = 'stormy';
        } else {
          this.currentWeather = 'sunny';
        }
        
        this.addKillLog(`WEATHER INCOMING: ${this.currentWeather.toUpperCase()}`);
      }
    } else {
      this.currentWeather = this.weatherSetting;
    }

    // 2. Set target weather colors & intensities
    if (this.currentWeather === 'sunny') {
      this.targetSkyColor.setHex(0x141b27); // slate-blue sky
      this.targetFogColor.setHex(0x1a2130); // slate-grey fog
      this.targetFogDensity = 0.010; // slightly thinner fog
      this.targetSunIntensity = 2.2; // much brighter sunlight
      this.targetSunColor.setHex(0xffedd5); // warm peach sun
    } else if (this.currentWeather === 'cloudy') {
      this.targetSkyColor.setHex(0x273549); // light slate cloudy sky
      this.targetFogColor.setHex(0x2d3d54); // grey-blue fog
      this.targetFogDensity = 0.020; // thinner fog for visibility
      this.targetSunIntensity = 1.2; // brighter overcast
      this.targetSunColor.setHex(0xabc0d4); // cool slate grey light
    } else if (this.currentWeather === 'stormy') {
      this.targetSkyColor.setHex(0x11151e); // dark storm slate sky
      this.targetFogColor.setHex(0x151b26); // stormy fog
      this.targetFogDensity = 0.030; // slightly thinner fog for better view
      this.targetSunIntensity = 0.55; // brighter stormy sky
      this.targetSunColor.setHex(0x505b70); // slate grey light
    }

    // 3. Smoothly interpolate (lerp) scene parameters
    const lerpSpeed = 1.5 * delta;
    this.scene.background.lerp(this.targetSkyColor, lerpSpeed);
    this.scene.fog.color.lerp(this.targetFogColor, lerpSpeed);
    
    // Thicken/thin fog
    this.scene.fog.density += (this.targetFogDensity - this.scene.fog.density) * lerpSpeed;
    
    // Adjust sun light intensity and colors
    this.sunLight.intensity += (this.targetSunIntensity - this.sunLight.intensity) * lerpSpeed;
    this.sunLight.color.lerp(this.targetSunColor, lerpSpeed);

    // 4. Stormy lightning strike checks
    if (this.currentWeather === 'stormy') {
      const timeSinceLastStrike = time - this.lastLightningStrikeTime;
      // Trigger lightning randomly (at least 6s apart, with ~0.4% chance per frame)
      if (timeSinceLastStrike > 6.0 && Math.random() < 0.0045) {
        this.triggerLightning(time);
      }
    }

    // 5. Handle active lightning flash (boost fog/background brightness)
    if (this.lightningFlash > 0) {
      // Decay flash value
      this.lightningFlash -= 3.5 * delta;
      if (this.lightningFlash < 0) this.lightningFlash = 0;
      
      // Lerp sky background and fog colors to white-cyan
      const flashColor = new THREE.Color(0xd0e8ff);
      this.scene.background.lerp(flashColor, this.lightningFlash);
      this.scene.fog.color.lerp(flashColor, this.lightningFlash);
      
      // Brighten sun temporarily
      this.sunLight.intensity += this.lightningFlash * 6.0;
    }
  }

  /**
   * Spawns a procedural jagged lightning bolt mesh and triggers sky illumination.
   * @param {number} time - Elapsed time in seconds
   */
  triggerLightning(time) {
    this.lastLightningStrikeTime = time;
    
    // Strike point relative to player coordinates (within 50 units)
    const offsetX = (Math.random() - 0.5) * 80;
    const offsetZ = (Math.random() - 0.5) * 80;
    const startX = this.playerPos.x + offsetX;
    const startZ = this.playerPos.z + offsetZ;
    
    // Jagged lightning bolt mesh generation
    const segments = 10;
    const start = new THREE.Vector3(startX, 26, startZ);
    const end = new THREE.Vector3(startX + (Math.random() - 0.5) * 15, 0, startZ + (Math.random() - 0.5) * 15);
    
    const points = [];
    points.push(start.clone());
    
    // Generate intermediate jagged coordinates
    for (let i = 1; i < segments; i++) {
      const ratio = i / segments;
      const mid = new THREE.Vector3().lerpVectors(start, end, ratio);
      
      // Add jagged offset noise perpendicular to falling direction
      const noise = 2.4;
      mid.x += (Math.random() - 0.5) * noise;
      mid.z += (Math.random() - 0.5) * noise;
      points.push(mid);
    }
    points.push(end.clone());
    
    // Construct Cylinder Segment meshes for the bolt
    const boltGroup = new THREE.Group();
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.95 });
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = p1.distanceTo(p2);
      
      // Thicker cylinders at top, tapering down
      const radius = 0.12 * (1.0 - (i / segments) * 0.5);
      const geom = new THREE.CylinderGeometry(radius, radius, dist, 4);
      geom.rotateX(Math.PI / 2);
      geom.translate(0, 0, dist / 2);
      
      const mesh = new THREE.Mesh(geom, boltMat);
      mesh.position.copy(p1);
      mesh.lookAt(p2);
      boltGroup.add(mesh);
    }
    
    this.scene.add(boltGroup);
    this.lightningBoltMesh = boltGroup;
    
    // Trigger intense environment flash overlay
    this.lightningFlash = 1.0;
    this.addKillLog("⚡ ATMOSPHERIC LIGHTNING DETECTED");
    
    // Point light at strike impact site
    const light = new THREE.PointLight(0xd0e8ff, 35, 70);
    light.position.copy(end);
    this.scene.add(light);
    this.lightningLight = light;
    
    // Dispose resources after a brief visual delay (150ms)
    setTimeout(() => {
      if (this.lightningBoltMesh) {
        this.scene.remove(this.lightningBoltMesh);
        this.lightningBoltMesh.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          }
        });
        this.lightningBoltMesh = null;
      }
      if (this.lightningLight) {
        this.scene.remove(this.lightningLight);
        this.lightningLight = null;
      }
    }, 150);
  }

  /**
   * AI patrol navigation + firing at player.
   */
  updateEnemies(time, delta) {
    this.enemies.forEach((enemy) => {
      const { mesh, patrolCenter, patrolRadius, patrolSpeed, phase } = enemy;

      // Always snap enemy vertical position to the terrain height
      mesh.position.y = getTerrainHeight(mesh.position.x, mesh.position.z);

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

          // Raycast / line of sight check (incorporating player torso height difference)
          const dy = (this.playerPos.y + 0.8) - enemyMuzzle.y;
          const shootDir = new THREE.Vector3(dx, dy, dz).normalize();
          const ray = new THREE.Raycaster(enemyMuzzle, shootDir, 0.1, 26);
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

        const nextY = getTerrainHeight(nextX, nextZ);
        mesh.position.set(nextX, nextY, nextZ);

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

    // 3. 3D Scenery wind sway
    this.scenery.forEach((item) => {
      const { mesh, isTree, swayPhase } = item;

      if (isTree) {
        // Wind-swaying rotation around local Z or X axis (since it's a 3D group, let's use Z and X)
        const windSpeed = 2.4;
        const windSway = Math.sin(time * windSpeed + swayPhase) * 0.045; // 0.045 rad sway
        const windSwayX = Math.cos(time * windSpeed * 0.8 + swayPhase) * 0.03; 
        
        // We preserve the random Y rotation set during init
        mesh.rotation.z = windSway;
        mesh.rotation.x = windSwayX;
      }
    });

    // 4. Rain Particles simulation update (velocity falling & wrapping)
    if (this.currentWeather === 'stormy') {
      this.rainParticles.visible = true;
      
      const geom = this.rainParticles.geometry;
      const positions = geom.attributes.position.array;
      const count = positions.length;
      
      const fallSpeed = 16.0;
      for (let i = 1; i < count; i += 3) {
        positions[i] -= fallSpeed * delta; // falling down (y component)
        
        // Wrap back up if hitting ground
        if (positions[i] < 0) {
          positions[i] = 20.0 + Math.random() * 2;
          // Randomize offset values
          positions[i - 1] = (Math.random() - 0.5) * 40;
          positions[i + 1] = (Math.random() - 0.5) * 40;
        }
      }
      
      geom.attributes.position.needsUpdate = true;
      
      // Center rain group to follow player in all axes
      this.rainParticles.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    } else {
      this.rainParticles.visible = false;
    }
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
    this.updateWeatherSystem(time, delta);
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
