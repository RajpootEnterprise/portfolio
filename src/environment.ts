import * as THREE from 'three';
import { state } from './state';
import { COLORS, HEIGHTS, roomPositions } from './constants';

export function setupLights() {
  // Warm Ambient
  state.ambientLight = new THREE.AmbientLight(0xfff6eb, 1.2);
  state.scene.add(state.ambientLight);

  // Daylight Sun
  state.sunLight = new THREE.DirectionalLight(0xfff9e6, 1.4);
  state.sunLight.position.set(12, 18, 10);
  state.sunLight.castShadow = true;
  
  state.sunLight.shadow.mapSize.width = 2048;
  state.sunLight.shadow.mapSize.height = 2048;
  state.sunLight.shadow.camera.near = 0.5;
  state.sunLight.shadow.camera.far = 40;
  
  const d = 12;
  state.sunLight.shadow.camera.left = -d;
  state.sunLight.shadow.camera.right = d;
  state.sunLight.shadow.camera.top = d;
  state.sunLight.shadow.camera.bottom = -d;
  state.sunLight.shadow.bias = -0.0004;
  state.scene.add(state.sunLight);

  // Moonlight
  state.moonLight = new THREE.DirectionalLight(0x8a9ec4, 0.0);
  state.moonLight.position.set(-12, 18, 14);
  state.moonLight.castShadow = true;
  state.moonLight.shadow.mapSize.width = 1024;
  state.moonLight.shadow.mapSize.height = 1024;
  state.scene.add(state.moonLight);

  // Helper to add interior spots
  const addRoomSpot = (x: number, y: number, z: number) => {
    const spot = new THREE.PointLight(0xffecd2, 0.1, 7.5);
    spot.position.set(x, y - 0.15, z);
    spot.castShadow = true;
    spot.shadow.bias = -0.002;
    state.houseGroup.add(spot);
    state.roomLights.push(spot);

    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.12, 8), fixtureMat);
    fixture.position.set(x, y + 0.06, z);
    fixture.castShadow = false;
    fixture.receiveShadow = false;
    state.houseGroup.add(fixture);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bulbMat);
    bulb.position.set(x, y, z);
    bulb.castShadow = false;
    bulb.receiveShadow = false;
    state.houseGroup.add(bulb);
    state.bulbMeshes.push(bulb);
  };

  addRoomSpot(-3.5, 2.1, 1.2);  // Home
  addRoomSpot(3.5, 2.1, 1.2);   // Contact
  addRoomSpot(-3.5, 4.3, -0.6); // About
  addRoomSpot(3.5, 4.3, -0.6);  // Timeline
  addRoomSpot(-3.5, 6.6, -0.6); // Projects
  addRoomSpot(3.5, 6.6, -0.6);  // Skills

  // Fireplace light
  state.fireplaceLight = new THREE.PointLight(COLORS.fireGlow, 0.0, 4.0);
  state.fireplaceLight.position.set(5.5, HEIGHTS.first + 0.15, 0.2);
  state.fireplaceLight.castShadow = true;
  state.houseGroup.add(state.fireplaceLight);

  // Street lamp light
  state.streetLampLight = new THREE.PointLight(COLORS.lampLight, 0.1, 6.0);
  state.streetLampLight.position.set(5.5, HEIGHTS.ground + 2.06, 2.48);
  state.streetLampLight.castShadow = true;
  state.houseGroup.add(state.streetLampLight);

  // Study desk lamp light
  state.deskLampLight = new THREE.PointLight(0xffecd2, 0.0, 3.0);
  state.deskLampLight.position.set(-4.2, HEIGHTS.first + 1.06, -2.23);
  state.deskLampLight.castShadow = true;
  state.houseGroup.add(state.deskLampLight);
}

export function createHelipad() {
  state.helipad = new THREE.Group();
  state.helipad.position.set(-3.75, HEIGHTS.second + 2.2, 0);

  const platformGeo = new THREE.CylinderGeometry(1.75, 1.75, 0.04, 32);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.receiveShadow = true;
  platform.castShadow = true;
  state.helipad.add(platform);

  const borderGeo = new THREE.TorusGeometry(1.70, 0.04, 8, 32);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = Math.PI / 2;
  border.position.y = 0.025;
  state.helipad.add(border);

  const hGroup = new THREE.Group();
  hGroup.position.y = 0.022;
  
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barL.position.x = -0.3;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.9), lineMat);
  barR.position.x = 0.3;
  const barC = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.005, 0.16), lineMat);
  
  hGroup.add(barL, barR, barC);
  state.helipad.add(hGroup);

  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), strutMat);
      mount.position.set(i * 1.2, -0.04, j * 1.2);
      mount.castShadow = true;
      state.helipad.add(mount);
    }
  }

  state.houseGroup.add(state.helipad);
}

export function createHelicopter() {
  state.helicopter = new THREE.Group();
  state.helicopter.position.set(-3.75, HEIGHTS.second + 3.56, 0);

  const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
  bodyGeo.scale(1.4, 1.0, 1.0);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  state.helicopter.add(body);

  const canopyGeo = new THREE.SphereGeometry(0.24, 16, 16);
  canopyGeo.scale(1.2, 0.8, 1.0);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.9
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0.22, 0.06, 0);
  state.helicopter.add(canopy);

  const boomGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8);
  const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5 });
  const boom = new THREE.Mesh(boomGeo, boomMat);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(-0.75, 0.05, 0);
  boom.castShadow = true;
  state.helicopter.add(boom);

  const finGeo = new THREE.BoxGeometry(0.06, 0.32, 0.12);
  const finMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
  const fin = new THREE.Mesh(finGeo, finMat);
  fin.position.set(-1.22, 0.18, 0);
  fin.castShadow = true;
  state.helicopter.add(fin);

  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(0.0, 0.4, 0);
  shaft.castShadow = true;
  state.helicopter.add(shaft);

  state.mainRotor = new THREE.Group();
  state.mainRotor.position.set(0.0, 0.49, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.5 });
  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 0.08), bladeMat);
  bladeL.castShadow = true;
  const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 1.8), bladeMat);
  bladeR.castShadow = true;
  state.mainRotor.add(bladeL, bladeR);
  state.helicopter.add(state.mainRotor);

  state.tailRotor = new THREE.Group();
  state.tailRotor.position.set(-1.22, 0.18, 0.08);
  const tBladeGeo = new THREE.BoxGeometry(0.01, 0.34, 0.03);
  const tBladeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const tBlade1 = new THREE.Mesh(tBladeGeo, tBladeMat);
  const tBlade2 = new THREE.Mesh(tBladeGeo, tBladeMat);
  tBlade2.rotation.x = Math.PI / 2;
  state.tailRotor.add(tBlade1, tBlade2);
  state.helicopter.add(state.tailRotor);

  const skidMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
  
  const skidL = new THREE.Group();
  const leg1L = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg1L.position.set(0.15, -0.22, 0.18);
  leg1L.rotation.z = -0.2;
  const leg2L = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg2L.position.set(-0.25, -0.22, 0.18);
  leg2L.rotation.z = 0.2;
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.03), skidMat);
  barL.position.set(-0.05, -0.3, 0.18);
  barL.castShadow = true;
  skidL.add(leg1L, leg2L, barL);
  state.helicopter.add(skidL);

  const skidR = new THREE.Group();
  const leg1R = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg1R.position.set(0.15, -0.22, -0.18);
  leg1R.rotation.z = -0.2;
  const leg2R = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16), skidMat);
  leg2R.position.set(-0.25, -0.22, -0.18);
  leg2R.rotation.z = 0.2;
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.03), skidMat);
  barR.position.set(-0.05, -0.3, -0.18);
  barR.castShadow = true;
  skidR.add(leg1R, leg2R, barR);
  state.helicopter.add(skidR);

  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  const thrusterL = new THREE.Group();
  const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), nozzleMat);
  nozzleL.rotation.z = Math.PI / 2;
  const fireL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  fireL.scale.set(0.1, 1.8, 1.0);
  fireL.rotation.z = Math.PI / 2;
  fireL.position.x = -0.12;
  thrusterL.add(nozzleL, fireL);
  thrusterL.position.set(-0.35, -0.06, 0.28);
  state.helicopter.add(thrusterL);

  const thrusterR = new THREE.Group();
  const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), nozzleMat);
  nozzleR.rotation.z = Math.PI / 2;
  const fireR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glowMat);
  fireR.scale.set(0.1, 1.8, 1.0);
  fireR.rotation.z = Math.PI / 2;
  fireR.position.x = -0.12;
  thrusterR.add(nozzleR, fireR);
  thrusterR.position.set(-0.35, -0.06, -0.28);
  state.helicopter.add(thrusterR);

  thrusterL.userData = { fire: fireL };
  thrusterR.userData = { fire: fireR };
  
  state.thrusterFireL = fireL;
  state.thrusterFireR = fireR;
  
  fireL.scale.set(0.001, 0.001, 0.001);
  fireR.scale.set(0.001, 0.001, 0.001);

  state.scene.add(state.helicopter);
}

export function createSpaceCity() {
  state.cityGroup = new THREE.Group();
  
  const baseGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.15, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const cityBase = new THREE.Mesh(baseGeo, baseMat);
  cityBase.position.set(8.0, 12.5, -24.0);
  cityBase.receiveShadow = true;
  cityBase.castShadow = true;
  state.cityGroup.add(cityBase);

  const ringGeo = new THREE.TorusGeometry(3.7, 0.04, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.set(8.0, 12.58, -24.0);
  state.cityGroup.add(glowRing);

  const buildingSpecs = [
    { rx: -2.0, rz: -2.0, h: 2.5, color: 0x222533, lightColor: 0x3b82f6 },
    { rx: -0.8, rz: -2.4, h: 3.2, color: 0x181a24, lightColor: 0x10b981 },
    { rx: 1.0, rz: -2.4, h: 2.2, color: 0x272b3c, lightColor: 0xeab308 },
    { rx: 2.2, rz: -1.2, h: 3.0, color: 0x1e202b, lightColor: 0x6366f1 },
    { rx: 2.4, rz: 0.5, h: 2.8, color: 0x222533, lightColor: 0xec4899 },
    { rx: 1.4, rz: 2.0, h: 3.8, color: 0x181a24, lightColor: 0x06b6d4 },
    { rx: -0.4, rz: 2.4, h: 2.4, color: 0x272b3c, lightColor: 0xa855f7 },
    { rx: -2.0, rz: 1.8, h: 3.4, color: 0x1e202b, lightColor: 0xef4444 },
    { rx: -2.5, rz: -0.2, h: 2.8, color: 0x222533, lightColor: 0x10b981 },
    { rx: 0.0, rz: 0.0, h: 4.2, color: 0x0f111a, lightColor: 0xeab308 } // Center tower
  ];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.5, metalness: 0.8 });

  buildingSpecs.forEach((spec, i) => {
    const bW = i === 9 ? 0.95 : 0.75;
    const bGeo = new THREE.BoxGeometry(bW, spec.h, bW);
    const bMat = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.85, roughness: 0.15 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(8.0 + spec.rx, 12.5 + spec.h / 2, -24.0 + spec.rz);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    state.cityGroup.add(bMesh);

    const stripeCount = Math.floor(spec.h / 0.55);
    for (let j = 1; j < stripeCount; j++) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(bW + 0.02, 0.04, bW + 0.02),
        new THREE.MeshBasicMaterial({ color: spec.lightColor })
      );
      band.position.set(
        8.0 + spec.rx,
        12.5 + j * 0.55,
        -24.0 + spec.rz
      );
      state.cityGroup.add(band);
    }

    const padRadius = i === 9 ? 0.32 : 0.25;
    const padGroup = new THREE.Group();
    padGroup.position.set(8.0 + spec.rx, 12.5 + spec.h + 0.005, -24.0 + spec.rz);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(padRadius, padRadius, 0.01, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    padGroup.add(plate);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(padRadius - 0.015, 0.008, 4, 16),
      new THREE.MeshBasicMaterial({ color: spec.lightColor })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.006;
    padGroup.add(ring);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.001, 0.12), lineMat);
    hL.position.set(-0.04, 0.007, 0);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.001, 0.12), lineMat);
    hR.position.set(0.04, 0.007, 0);
    const hC = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.001, 0.02), lineMat);
    hC.position.set(0, 0.007, 0);
    padGroup.add(hL, hR, hC);

    state.cityGroup.add(padGroup);

    state.cityHelipads.push(new THREE.Vector3(
      8.0 + spec.rx,
      12.5 + spec.h + 0.02,
      -24.0 + spec.rz
    ));

    if (i % 2 === 1) {
      const antenna = new THREE.Group();
      antenna.position.set(8.0 + spec.rx - 0.22, 12.5 + spec.h, -24.0 + spec.rz - 0.22);
      
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.015, 0.4, 8),
        frameMat
      );
      mast.position.y = 0.2;
      antenna.add(mast);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      tip.position.y = 0.4;
      antenna.add(tip);

      state.cityGroup.add(antenna);
    }
  });

  state.cityGroup.scale.set(0.001, 0.001, 0.001);
  state.scene.add(state.cityGroup);
}

export function createRoomLabels() {
  const labelTextMap = {
    home: 'Home Lobby',
    contact: 'Mail Patio',
    about: 'Study Desk',
    timeline: 'Library',
    projects: 'Tech Workshop',
    skills: 'Retro Arcade'
  };

  const createTextTexture = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    if (ctx.roundRect) ctx.roundRect(0, 0, 256, 64, 16); else ctx.rect(0, 0, 256, 64);
    ctx.fill();

    ctx.strokeStyle = '#3d405b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#3d405b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  Object.entries(roomPositions).forEach(([roomName, pos]) => {
    const labelGroup = new THREE.Group();

    const textTex = createTextTexture(labelTextMap[roomName as keyof typeof labelTextMap]);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.26),
      new THREE.MeshBasicMaterial({ map: textTex, transparent: true, side: THREE.DoubleSide })
    );
    board.position.y = 0.15;
    labelGroup.add(board);

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x3d405b })
    );
    labelGroup.add(rod);

    const floatY = pos.h + (roomName === 'home' || roomName === 'contact' ? 1.6 : 1.3);
    labelGroup.position.set(pos.stand.x, floatY, pos.stand.z);
    
    labelGroup.userData = { 
      roomName: roomName,
      baseY: floatY,
      phase: Math.random() * Math.PI 
    };

    labelGroup.traverse(child => {
      child.userData = { roomName: roomName };
      if (child instanceof THREE.Mesh) {
        state.interactiveObjects.push(child);
      }
    });

    state.scene.add(labelGroup);
    state.floatingLabels.push(labelGroup as any);
  });
}

export function createCelestialEnvironment() {
  // 1. Sun Group
  state.sunGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd27d })
  );
  state.sunGroup.add(sunMesh);
  
  const sunHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.4, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3cc, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  state.sunGroup.add(sunHalo);
  state.sunGroup.position.set(22, 18, -18);
  state.scene.add(state.sunGroup);

  // 2. Moon Group
  state.moonGroup = new THREE.Group();
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xe6e8ea })
  );
  state.moonGroup.add(moonMesh);
  
  const moonHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 16),
    new THREE.MeshBasicMaterial({ color: 0xa8dadc, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  state.moonGroup.add(moonHalo);
  state.moonGroup.position.set(-20, -8, 20);
  state.scene.add(state.moonGroup);

  // 3. Multi-Planet Space System Container
  state.planetGroup = new THREE.Group();
  
  const addPlanet = (name: string, color: number, center: THREE.Vector3, radius: number, hasRings = false, ringColor = 0xffffff) => {
    const pGroup = new THREE.Group();
    pGroup.position.copy(center);
    
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: name === 'Neptune' ? 0.35 : 0.75,
      metalness: name === 'Neptune' ? 0.25 : 0.05
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 24), sphereMat);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    pGroup.add(sphere);

    if (hasRings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.25, radius * 1.85, 32),
        new THREE.MeshStandardMaterial({ color: ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = Math.PI / 3.2;
      pGroup.add(ring);
    }

    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.5 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), padMat);
    pad.position.y = radius + 0.015;
    pad.castShadow = true;
    pGroup.add(pad);

    const border = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.008, 4, 16),
      new THREE.MeshBasicMaterial({ color: name === 'Venus' ? 0xeab308 : 0x06b6d4 })
    );
    border.rotation.x = Math.PI / 2;
    border.position.y = radius + 0.031;
    pGroup.add(border);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), lineMat);
    hL.position.set(-0.04, radius + 0.032, 0);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.08), lineMat);
    hR.position.set(0.04, radius + 0.032, 0);
    const hC = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.001, 0.015), lineMat);
    hC.position.set(0, radius + 0.032, 0);
    pGroup.add(hL, hR, hC);

    state.planetGroup.add(pGroup);
    state.planetList.push(pGroup);
  };

  addPlanet('Saturn', 0xe07a5f, new THREE.Vector3(-18, 15, -22), 1.8, true, 0xfdf0d5);
  addPlanet('Mars', 0xc32f27, new THREE.Vector3(-6, 17, -26), 1.5);
  addPlanet('Neptune', 0x1d3557, new THREE.Vector3(8, 16, -24), 1.6, true, 0x8ecae6);
  addPlanet('Venus', 0xeab308, new THREE.Vector3(18, 14, -18), 1.4);

  state.planetGroup.scale.set(0.001, 0.001, 0.001);
  state.scene.add(state.planetGroup);

  // 4. Starfield Particles
  const starGeo = new THREE.BufferGeometry();
  const starCount = 180;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const angleU = Math.random() * Math.PI * 2;
    const angleV = Math.random() * Math.PI * 0.4 + 0.1;
    const dist = 35 + Math.random() * 8;
    positions[i * 3] = dist * Math.cos(angleU) * Math.sin(angleV);
    positions[i * 3 + 1] = dist * Math.cos(angleV) + 6.0;
    positions[i * 3 + 2] = dist * Math.sin(angleU) * Math.sin(angleV);
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.0
  });
  state.starPoints = new THREE.Points(starGeo, starMat);
  state.scene.add(state.starPoints);

  // 5. Flapping Flying Birds Group
  state.birdsGroup = new THREE.Group();
  const birdColor = new THREE.MeshLambertMaterial({ color: 0x3d405b });
  
  for (let i = 0; i < 3; i++) {
    const bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), birdColor);
    bird.add(body);
    
    const leftWingGeom = new THREE.PlaneGeometry(0.16, 0.06);
    leftWingGeom.translate(-0.08, 0, 0);
    const leftWing = new THREE.Mesh(leftWingGeom, birdColor);
    leftWing.position.set(-0.02, 0.01, 0);
    bird.add(leftWing);
    
    const rightWingGeom = new THREE.PlaneGeometry(0.16, 0.06);
    rightWingGeom.translate(0.08, 0, 0);
    const rightWing = new THREE.Mesh(rightWingGeom, birdColor);
    rightWing.position.set(0.02, 0.01, 0);
    bird.add(rightWing);

    bird.userData = {
      offset: i * 2.1,
      leftWing: leftWing,
      rightWing: rightWing
    };

    state.birdsGroup.add(bird);
    state.birdsList.push(bird);
  }
  state.scene.add(state.birdsGroup);

  // 6. Spaceships & UFOs Fleet in Outer Space
  const addUFO = (x: number, y: number, z: number, scale = 1.0) => {
    const ufo = new THREE.Group();
    ufo.position.set(x, y, z);
    ufo.scale.set(scale, scale, scale);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 0.15, 12), bodyMat);
    disk.scale.set(1, 1.4, 1);
    ufo.add(disk);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 0.08, 12), bodyMat);
    rim.position.y = -0.06;
    ufo.add(rim);

    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      transmission: 0.9,
      ior: 1.4,
      roughness: 0.1,
      metalness: 0.1
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 0.07;
    ufo.add(dome);

    const glowLights: THREE.Mesh[] = [];
    const lightColor = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lightColor.clone());
      bulb.position.set(Math.cos(angle) * 0.88, -0.02, Math.sin(angle) * 0.88);
      ufo.add(bulb);
      glowLights.push(bulb);
    }
    
    ufo.userData = {
      glowLights,
      pulseSpeed: 4.0 + Math.random() * 2.0,
      hoverOffset: Math.random() * 10,
      orbitCenter: new THREE.Vector3(x, y, z),
      orbitRadius: 2.5 + Math.random() * 3.0,
      orbitSpeed: 0.25 + Math.random() * 0.2
    };

    state.scene.add(ufo);
    state.ufoList.push(ufo);
  };

  const addSpaceship = (x: number, y: number, z: number, colorHex: number, scale = 1.0) => {
    const ship = new THREE.Group();
    ship.position.set(x, y, z);
    ship.scale.set(scale, scale, scale);

    const shipMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 8), shipMat);
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    const wingGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0.0, 0.0, 0.2,     
      -0.6, -0.1, -0.4,  
      0.0, 0.0, -0.2,    
      
      0.0, 0.0, 0.2,     
      0.6, -0.1, -0.4,   
      0.0, 0.0, -0.2     
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingGeo.computeVertexNormals();
    const wing = new THREE.Mesh(wingGeo, shipMat);
    ship.add(wing);

    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.22, 6), thrusterMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 0, -0.6);
    ship.add(thruster);

    ship.userData = {
      orbitCenter: new THREE.Vector3(x, y, z),
      orbitRadius: 3.5 + Math.random() * 4.0,
      orbitSpeed: 0.15 + Math.random() * 0.15,
      orbitYScale: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    };

    state.scene.add(ship);
    state.spaceshipList.push(ship);
  };

  // Add 3 UFOs orbiting around Saturn, Mars, and Neptune
  addUFO(-18, 17, -22, 0.95);
  addUFO(-6, 19, -26, 0.8);
  addUFO(8, 18, -24, 0.85);

  // Add 3 Sleek Spaceships orbiting Venus and Saturn
  addSpaceship(18, 16, -18, 0xef4444, 0.8);   // Red Fighter
  addSpaceship(10, 15, -20, 0x3b82f6, 0.95);  // Blue Explorer
  addSpaceship(-14, 18, -20, 0x10b981, 0.75); // Green Scout
}
